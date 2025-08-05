import { Controller, Post, Body, Param, Get, Res, UseInterceptors, UploadedFile, Query } from '@nestjs/common';
import { UploadService } from '../service';
import { FileInterceptor } from '@nestjs/platform-express';
import { MusicMetadata } from '../../music/entities/music-metadata.entity';
@Controller('upload')
export class UploadController {
  constructor(
    private readonly uploadService: UploadService,
  ) {}

  @Post('chunk')
  @UseInterceptors(FileInterceptor('chunkData'))
  async uploadChunk(
    @UploadedFile() file: any,
    @Body() body: {
      fileId: string;
      chunkIndex: string;
      totalChunks: string;
      belongId: string;
    }
  ) {
    const { fileId, chunkIndex, totalChunks, belongId } = body;
  
    const result = await this.uploadService.storeChunk(
      fileId,
      parseInt(chunkIndex),
      file.buffer,
      parseInt(totalChunks),
      belongId
    );
    return result;
  }

  @Get('progress/:fileId')
  async getProgress(@Param('fileId') fileId: string, @Param('belongId') belongId: string) {
    return await this.uploadService.getUploadProgress(fileId, belongId);
  }

  @Get('check/:fileId')
  async checkFileExists(@Param('fileId') fileId: string, @Query('belongId') belongId: string) {
    try {
      const progress = await this.uploadService.getUploadProgress(fileId, belongId);
      const isCompleted = progress.uploaded === progress.total && progress.total > 0;
      return { 
        exists: true, 
        isCompleted,
        progress: progress.uploaded,
        totalChunks: progress.total
      };
    } catch (error) {
      return { exists: false, isCompleted: false, progress: 0, totalChunks: 0 };
    }
  }

  @Post('save_music')
  async saveMusicMetadata(@Body() body: { fileId: string, metadata: MusicMetadata }) {
    return await this.uploadService.saveMusicMetadata(body.fileId, body.metadata);
  }
}