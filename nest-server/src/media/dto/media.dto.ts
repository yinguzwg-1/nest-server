import { ApiProperty } from '@nestjs/swagger';
import { Media } from '../entities';

export class MediaResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  poster: string;

  @ApiProperty()
  backdrop: string;

  @ApiProperty()
  year: number;

  @ApiProperty()
  rating: number;

  @ApiProperty()
  type: string;

  @ApiProperty()
  status: string;

  @ApiProperty({ type: [String] })
  genres: string[];

  @ApiProperty({ required: false })
  duration?: number;

  @ApiProperty({ required: false })
  director?: string;

  @ApiProperty({ required: false })
  boxOffice?: number;

  @ApiProperty({ required: false })
  seasons?: number;

  @ApiProperty({ required: false })
  episodes?: number;

  @ApiProperty({ required: false })
  creator?: string;

  @ApiProperty({ required: false })
  network?: string;

  @ApiProperty({ type: [String] })
  cast: string[];

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export interface MediaListResponseDto {
  items: Media[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface MediaWithTranslationsResponseDto {
  items: MediaWithTranslations[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface MediaWithTranslations {
  id: number;
  title: string;
  description: string;
  poster: string;
  backdrop: string;
  year: number;
  rating: number;
  status: string;
  type: string;
  cast: string[];
  duration?: number;
  director?: string;
  boxOffice?: number;
  views: number;
  likes: number;
  sourceUrl?: string;
  isImagesDownloaded: boolean;
  createdAt: Date;
  updatedAt: Date;
  translations?: {
    title?: Record<string, string>;
    description?: Record<string, string>;
  };
}
