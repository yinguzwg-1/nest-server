import { Controller, Post, Body, Param, Get, Res, UseInterceptors, UploadedFile } from '@nestjs/common';
import { UploadService } from '../service';
import { FileInterceptor } from '@nestjs/platform-express';
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
    }
  ) {
    console.log('file', file);
    const { fileId, chunkIndex, totalChunks } = body;
  
    const result = await this.uploadService.storeChunk(
      fileId,
      parseInt(chunkIndex),
      file.buffer,
      parseInt(totalChunks),
    );
    return result;
  }

  @Get('progress/:fileId')
  async getProgress(@Param('fileId') fileId: string) {
    return await this.uploadService.getUploadProgress(fileId);
  }
  @Post('confirm')
  async confirmUpload(@Body() body: { fileId: string; fileName: string; savePath: string }) {
    try {
      const { fileId, fileName, savePath } = body;
      const filePath = await this.uploadService.confirmAndSave(
        fileId,
        fileName,
        savePath,
      );
      return { success: true, filePath };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}