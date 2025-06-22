import { ApiProperty } from '@nestjs/swagger';
import { Media } from '../entities';
import { MediaWithTranslations } from '../service';

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
  items: MediaWithTranslations[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
} 