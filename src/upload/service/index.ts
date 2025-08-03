import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MusicMetadata, MusicMetadataDto } from '../entities';
import { RedisService } from '../../redis/service';
import { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull/dist';
import { RedisClientType } from 'redis/dist';
import path from 'path';
import fs from 'fs';
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
  ): Promise<UploadChunkResult> {
    
    const pipeline = this.redisClient.multi();

    // 存储分片数据 - 使用正确的hSet语法
    pipeline.hSet(
      `file:${fileId}:chunks`,
      chunkIndex.toString(),
      chunkData.toString('base64')
    );

    // 设置分片数据的过期时间(30分钟)
    pipeline.expire(`file:${fileId}:chunks`, 1800);

    // 更新分片元数据 - 分别设置每个字段，避免对象语法问题
    pipeline.hSet(`file:${fileId}:meta`, 'totalChunks', totalChunks.toString());
    pipeline.hSet(`file:${fileId}:meta`, 'lastUpdated', Date.now().toString());

    // 设置元数据的过期时间(30分钟)
    pipeline.expire(`file:${fileId}:meta`, 1800);

    try {
      await pipeline.exec();
    } catch (error) {
      throw error;
    }

    // 检查是否所有分片都已上传
    const chunkCount = await this.redisClient.hLen(`file:${fileId}:chunks`);
   
    if (chunkCount === totalChunks) {
      await this.fileMergeQueue.add('merge-file', { fileId });
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
  async mergeChunks(fileId: string): Promise<void> {
    const pipeline = this.redisClient.multi();

    // 获取所有分片
    pipeline.hGetAll(`file:${fileId}:chunks`);
    pipeline.hGetAll(`file:${fileId}:meta`);

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
      `file:${fileId}:merged`,
      1800, // 30分钟TTL
      mergedBuffer.toString('base64')
    );

    // 可以保留分片数据让其自动过期
    // 或者立即删除分片数据但保留元数据
    // await this.redisClient.del(`file:${fileId}:chunks`);
  }

  // 用户确认后写入硬盘（更新TTL处理）
  async confirmAndSave(fileId: string, fileName: string, savePath: string): Promise<string> {
    const mergedFile = await this.redisClient.get(`file:${fileId}:merged`);

    if (!mergedFile) {
      throw new Error('File not found or expired');
    }

    const fileBuffer = Buffer.from(mergedFile as string, 'base64');
    const fullPath = path.join(savePath, fileName);

    // 确保目录存在
    if (!fs.existsSync(savePath)) {
      fs.mkdirSync(savePath, { recursive: true });
    }

    // 写入文件
    fs.writeFileSync(fullPath, fileBuffer);

    // 清理所有相关数据（不再等待自动过期）
    await this.cleanupFileData(fileId);

    return fullPath;
  }

  // 更新清理方法
  private async cleanupFileData(fileId: string): Promise<void> {
    const keys = [
      `file:${fileId}:chunks`,
      `file:${fileId}:meta`,
      `file:${fileId}:merged`
    ];

    await this.redisClient.del(keys);
  }
  // 获取上传进度
  async getUploadProgress(fileId: string): Promise<{ uploaded: number; total: number }> {
    const [uploaded, meta] = await Promise.all([
      this.redisClient.hLen(`file:${fileId}:chunks`),
      this.redisClient.hGetAll(`file:${fileId}:meta`),
    ]);

    const total = parseInt(meta.totalChunks, 10) || 0;
    return { uploaded, total };
  }

  // 手动检查分片状态（用于调试）
  async checkChunkStatus(fileId: string): Promise<any> {
    try {
      const [chunks, meta] = await Promise.all([
        this.redisClient.hGetAll(`file:${fileId}:chunks`),
        this.redisClient.hGetAll(`file:${fileId}:meta`),
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
      console.error('检查分片状态失败:', error);
      return { error: error.message };
    }
  }

  // 手动触发合并（用于调试）
  async forceMerge(fileId: string): Promise<void> {
    console.log('手动触发合并:', fileId);
    await this.mergeChunks(fileId);
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
}