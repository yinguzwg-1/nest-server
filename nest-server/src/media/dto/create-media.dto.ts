import { IsString, IsNumber, IsUrl, IsArray, IsEnum, IsOptional, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { MediaType } from '../types/media.types';

export class CreateMediaDto {
  @ApiProperty({ description: '标题' })
  @IsString()
  title: string;

  @ApiProperty({ description: '描述' })
  @IsString()
  description: string;

  @ApiProperty({ description: '海报URL' })
  @IsUrl()
  poster: string;

  @ApiProperty({ description: '背景图URL' })
  @IsUrl()
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

  @ApiProperty({ description: '状态', enum: ['released', 'upcoming', 'ongoing'] })
  @IsString()
  status: string;

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
} 