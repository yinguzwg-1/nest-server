import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseInterceptors,
  Param,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { MediaService } from '../service';
import { CreateMediaDto } from '../dto/create-media.dto';
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

    return this.mediaService.findAllWithTranslationsRaw(query);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取媒体详情' })
  @ApiResponse({ status: 200, description: '获取成功' })
  findOne(@Param('id') id: string) {
    return this.mediaService.findOne(Number(id));
  }
  
}
