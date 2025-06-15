import { IsEnum, IsString, IsNumber, IsOptional, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { MediaType, MediaStatus } from '../types/media.types';

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
  @Type(() => Number)
  year?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(10)
  @Type(() => Number)
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
  @Type(() => Number)
  page?: number;

  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number;

  @IsString()
  @IsOptional()
  search?: string;
} 