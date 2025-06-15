import { Controller, Get, Post, Body, Patch, Param, Delete, Query, ParseIntPipe } from '@nestjs/common';
import { MediaService } from './media.service';
import { CreateMediaDto } from './dto/create-media.dto';
import { UpdateMediaDto } from './dto/update-media.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { MediaType } from './entities/media.entity';

@ApiTags('media')
@Controller('media')
export class MediaController {
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
  findAll(
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
    @Query('type') type?: MediaType,
    @Query('year') year?: number,
    @Query('status') status?: string,
    @Query('sortBy') sortBy?: 'rating' | 'year',
    @Query('order') order?: 'ASC' | 'DESC',
  ) {
    console.log('page', page);
    return this.mediaService.findAll(page, pageSize, type, year, status, sortBy, order);
  }

  @Get('type/:type')
  @ApiOperation({ summary: '按类型获取媒体' })
  @ApiResponse({ status: 200, description: '获取成功' })
  findByType(@Param('type') type: MediaType) {
    return this.mediaService.findByType(type);
  }

  @Get('year/:year')
  @ApiOperation({ summary: '按年份获取媒体' })
  @ApiResponse({ status: 200, description: '获取成功' })
  findByYear(@Param('year', ParseIntPipe) year: number) {
    return this.mediaService.findByYear(year);
  }

  @Get('status/:status')
  @ApiOperation({ summary: '按状态获取媒体' })
  @ApiResponse({ status: 200, description: '获取成功' })
  findByStatus(@Param('status') status: string) {
    return this.mediaService.findByStatus(status);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取单个媒体' })
  @ApiResponse({ status: 200, description: '获取成功' })
  findOne(@Param('id') id: string) {
    return this.mediaService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新媒体' })
  @ApiResponse({ status: 200, description: '更新成功' })
  update(@Param('id') id: string, @Body() updateMediaDto: UpdateMediaDto) {
    return this.mediaService.update(id, updateMediaDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除媒体' })
  @ApiResponse({ status: 200, description: '删除成功' })
  remove(@Param('id') id: string) {
    return this.mediaService.remove(id);
  }
} 