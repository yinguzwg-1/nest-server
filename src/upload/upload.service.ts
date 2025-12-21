import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Photo } from './entities/photo.entity';
import { Video } from './entities/video.entity';
import * as ExifParser from 'exif-parser';
import * as fs from 'fs';
import * as path from 'path';
import * as sharp from 'sharp';
import * as ffmpeg from 'fluent-ffmpeg';
const ffmpegPath = require('ffmpeg-static');
import { User } from '../auth/entities/user.entity';

// 设置 ffmpeg 路径
if (ffmpegPath) {
  ffmpeg.setFfmpegPath(ffmpegPath);
}

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);

  constructor(
    @InjectRepository(Photo)
    private readonly photoRepository: Repository<Photo>,
    @InjectRepository(Video)
    private readonly videoRepository: Repository<Video>,
  ) {}

  async handleUpload(file: Express.Multer.File, user: User) {
    this.logger.log(`开始处理上传文件: ${file.originalname}, MIME: ${file.mimetype}`);
    const isVideo = file.mimetype.startsWith('video/');
    
    try {
      if (isVideo) {
        return await this.handleVideoUpload(file, user);
      } else {
        return await this.handlePhotoUpload(file, user);
      }
    } catch (error) {
      this.logger.error(`上传处理流程发生异常: ${error.message}`, error.stack);
      throw error;
    }
  }

  private async handleVideoUpload(file: Express.Multer.File, user: User) {
    this.logger.log(`进入视频处理逻辑: ${file.originalname}`);
    
    try {
      const videoFilename = path.parse(file.filename).name;
      const coverFilename = `${videoFilename}-cover.jpg`;
      const uploadDir = path.dirname(file.path);
      const coverPath = path.join(uploadDir, coverFilename);

      this.logger.log(`正在提取视频封面...`);
      
      // 生成封面图
      await new Promise((resolve, reject) => {
        ffmpeg(file.path)
          .screenshots({
            timestamps: ['00:00:01'], // 提取第 1 秒的画面
            filename: coverFilename,
            folder: uploadDir,
            size: '720x?' // 维持宽高比
          })
          .on('end', () => {
            this.logger.log('视频封面提取完成');
            resolve(true);
          })
          .on('error', (err) => {
            this.logger.error(`视频封面提取失败: ${err.message}`);
            // 截图失败不直接 reject，尝试继续保存视频
            resolve(false);
          });
      });

      // 尝试获取视频元数据 (需要 ffprobe，如果没安装可能会失败)
      let duration = 0;
      let width = null;
      let height = null;
      let metadata = {};

      try {
        const probeData: any = await new Promise((resolve, reject) => {
          ffmpeg.ffprobe(file.path, (err, data) => {
            if (err) reject(err);
            else resolve(data);
          });
        });
        metadata = probeData;
        duration = Math.round(probeData.format.duration || 0);
        const videoStream = probeData.streams.find(s => s.codec_type === 'video');
        width = videoStream?.width;
        height = videoStream?.height;
      } catch (probeErr) {
        this.logger.warn(`无法获取视频元数据 (可能是缺少 ffprobe): ${probeErr.message}`);
      }

      const video = this.videoRepository.create({
        url: `/uploads/${file.filename}`,
        coverUrl: fs.existsSync(coverPath) ? `/uploads/${coverFilename}` : null,
        title: file.originalname,
        duration,
        width,
        height,
        metadata,
        user,
      });

      this.logger.log(`正在保存视频实体到数据库...`);
      const savedVideo = await this.videoRepository.save(video);
      this.logger.log(`视频保存成功, ID: ${savedVideo.id}`);
      return savedVideo;
    } catch (error) {
      this.logger.error(`视频处理失败: ${error.message}`, error.stack);
      // 最终兜底：保存最基本的信息
      const video = this.videoRepository.create({
        url: `/uploads/${file.filename}`,
        title: file.originalname,
        user,
      });
      return await this.videoRepository.save(video);
    }
  }

  private async handlePhotoUpload(file: Express.Multer.File, user: User) {
    let metadata = {};
    let make = null;
    let model = null;
    let exposureTime = null;
    let fNumber = null;
    let iso = null;
    let width = null;
    let height = null;
    let finalUrl = `/uploads/${file.filename}`;

    try {
      // 从磁盘读取文件 buffer 以便解析 EXIF
      const fileBuffer = fs.readFileSync(file.path);
      
      // 1. 解析 EXIF
      try {
        const parser = ExifParser.create(fileBuffer);
        const result = parser.parse();
        this.logger.log(`解析图片: ${file.originalname}`);
        metadata = result.tags;
        make = result.tags.Make;
        model = result.tags.Model;
        exposureTime = result.tags.ExposureTime ? `1/${Math.round(1 / result.tags.ExposureTime)}` : null;
        fNumber = result.tags.FNumber ? `f/${result.tags.FNumber}` : null;
        iso = result.tags.ISO;
        width = result.imageSize?.width;
        height = result.imageSize?.height;
      } catch (exifErr) {
        this.logger.warn(`无法解析 EXIF (${file.originalname}): ${exifErr.message}`);
      }

      const uploadDir = path.dirname(file.path);
      const filenameObj = path.parse(file.filename);
      const ext = filenameObj.ext.toLowerCase();
      const baseFilename = filenameObj.name;

      // 2. 转换为 WebP
      if (ext !== '.webp') {
        const webpFilename = `${baseFilename}.webp`;
        const webpPath = path.join(uploadDir, webpFilename);
        
        this.logger.log(`正在转换为 WebP 并缩放: ${file.originalname} -> ${webpFilename}`);
        
        await sharp(file.path)
          .resize(1600, null, { withoutEnlargement: true }) // 限制最大宽度 1600px，不拉伸小图
          .webp({ quality: 80 }) // 稍微降低一点质量，体积会减小很多
          .toFile(webpPath);

        // 删除原始文件
        try {
          fs.unlinkSync(file.path);
        } catch (unlinkErr) {
          this.logger.error(`删除原始文件失败: ${file.path}`);
        }

        finalUrl = `/uploads/${webpFilename}`;
        
        if (!width || !height) {
          const info = await sharp(webpPath).metadata();
          width = info.width;
          height = info.height;
        }
      } else if (!width || !height) {
        // 如果已经是 WebP，也进行一次缩放处理，防止原图过大
        const tempPath = `${file.path}.tmp.webp`;
        await sharp(file.path)
          .resize(1600, null, { withoutEnlargement: true })
          .webp({ quality: 80 })
          .toFile(tempPath);
        fs.renameSync(tempPath, file.path);

        const info = await sharp(file.path).metadata();
        width = info.width;
        height = info.height;
      }
    } catch (e) {
      this.logger.error(`图片处理失败 (${file.originalname}): ${e.message}`);
    }
    
    const photo = this.photoRepository.create({
      url: finalUrl,
      make,
      model,
      exposureTime,
      fNumber,
      iso,
      width,
      height,
      metadata,
      user,
    });

    return await this.photoRepository.save(photo);
  }

  async getHomeFeed(page: number = 1, limit: number = 20, category: 'all' | 'photo' | 'video' = 'all') {
    const skip = (page - 1) * limit;
    
    let items: any[] = [];
    let total = 0;

    if (category === 'photo') {
      const [data, count] = await this.photoRepository.findAndCount({
        order: { createdAt: 'DESC' },
        relations: ['user'],
        skip,
        take: limit,
      });
      items = data.map(item => ({ ...item, type: 'photo' }));
      total = count;
    } else if (category === 'video') {
      const [data, count] = await this.videoRepository.findAndCount({
        order: { createdAt: 'DESC' },
        relations: ['user'],
        skip,
        take: limit,
      });
      items = data.map(item => ({ ...item, type: 'video' }));
      total = count;
    } else {
      // 聚合模式：分别查视频和图片
      // 为了性能，我们各查一半，或者按比例。这里各查 limit 个，然后取前 limit 个
      const photos = await this.photoRepository.find({
        order: { createdAt: 'DESC' },
        relations: ['user'],
        take: limit,
        skip: Math.floor(skip / 2),
      });
      
      const videos = await this.videoRepository.find({
        order: { createdAt: 'DESC' },
        relations: ['user'],
        take: limit,
        skip: Math.floor(skip / 2),
      });

      const photoTotal = await this.photoRepository.count();
      const videoTotal = await this.videoRepository.count();
      total = photoTotal + videoTotal;

      // 合并并标记类型
      items = [
        ...photos.map(p => ({ ...itemToPlain(p), type: 'photo' })),
        ...videos.map(v => ({ ...itemToPlain(v), type: 'video' })),
      ];

      // 随机打乱
      items = items.sort(() => Math.random() - 0.5);

      // 视频优先排列在前方
      items = items.sort((a, b) => {
        if (a.type === 'video' && b.type !== 'video') return -1;
        if (a.type !== 'video' && b.type === 'video') return 1;
        return 0;
      });

      // 截取当前页所需的量
      items = items.slice(0, limit);
    }

    return {
      data: items,
      total,
      page,
      limit,
      hasMore: total > skip + items.length,
    };
  }

  async findAll(page: number = 1, limit: number = 20) {
    return this.getHomeFeed(page, limit, 'photo');
  }
}

// 辅助函数：将 entity 转为普通对象
function itemToPlain(item: any) {
  return JSON.parse(JSON.stringify(item));
}

