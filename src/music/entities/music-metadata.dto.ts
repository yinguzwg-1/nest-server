import {
  IsString,

  IsOptional,
  IsArray,
} from 'class-validator';
export class MusicMetadataDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  artist?: string;

  @IsString()
  @IsOptional()
  album?: string;

  @IsString()
  @IsOptional()
  genre?: string;

  @IsString()
  @IsOptional()
  duration?: string;

  @IsString()
  @IsOptional()
  release_date?: string;

  @IsString()
  @IsOptional()
  language?: string;

  @IsArray()
  @IsOptional()
  tags?: string[];

  @IsString()
  @IsOptional()
  mood?: string;

  @IsArray()
  @IsOptional()
  lyrics?: Array<{ time: number; text: string }>;

  @IsString()
  @IsOptional()
  cover?: string;

  @IsString()
  @IsOptional()
  mp3?: string;
} 