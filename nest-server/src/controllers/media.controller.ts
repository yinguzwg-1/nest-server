import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseUUIDPipe,
  ValidationPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { MediaService } from '../services/media.service';
import { CreateMediaDto, UpdateMediaDto, QueryMediaDto } from '../dto/media.dto';

@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  // 创建媒体记录
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body(ValidationPipe) createMediaDto: CreateMediaDto
  ) {
    return await this.mediaService.create(createMediaDto);
  }

  // 获取媒体列表（支持筛选和分页）
  @Get()
  async findAll(
    @Query(new ValidationPipe({ transform: true })) queryDto: QueryMediaDto
  ) {
    console.log('queryDto-------',queryDto);
    return await this.mediaService.findAll(queryDto);
  }

  // 搜索媒体
  @Get('search')
  async search(
    @Query('q') query: string,
    @Query(new ValidationPipe({ transform: true })) options: QueryMediaDto
  ) {
    return await this.mediaService.search(query, options);
  }

  // 获取统计信息
  @Get('statistics')
  async getStatistics() {
    return await this.mediaService.getStatistics();
  }

  // 获取所有类型
  @Get('genres')
  async getGenres() {
    return await this.mediaService.getGenres();
  }

  // 获取热门媒体
  @Get('popular')
  async getPopular(@Query('limit') limit?: number) {
    return await this.mediaService.getPopular(limit);
  }

  // 获取最新媒体
  @Get('latest')
  async getLatest(@Query('limit') limit?: number) {
    return await this.mediaService.getLatest(limit);
  }

  // 获取即将上映的媒体
  @Get('upcoming')
  async getUpcoming(@Query('limit') limit?: number) {
    return await this.mediaService.getUpcoming(limit);
  }

  // 根据ID获取媒体记录
  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return await this.mediaService.findOne(id);
  }

  // 更新媒体记录
  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(ValidationPipe) updateMediaDto: UpdateMediaDto
  ) {
    return await this.mediaService.update(id, updateMediaDto);
  }

  // 删除媒体记录
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.mediaService.remove(id);
  }
} 