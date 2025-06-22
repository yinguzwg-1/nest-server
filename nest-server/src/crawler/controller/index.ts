import { Controller, Post, Query, Get, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { CrawlerService } from '../service';

@ApiTags('爬虫')
@Controller('crawler')
export class CrawlerController {
  constructor(private readonly crawlerService: CrawlerService) {}

  @Post('movies')
  @ApiOperation({ summary: '爬取电影列表' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: '页码' })
  async crawlMovies(@Query('page', new ParseIntPipe({ optional: true })) page: number = 1) {
    await this.crawlerService.crawlMovieList(page);
    return { message: `Successfully crawled page ${page}` };
  }
} 