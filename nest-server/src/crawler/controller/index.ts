import { Controller, Post, Query, Get, ParseIntPipe, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { CrawlerService } from '../service';

@ApiTags('爬虫')
@Controller('crawler')
export class CrawlerController {
  private readonly logger: Logger;
  constructor(private readonly crawlerService: CrawlerService) {
    this.logger = new Logger(CrawlerController.name);
  }

  @Post('movies')
  @ApiOperation({ summary: '爬取电影列表' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: '页码' })
  async crawlMovies(@Query('page', new ParseIntPipe({ optional: true })) page: number = 1) {
    this.logger.log(`Crawling movies page ${page}`);
    await this.crawlerService.crawlMovieList(page);
    return { message: `Successfully crawled page ${page}` };
  }
} 