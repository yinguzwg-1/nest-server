import {
  Controller,
  Post,
  Get,
  Query,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor, FileFieldsInterceptor } from '@nestjs/platform-express';
import { UploadService } from './upload.service';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';

@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Get('list')
  async getPhotos(
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Query('category') category: 'all' | 'photo' | 'video' = 'all',
    @Query('month') month?: string,
  ) {
    return this.uploadService.getHomeFeed(
      parseInt(page) || 1, 
      parseInt(limit) || 20,
      category,
      month,
    );
  }

  @Get('months')
  async getAvailableMonths() {
    return this.uploadService.getAvailableMonths();
  }

  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, callback) => {
          const uploadPath = join(process.cwd(), 'public/uploads');
          if (!existsSync(uploadPath)) {
            mkdirSync(uploadPath, { recursive: true });
          }
          callback(null, uploadPath);
        },
        filename: (req, file, callback) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          callback(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
        },
      }),
      fileFilter: (req, file, callback) => {
        if (!file.originalname.match(/\.(jpg|jpeg|png|webp|mp4|mov|avi|mkv)$/i)) {
          return callback(new BadRequestException('只允许上传图片和视频文件！'), false);
        }
        callback(null, true);
      },
    }),
  )
  async uploadFile(@UploadedFile() file: Express.Multer.File, @Req() req) {
    if (!file) {
      throw new BadRequestException('请选择图片或视频文件');
    }
    console.log('收到上传文件:', {
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      path: file.path
    });
    // TODO: 获取登录用户，目前模拟一个
    const mockUser = { id: 1 } as any;
    return this.uploadService.handleUpload(file, mockUser);
  }

  @Post('live')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'image', maxCount: 1 },
        { name: 'video', maxCount: 1 },
      ],
      {
        storage: diskStorage({
          destination: (req, file, callback) => {
            const uploadPath = join(process.cwd(), 'public/uploads');
            if (!existsSync(uploadPath)) {
              mkdirSync(uploadPath, { recursive: true });
            }
            callback(null, uploadPath);
          },
          filename: (req, file, callback) => {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
            const ext = extname(file.originalname);
            callback(null, `live-${file.fieldname}-${uniqueSuffix}${ext}`);
          },
        }),
        fileFilter: (req, file, callback) => {
          if (file.fieldname === 'image') {
            if (!file.originalname.match(/\.(jpg|jpeg|png|webp|heic|heif)$/i)) {
              return callback(new BadRequestException('Live Photo 图片格式不支持'), false);
            }
          } else if (file.fieldname === 'video') {
            if (!file.originalname.match(/\.(mov|mp4)$/i)) {
              return callback(new BadRequestException('Live Photo 视频格式不支持'), false);
            }
          }
          callback(null, true);
        },
      },
    ),
  )
  async uploadLivePhoto(
    @UploadedFiles() files: { image?: Express.Multer.File[]; video?: Express.Multer.File[] },
    @Req() req,
  ) {
    const imageFile = files?.image?.[0];
    const videoFile = files?.video?.[0];

    if (!imageFile || !videoFile) {
      throw new BadRequestException('Live Photo 需要同时上传图片和视频文件');
    }

    console.log('收到 Live Photo 上传:', {
      image: { name: imageFile.originalname, size: imageFile.size },
      video: { name: videoFile.originalname, size: videoFile.size },
    });

    const mockUser = { id: 1 } as any;
    return this.uploadService.handleLivePhotoUpload(imageFile, videoFile, mockUser);
  }
}

