import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CrawlerService } from '../service';
import { CrawlerController } from '../controller';
import { Media } from '../../media/entities';
import { TranslationModule } from '../../translation/module';
import { CrawlerCacheService } from '../service/crawler-cache.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Media]),
    TranslationModule,
  ],
  controllers: [CrawlerController],
  providers: [CrawlerService, CrawlerCacheService],
  exports: [CrawlerService, CrawlerCacheService ],
})
export class CrawlerModule {} 