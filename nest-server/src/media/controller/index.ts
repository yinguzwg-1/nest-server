import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseInterceptors, ParseIntPipe, Logger } from '@nestjs/common';
import { MediaService } from '../service';
import { CreateMediaDto } from '../dto/create-media.dto';
import { UpdateMediaDto } from '../dto/update-media.dto';
import { QueryMediaDto } from '../dto/query-media.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { LanguageInterceptor } from '../../common/interceptors/language.interceptor';

@ApiTags('media')
@Controller('media')
@UseInterceptors(LanguageInterceptor)
export class MediaController {
  private readonly logger = new Logger(MediaController.name);
  
  constructor(private readonly mediaService: MediaService) {}

  @Post()
  @ApiOperation({ summary: '创建媒体' })
  @ApiResponse({ status: 201, description: '创建成功' })
  create(@Body() createMediaDto: CreateMediaDto) {
    return this.mediaService.create(createMediaDto);
  }

  @Get()
  @ApiOperation({ summary: '获取媒体列表' })
  @ApiResponse({ status: 200, description: '获取成功' })
  findAll(@Query() query: QueryMediaDto) {
    console.log('QueryMediaDto----', query);
    return this.mediaService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取单个媒体' })
  @ApiResponse({ status: 200, description: '获取成功' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.mediaService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新媒体' })
  @ApiResponse({ status: 200, description: '更新成功' })
  update(@Param('id', ParseIntPipe) id: number, @Body() updateMediaDto: UpdateMediaDto) {
    return this.mediaService.update(id, updateMediaDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除媒体' })
  @ApiResponse({ status: 200, description: '删除成功' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.mediaService.remove(id);
  }

  @Get('search/:query')
  @ApiOperation({ summary: '搜索媒体' })
  search(
    @Param('query') query: string,
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('pageSize', new ParseIntPipe({ optional: true })) pageSize?: number,
  ) {
    this.logger.log(`Search media with query: ${query}`);
    return this.mediaService.search(query, page, pageSize);
  }
} 