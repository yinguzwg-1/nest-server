import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UploadController } from '../controller';
import { UploadService } from '../service';
import { MusicMetadata } from '../../music/entities';
import { RedisModule } from '../../redis/module';
import { FileMergeProcessor } from '../processtor';

@Module({
  imports: [TypeOrmModule.forFeature([MusicMetadata]), RedisModule],
  controllers: [UploadController],
  providers: [UploadService, FileMergeProcessor],
  exports: [UploadService],
})
export class UploadModule { }