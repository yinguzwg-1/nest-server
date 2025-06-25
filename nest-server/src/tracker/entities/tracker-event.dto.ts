import { IsString, IsNotEmpty, IsDateString, IsObject, IsNumber, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class TrackerPropertiesDto {
  @IsString()
  @IsOptional()
  url?: string;

  @IsString()
  @IsOptional()
  referrer?: string;

  @IsNumber()
  @IsOptional()
  screen_width?: number;

  @IsNumber()
  @IsOptional()
  screen_height?: number;

  @IsNumber()
  @IsOptional()
  viewport_width?: number;

  @IsNumber()
  @IsOptional()
  viewport_height?: number;

  @IsString()
  @IsOptional()
  language?: string;

  @IsString()
  @IsOptional()
  user_agent?: string;

  @IsNumber()
  @IsOptional()
  page?: number;
}

export class TrackerEventDto {
  @IsString()
  @IsOptional()
  event_id?: string;

  @IsDateString()
  @IsOptional()
  event_time?: string;

  @IsString()
  @IsOptional()
  user_id?: string;

  @IsString()
  @IsOptional()
  session_id?: string;

  @IsString()
  @IsOptional()
  device_fingerprint?: string;

  @IsObject()
  @IsOptional()
  @ValidateNested({ each: false })
  @Type(() => TrackerPropertiesDto)
  properties?: TrackerPropertiesDto;

  @IsString()
  @IsOptional()
  sdk_version?: string;

  @IsString()
  @IsOptional()
  app_id?: string;
} 