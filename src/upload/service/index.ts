import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MusicMetadata, MusicMetadataDto } from '../../music/entities';
import { RedisService } from '../../redis/service';
import { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull/dist';
import { RedisClientType } from 'redis/dist';
import * as path from 'path';
import * as fs from 'fs';
export interface UploadChunkResult {
  success: boolean;
  message: string;
  chunkCount: number;
  totalChunks: number;
  id: string;
  progress: number;
  status: string;
}
@Injectable()
export class UploadService {
  constructor(
    @InjectRepository(MusicMetadata)
    private readonly musicMetadataRepository: Repository<MusicMetadata>,
    @InjectQueue('file-merge-queue') private readonly fileMergeQueue: Queue,
    @Inject('REDIS_CLIENT') private readonly redisClient: RedisClientType
  ) {}

  /**
   * 上传文件相关操作
   * 
   * */
  // 存储文件分片
  async storeChunk(
    fileId: string,
    chunkIndex: number,
    chunkData: Buffer,
    totalChunks: number,
    belongId: string

  ): Promise<UploadChunkResult> {
    
    const pipeline = this.redisClient.multi();

    // 存储分片数据 - 使用正确的hSet语法
    pipeline.hSet(belongId ? `image:${belongId}:chunks` : `file:${fileId}:chunks`,
      chunkIndex.toString(),
      chunkData.toString('base64')
    );

    // 设置分片数据的过期时间(30分钟)
    pipeline.expire(belongId ? `image:${belongId}:chunks` : `file:${fileId}:chunks`, 1800);

    // 更新分片元数据 - 分别设置每个字段，避免对象语法问题
    pipeline.hSet(belongId ? `image:${belongId}:meta` : `file:${fileId}:meta`, 'totalChunks', totalChunks.toString());
    pipeline.hSet(belongId ? `image:${belongId}:meta` : `file:${fileId}:meta`, 'lastUpdated', Date.now().toString());

    // 设置元数据的过期时间(30分钟)
    pipeline.expire(belongId ? `image:${belongId}:meta` : `file:${fileId}:meta`, 1800);

    try {
      await pipeline.exec();
    } catch (error) {
      throw error;
    }
    // 检查是否所有分片都已上传
    const chunkCount = await this.redisClient.hLen(belongId ? `image:${belongId}:chunks` : `file:${fileId}:chunks`);
   
    if (chunkCount === totalChunks) {
      await this.fileMergeQueue.add('merge-file', { fileId, belongId });
      return {
        success: true,
        message: '所有分片都已上传，加入合并队列',
        chunkCount,
        totalChunks,
        id: fileId,
        progress: chunkCount / totalChunks * 100,
        status: 'completed'
      };
    }
    return {
      success: false,
      message: '分片数量不匹配，等待更多分片...',
      chunkCount,
      totalChunks,
      id: fileId,
      progress: chunkCount / totalChunks * 100,
      status: 'uploading'
    };

  }

  // 合并文件分片（更新TTL）
  async mergeChunks(fileId: string, belongId: string): Promise<void> {
    const pipeline = this.redisClient.multi();

    // 获取所有分片
    pipeline.hGetAll(belongId ? `image:${belongId}:chunks` : `file:${fileId}:chunks`);
    pipeline.hGetAll(belongId ? `image:${belongId}:meta` : `file:${fileId}:meta`);

    const [chunksResult, metaResult] = await pipeline.exec();

    const chunks = this.normalizeRedisResponse(chunksResult);
    const meta = this.normalizeRedisResponse(metaResult);
    const totalChunks = parseInt(meta.totalChunks, 10);
    // 合并分片
    const sortedChunks = Array.from({ length: totalChunks }, (_, i) => i)
      .map((i) => chunks[i.toString()])
      .filter(Boolean);

    const mergedBuffer = Buffer.concat(
      sortedChunks.map((chunk) => Buffer.from(chunk, 'base64'))
    );

    // 存储合并文件并设置TTL
    await this.redisClient.setEx(
      belongId ? `image:${belongId}:merged` :  `file:${fileId}:merged`,
      1800, // 30分钟TTL
      mergedBuffer.toString('base64')
    );

    // 可以保留分片数据让其自动过期
    // 或者立即删除分片数据但保留元数据
    // await this.redisClient.del(`file:${fileId}:chunks`);
  }

  // 用户确认后写入硬盘（更新TTL处理）
  async confirmAndSave(fileId: string): Promise<{ mp3FullPath: string, coverFullPath: string }> {
    // 尝试查找音频文件
    const mergedMp3File = await this.redisClient.get(`file:${fileId}:merged`);
    // 尝试查找封面图片 - 检查多种可能的键
    let mergedCoverFile = null;
    const possibleCoverKeys = [
      `image:${fileId}:merged`,
      `image:${fileId}:chunks`,
      `cover:${fileId}:merged`,
      `cover:${fileId}:chunks`,
    ];
    
    for (const key of possibleCoverKeys) {
      const result = await this.redisClient.get(key);
      if (result) {
        mergedCoverFile = result;
        break;
      }
    }
    
    // 如果没找到合并文件，检查分片数据
    if (!mergedCoverFile) {
      for (const key of possibleCoverKeys) {
        if (key.includes(':chunks')) {
          const chunks = await this.redisClient.hGetAll(key);
          if (Object.keys(chunks).length > 0) {
            // 如果有分片数据，先合并
            const belongId = key.includes('image:') ? fileId : fileId;
            await this.mergeChunks(fileId, belongId);
            mergedCoverFile = await this.redisClient.get(`image:${fileId}:merged`);
            break;
          }
        }
      }
    }
    
    // 与 main.ts 中 useStaticAssets 的根路径保持一致，统一使用 process.cwd()/public
    const mp3SavePath = path.join(process.cwd(), '..', '..', 'music_files', fileId);
    const coverSavePath = path.join(process.cwd(), '..', '..', 'cover_files', fileId);
    
    // 确保目录存在
    if (!fs.existsSync(mp3SavePath)) {
      fs.mkdirSync(mp3SavePath, { recursive: true });
    }
    if (!fs.existsSync(coverSavePath)) {
      fs.mkdirSync(coverSavePath, { recursive: true });
    }

    let mp3FullPath = '';
    let coverFullPath = '';

    // 处理音频文件
    if (mergedMp3File) {
      const mp3Buffer = Buffer.from(mergedMp3File as string, 'base64');
      const mp3FileName = `${fileId}.mp3`;
      const mp3ActualPath = path.join(mp3SavePath, mp3FileName);
      fs.writeFileSync(mp3ActualPath, mp3Buffer);
      console.log('音频文件已保存到:', mp3ActualPath);
      // 转换为相对路径格式
      mp3FullPath = `/music_files/${fileId}/${mp3FileName}`;
    } else {
      console.log('音频文件未找到');
      mp3FullPath = '';
    }

    // 处理封面图片
    if (mergedCoverFile) {
      const coverBuffer = Buffer.from(mergedCoverFile as string, 'base64');
      const coverFileName = `${fileId}.jpg`;
      const coverActualPath = path.join(coverSavePath, coverFileName);
      fs.writeFileSync(coverActualPath, coverBuffer);
      console.log('封面图片已保存到:', coverActualPath);
      // 转换为相对路径格式
      coverFullPath = `/cover_files/${fileId}/${coverFileName}`;
    } else {
      console.log('封面图片未找到');
      coverFullPath = '';
    }

    // 清理所有相关数据（不再等待自动过期）
    await this.cleanupFileData(fileId);
    
    return {
      mp3FullPath,
      coverFullPath
    };
  }

  // 更新清理方法
  private async cleanupFileData(fileId: string): Promise<void> {
    const keys = [
      `image:${fileId}:chunks`,
      `file:${fileId}:chunks`,
      `image:${fileId}:meta`,
      `file:${fileId}:meta`,
      `image:${fileId}:merged`,
      `file:${fileId}:merged`
    ];

    await this.redisClient.del(keys);
  }
  // 获取上传进度
  async getUploadProgress(fileId: string, belongId: string): Promise<{ uploaded: number; total: number }> {
    const [uploaded, meta] = await Promise.all([
      this.redisClient.hLen(belongId ? `image:${belongId}:chunks` : `file:${fileId}:chunks`),
      this.redisClient.hGetAll(belongId ? `image:${belongId}:meta` : `file:${fileId}:meta`),
    ]);
    const total = parseInt(meta.totalChunks, 10) || 0;
    return { uploaded, total };
  }

  // 手动检查分片状态（用于调试）
  async checkChunkStatus(fileId: string, belongId: string): Promise<any> {
    try {
      const [chunks, meta] = await Promise.all([
        this.redisClient.hGetAll(belongId ? `image:${belongId}:chunks` : `file:${fileId}:chunks`),
        this.redisClient.hGetAll(belongId ? `image:${belongId}:meta` : `file:${fileId}:meta`),
      ]);

      const chunkKeys = Object.keys(chunks);
      const totalChunks = parseInt(meta.totalChunks, 10) || 0;

      console.log('=== 分片状态检查 ===');
      console.log('文件ID:', fileId);
      console.log('总分片数:', totalChunks);
      console.log('已上传分片数:', chunkKeys.length);
      console.log('分片索引列表:', chunkKeys.sort((a, b) => parseInt(a) - parseInt(b)));
      console.log('元数据:', meta);

      return {
        fileId,
        totalChunks,
        uploadedChunks: chunkKeys.length,
        chunkIndexes: chunkKeys.sort((a, b) => parseInt(a) - parseInt(b)),
        meta,
        isComplete: chunkKeys.length === totalChunks
      };
    } catch (error) {
      return { error: error.message };
    }
  }

  // 手动触发合并（用于调试）
  async forceMerge(fileId: string, belongId: string): Promise<void> {
    await this.mergeChunks(fileId, belongId);
  }
  // 标准化不同Redis客户端的返回格式
  private normalizeRedisResponse(response: any): Record<string, string> {
    // node-redis v4+ 格式处理
    if (Array.isArray(response) && response.length === 2 && response[0] === null) {
      return response[1] || {};
    }

    // ioredis 或其他直接返回对象的客户端
    if (typeof response === 'object' && response !== null) {
      return response;
    }

    // 其他情况返回空对象
    return {};
  }

  async saveMusicMetadata(fileId: string, metadata: MusicMetadata): Promise<any> {
    const { mp3FullPath, coverFullPath } = await this.confirmAndSave(fileId);
    metadata.mp3 = mp3FullPath;
    metadata.cover = coverFullPath;
    try {
      await this.musicMetadataRepository.save(metadata)
      return {
        code: 200,
        message: '保存成功'
      }
    } catch (error) {
      return {
        code: 500,
        message: '保存失败'
      }
    }
    
  }
}