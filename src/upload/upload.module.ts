import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';
import { Photo } from './entities/photo.entity';
import { Video } from './entities/video.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Photo, Video])],
  controllers: [UploadController],
  providers: [UploadService],
})
export class UploadModule {}

