import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Media } from '../entities';
import { MediaService } from '../service';
import { MediaController } from '../controller';
import { TranslationModule } from '../../translation/module';

@Module({
  imports: [TypeOrmModule.forFeature([Media]), TranslationModule],
  controllers: [MediaController],
  providers: [MediaService],
  exports: [MediaService],
})
export class MediaModule {}
