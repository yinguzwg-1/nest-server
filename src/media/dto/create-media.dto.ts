import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsArray,
  IsEnum,
  IsOptional,
  Min,
  Max,
  IsBoolean,
  ValidateNested,
  IsObject,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { MediaType, MediaStatus } from '../types';

export class MultiLanguageStringDto {
  @IsString()
  @IsNotEmpty()
  zh: string;

  @IsString()
  @IsNotEmpty()
  en: string;
}

export class TranslationsDto {
  @IsOptional()
  @IsObject()
  title?: Record<string, string>;

  @IsOptional()
  @IsObject()
  description?: Record<string, string>;
}

export class CreateMediaDto {
  @ApiProperty({ description: '标题' })
  @IsString()
  title: string;

  @ApiProperty({ description: '描述' })
  @IsString()
  description: string;

  @ApiProperty({ description: '海报URL' })
  @IsString()
  poster: string;

  @ApiProperty({ description: '背景图URL' })
  @IsString()
  backdrop: string;

  @ApiProperty({ description: '年份' })
  @IsNumber()
  year: number;

  @ApiProperty({ description: '评分', minimum: 0, maximum: 10 })
  @IsNumber()
  @Min(0)
  @Max(10)
  rating: number;

  @ApiProperty({ description: '类型', enum: MediaType })
  @IsEnum(MediaType)
  type: MediaType;

  @ApiProperty({ description: '状态', enum: MediaStatus })
  @IsEnum(MediaStatus)
  status: MediaStatus;

  @ApiProperty({ description: '类型', isArray: true })
  @IsArray()
  @IsString({ each: true })
  genres: string[];

  // 电影特有字段
  @ApiProperty({ description: '时长（分钟）', required: false })
  @IsOptional()
  @IsNumber()
  duration?: number;

  @ApiProperty({ description: '导演', required: false })
  @IsOptional()
  @IsString()
  director?: string;

  @ApiProperty({ description: '票房收入', required: false })
  @IsOptional()
  @IsNumber()
  boxOffice?: number;

  // 电视剧特有字段
  @ApiProperty({ description: '季数', required: false })
  @IsOptional()
  @IsNumber()
  seasons?: number;

  @ApiProperty({ description: '总集数', required: false })
  @IsOptional()
  @IsNumber()
  episodes?: number;

  @ApiProperty({ description: '制片人/创作者', required: false })
  @IsOptional()
  @IsString()
  creator?: string;

  @ApiProperty({ description: '播出网络/平台', required: false })
  @IsOptional()
  @IsString()
  network?: string;

  @ApiProperty({ description: '演员阵容', isArray: true })
  @IsArray()
  @IsString({ each: true })
  cast: string[];

  @ApiProperty({ description: '来源URL', required: false })
  @IsOptional()
  @IsString()
  sourceUrl?: string;

  @ApiProperty({ description: '图片下载状态', required: false })
  @IsOptional()
  @IsBoolean()
  isImagesDownloaded?: boolean;

  @ApiProperty({ description: '观看次数', required: false })
  @IsOptional()
  @IsNumber()
  views?: number;

  @ApiProperty({ description: '喜欢次数', required: false })
  @IsOptional()
  @IsNumber()
  likes?: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => TranslationsDto)
  translations?: TranslationsDto;
}
