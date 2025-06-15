import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsArray, IsEnum, IsOptional, IsDate, Min, Max, IsUrl, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';
import { MediaType, MediaStatus } from '../entities/media.entity';

// 创建媒体的DTO
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
  @Min(1900)
  @Max(2100)
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
  @IsEnum(MediaStatus)
  @IsOptional()
  status?: MediaStatus;

  @ApiProperty({ description: '类型', isArray: true })
  @IsArray()
  @IsString({ each: true })
  genres: string[];

  @ApiProperty({ description: '演员阵容', isArray: true })
  @IsArray()
  @IsString({ each: true })
  cast: string[];

  // 电影特有字段
  @ApiProperty({ description: '时长（分钟）', required: false })
  @IsOptional()
  @IsNumber()
  @Min(1)
  duration?: number;

  @ApiProperty({ description: '导演', required: false })
  @IsOptional()
  @IsString()
  director?: string;

  @ApiProperty({ description: '票房收入', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  boxOffice?: number;

  // 电视剧特有字段
  @ApiProperty({ description: '季数', required: false })
  @IsOptional()
  @IsNumber()
  @Min(1)
  seasons?: number;

  @ApiProperty({ description: '总集数', required: false })
  @IsOptional()
  @IsNumber()
  @Min(1)
  episodes?: number;

  @ApiProperty({ description: '制片人/创作者', required: false })
  @IsOptional()
  @IsString()
  creator?: string;

  @ApiProperty({ description: '播出网络/平台', required: false })
  @IsOptional()
  @IsString()
  network?: string;
}

// 更新媒体的DTO
export class UpdateMediaDto extends CreateMediaDto {}

// 查询媒体的DTO
export class QueryMediaDto {
  @IsEnum(MediaType)
  @IsOptional()
  type?: MediaType;

  @IsString()
  @IsOptional()
  genre?: string;

  @IsNumber()
  @IsOptional()
  @Min(1900)
  @Max(2100)
  year?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(10)
  rating?: number;

  @IsEnum(MediaStatus)
  @IsOptional()
  status?: MediaStatus;

  @IsString()
  @IsOptional()
  sortBy?: string;

  @IsString()
  @IsOptional()
  sortOrder?: 'ASC' | 'DESC';

  @IsNumber()
  @IsOptional()
  @Min(1)
  page?: number;

  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(100)
  limit?: number;

  @IsString()
  @IsOptional()
  search?: string;
}

// 媒体响应DTO
export class MediaResponseDto {
  @ApiProperty()
  @IsUUID()
  id: string;

  @ApiProperty()
  @IsString()
  title: string;

  @ApiProperty()
  @IsString()
  description: string;

  @ApiProperty()
  @IsUrl()
  poster: string;

  @ApiProperty()
  @IsUrl()
  backdrop: string;

  @ApiProperty()
  @IsNumber()
  year: number;

  @ApiProperty()
  @IsNumber()
  rating: number;

  @ApiProperty({ enum: MediaType })
  @IsEnum(MediaType)
  type: MediaType;

  @ApiProperty()
  @IsEnum(MediaStatus)
  status: string;

  @ApiProperty({ type: [String] })
  @IsArray()
  genres: string[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  duration?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  director?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  boxOffice?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  seasons?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  episodes?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  creator?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  network?: string;

  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  cast: string[];

  @ApiProperty()
  @Type(() => Date)
  @IsDate()
  createdAt: Date;

  @ApiProperty()
  @Type(() => Date)
  @IsDate()
  updatedAt: Date;
}

// 分页响应DTO
export class PaginatedMediaResponseDto {
  @ApiProperty({ type: [MediaResponseDto] })
  data: MediaResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  totalPages: number;

  @ApiProperty()
  hasNext: boolean;

  @ApiProperty()
  hasPrev: boolean;
}

export class MediaListResponseDto {
  @ApiProperty({ type: [MediaResponseDto] })
  data: MediaResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  pageSize: number;
} 