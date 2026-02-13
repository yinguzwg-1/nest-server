import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual, LessThan } from 'typeorm';
import { Photo } from './entities/photo.entity';
import { Video } from './entities/video.entity';
import * as ExifParser from 'exif-parser';
import * as fs from 'fs';
import * as path from 'path';
import * as sharp from 'sharp';
import * as ffmpeg from 'fluent-ffmpeg';
const ffmpegPath = require('ffmpeg-static');
const heicConvert = require('heic-convert');
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

  /**
   * 如果文件是 HEIC/HEIF，转换为 JPEG buffer 并写回磁盘
   * 返回可供 sharp/exif-parser 使用的 buffer
   */
  private async ensureReadableImage(filePath: string): Promise<Buffer> {
    const ext = path.extname(filePath).toLowerCase();
    let buffer = fs.readFileSync(filePath);

    if (['.heic', '.heif'].includes(ext)) {
      this.logger.log(`检测到 HEIC 格式，正在转换为 JPEG...`);
      const jpegBuffer = await heicConvert({
        buffer,
        format: 'JPEG',
        quality: 0.92,
      });
      buffer = Buffer.from(jpegBuffer);
      // 写回磁盘为 .jpg（后续 sharp 从磁盘读取需要）
      const jpegPath = filePath.replace(/\.heic$/i, '.jpg').replace(/\.heif$/i, '.jpg');
      fs.writeFileSync(jpegPath, buffer);
      // 删除原始 HEIC
      try { fs.unlinkSync(filePath); } catch {}
      this.logger.log(`HEIC -> JPEG 转换完成: ${path.basename(jpegPath)}`);
      return buffer;
    }

    return buffer;
  }

  /**
   * 从 EXIF 提取拍摄时间，无则返回当前时间
   */
  private extractTakenAt(exifTags: any): Date {
    // EXIF 里常见的时间字段：DateTimeOriginal, CreateDate, ModifyDate
    const ts = exifTags?.DateTimeOriginal || exifTags?.CreateDate || exifTags?.ModifyDate;
    if (ts && typeof ts === 'number') {
      // exif-parser 返回的是 Unix 秒级时间戳
      const date = new Date(ts * 1000);
      if (!isNaN(date.getTime()) && date.getFullYear() > 1970) {
        return date;
      }
    }
    return new Date(); // 无 EXIF 时间，使用上传时间
  }

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
            timestamps: ['2'], // 提取第 2 秒的画面，避开可能的黑帧
            filename: coverFilename,
            folder: uploadDir,
            size: '720x?' // 维持宽高比
          })
          .on('end', () => {
            this.logger.log(`视频封面提取完成: ${coverFilename}`);
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
    let takenAt: Date = new Date();
    let finalUrl = `/uploads/${file.filename}`;

    try {
      // 0. HEIC 格式转换（sharp 在 Windows 上不支持 HEIC）
      const fileBuffer = await this.ensureReadableImage(file.path);

      // HEIC 转换后文件路径可能已变为 .jpg
      const currentPath = ['.heic', '.heif'].includes(path.extname(file.path).toLowerCase())
        ? file.path.replace(/\.heic$/i, '.jpg').replace(/\.heif$/i, '.jpg')
        : file.path;
      const currentFilename = path.basename(currentPath);
      
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
        takenAt = this.extractTakenAt(result.tags);
      } catch (exifErr) {
        this.logger.warn(`无法解析 EXIF (${file.originalname}): ${exifErr.message}`);
      }

      const uploadDir = path.dirname(currentPath);
      const filenameObj = path.parse(currentFilename);
      const ext = filenameObj.ext.toLowerCase();
      const baseFilename = filenameObj.name;

      // 2. 转换为 WebP
      if (ext !== '.webp') {
        const webpFilename = `${baseFilename}.webp`;
        const webpPath = path.join(uploadDir, webpFilename);
        
        this.logger.log(`正在进行极致压缩处理: ${file.originalname} -> ${webpFilename}`);
        
        await sharp(currentPath)
          .rotate()
          .resize(1200, null, { 
            withoutEnlargement: true,
            fit: 'inside' 
          })
          .webp({ 
            quality: 75,
            effort: 6,
            lossless: false
          })
          .toFile(webpPath);

        // 删除原始文件（可能是 .jpg 或其他格式）
        try {
          fs.unlinkSync(currentPath);
        } catch (unlinkErr) {
          this.logger.error(`删除原始文件失败: ${currentPath}`);
        }

        finalUrl = `/uploads/${webpFilename}`;
        
        if (!width || !height) {
          const info = await sharp(webpPath).metadata();
          width = info.width;
          height = info.height;
        }
      } else if (!width || !height) {
        const tempPath = `${currentPath}.tmp.webp`;
        await sharp(currentPath)
          .rotate()
          .resize(1200, null, { withoutEnlargement: true })
          .webp({ 
            quality: 75,
            effort: 6
          })
          .toFile(tempPath);
        fs.renameSync(tempPath, currentPath);

        const info = await sharp(currentPath).metadata();
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
      takenAt,
      metadata,
      user,
    });

    return await this.photoRepository.save(photo);
  }

  async handleLivePhotoUpload(
    imageFile: Express.Multer.File,
    videoFile: Express.Multer.File,
    user: User,
  ) {
    this.logger.log(`处理 Live Photo 上传: image=${imageFile.originalname}, video=${videoFile.originalname}`);

    // 1. 处理静态图片（HEIC 转换 + EXIF + WebP 转换）
    let metadata = {};
    let make = null;
    let model = null;
    let exposureTime = null;
    let fNumber = null;
    let iso = null;
    let width = null;
    let height = null;
    let takenAt: Date = new Date();
    let finalImageUrl = `/uploads/${imageFile.filename}`;

    try {
      // 0. HEIC 格式转换
      const fileBuffer = await this.ensureReadableImage(imageFile.path);

      // HEIC 转换后文件路径可能已变为 .jpg
      const currentPath = ['.heic', '.heif'].includes(path.extname(imageFile.path).toLowerCase())
        ? imageFile.path.replace(/\.heic$/i, '.jpg').replace(/\.heif$/i, '.jpg')
        : imageFile.path;
      const currentFilename = path.basename(currentPath);

      // 解析 EXIF
      try {
        const parser = ExifParser.create(fileBuffer);
        const result = parser.parse();
        metadata = result.tags;
        make = result.tags.Make;
        model = result.tags.Model;
        exposureTime = result.tags.ExposureTime
          ? `1/${Math.round(1 / result.tags.ExposureTime)}`
          : null;
        fNumber = result.tags.FNumber ? `f/${result.tags.FNumber}` : null;
        iso = result.tags.ISO;
        width = result.imageSize?.width;
        height = result.imageSize?.height;
        takenAt = this.extractTakenAt(result.tags);
      } catch (exifErr) {
        this.logger.warn(`Live Photo EXIF 解析失败: ${exifErr.message}`);
      }

      // WebP 转换
      const uploadDir = path.dirname(currentPath);
      const filenameObj = path.parse(currentFilename);
      const ext = filenameObj.ext.toLowerCase();
      const baseFilename = filenameObj.name;

      if (ext !== '.webp') {
        const webpFilename = `${baseFilename}.webp`;
        const webpPath = path.join(uploadDir, webpFilename);

        await sharp(currentPath)
          .rotate()
          .resize(1200, null, { withoutEnlargement: true, fit: 'inside' })
          .webp({ quality: 75, effort: 6, lossless: false })
          .toFile(webpPath);

        try {
          fs.unlinkSync(currentPath);
        } catch {}

        finalImageUrl = `/uploads/${webpFilename}`;

        if (!width || !height) {
          const info = await sharp(webpPath).metadata();
          width = info.width;
          height = info.height;
        }
      }
    } catch (e) {
      this.logger.error(`Live Photo 图片处理失败: ${e.message}`);
    }

    // 2. 视频文件直接保存（Live Photo 配对视频仅 2-3 秒，无需转码）
    const liveVideoUrl = `/uploads/${videoFile.filename}`;

    // 3. 保存到数据库
    const photo = this.photoRepository.create({
      url: finalImageUrl,
      liveVideoUrl,
      make,
      model,
      exposureTime,
      fNumber,
      iso,
      width,
      height,
      takenAt,
      metadata,
      user,
    });

    const saved = await this.photoRepository.save(photo);
    this.logger.log(`Live Photo 保存成功, ID: ${saved.id}`);
    return saved;
  }

  /**
   * 解析 month 参数（格式 YYYY-MM），返回该月份的起止时间
   */
  private parseMonthRange(month?: string): { start: Date; end: Date } | null {
    if (!month || !/^\d{4}-\d{2}$/.test(month)) return null;
    const [year, mon] = month.split('-').map(Number);
    const start = new Date(year, mon - 1, 1);        // 月初 00:00:00
    const end = new Date(year, mon, 1);               // 下月初 00:00:00
    return { start, end };
  }

  async getHomeFeed(page: number = 1, limit: number = 20, category: 'all' | 'photo' | 'video' = 'all', month?: string) {
    const skip = (page - 1) * limit;
    const monthRange = this.parseMonthRange(month);
    
    // 构建月份过滤条件
    const monthWhere = monthRange
      ? { createdAt: Between(monthRange.start, monthRange.end) }
      : {};

    let items: any[] = [];
    let total = 0;

    if (category === 'photo') {
      const [data, count] = await this.photoRepository.findAndCount({
        where: monthWhere,
        order: { createdAt: 'DESC' },
        relations: ['user'],
        skip,
        take: limit,
      });
      items = data.map(item => {
        const plain = itemToPlain(item);
        return { ...plain, type: plain.liveVideoUrl ? 'live' : 'photo' };
      });
      total = count;
    } else if (category === 'video') {
      const [data, count] = await this.videoRepository.findAndCount({
        where: monthWhere,
        order: { createdAt: 'DESC' },
        relations: ['user'],
        skip,
        take: limit,
      });
      items = data.map(item => ({ ...itemToPlain(item), type: 'video' }));
      total = count;
    } else {
      const photos = await this.photoRepository.find({
        where: monthWhere,
        order: { createdAt: 'DESC' },
        relations: ['user'],
        take: limit,
        skip: Math.floor(skip / 2),
      });
      
      const videos = await this.videoRepository.find({
        where: monthWhere,
        order: { createdAt: 'DESC' },
        relations: ['user'],
        take: limit,
        skip: Math.floor(skip / 2),
      });

      const photoTotal = await this.photoRepository.count({ where: monthWhere });
      const videoTotal = await this.videoRepository.count({ where: monthWhere });
      total = photoTotal + videoTotal;

      items = [
        ...photos.map(p => {
          const plain = itemToPlain(p);
          return { ...plain, type: plain.liveVideoUrl ? 'live' : 'photo' };
        }),
        ...videos.map(v => ({ ...itemToPlain(v), type: 'video' })),
      ];

      items = items.sort((a, b) => {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });

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

  /**
   * 返回所有有数据的月份列表（降序），格式 YYYY-MM
   */
  async getAvailableMonths(): Promise<string[]> {
    // 从 photos 和 videos 表各查出不重复的月份
    const photoMonths: { m: string }[] = await this.photoRepository
      .createQueryBuilder('p')
      .select("DATE_FORMAT(p.createdAt, '%Y-%m')", 'm')
      .groupBy('m')
      .getRawMany();

    const videoMonths: { m: string }[] = await this.videoRepository
      .createQueryBuilder('v')
      .select("DATE_FORMAT(v.createdAt, '%Y-%m')", 'm')
      .groupBy('m')
      .getRawMany();

    // 合并去重并降序排列
    const allMonths = new Set([
      ...photoMonths.map(r => r.m),
      ...videoMonths.map(r => r.m),
    ]);

    return [...allMonths].sort((a, b) => b.localeCompare(a));
  }

  async findAll(page: number = 1, limit: number = 20) {
    return this.getHomeFeed(page, limit, 'photo');
  }
}

// 辅助函数：将 entity 转为普通对象
function itemToPlain(item: any) {
  return JSON.parse(JSON.stringify(item));
}

