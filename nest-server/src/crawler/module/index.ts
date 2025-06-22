import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CrawlerService } from '../service';
import { CrawlerController } from '../controller';
import { Media } from '../../media/entities';
import { TranslationModule } from '../../translation/module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Media]),
    TranslationModule,
  ],
  controllers: [CrawlerController],
  providers: [CrawlerService],
  exports: [CrawlerService],
})
export class CrawlerModule {} 