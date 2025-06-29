export enum MediaType {
  MOVIE = 'movie',
  TV = 'tv',
}

export enum MediaStatus {
  RELEASED = 'released',
  ONGOING = 'ongoing',
  UPCOMING = 'upcoming',
}

export interface MultiLanguageString {
  zh: string;
  en: string;
}

export interface BaseMediaItem {
  id: number;
  title: MultiLanguageString;
  description: MultiLanguageString;
  poster: string;
  backdrop: string;
  year: number;
  rating: number;
  genres: string[];
  status: MediaStatus;
  type: MediaType;
  cast: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Movie extends BaseMediaItem {
  type: MediaType.MOVIE;
  director?: string;
  boxOffice?: number;
}

export interface TVShow extends BaseMediaItem {
  type: MediaType.TV;
  seasons?: number;
  episodes?: number;
  creator?: string;
  network?: string;
}

export type MediaItem = Movie | TVShow;

export interface MediaResponse {
  data: MediaItem[];
  total: number;
  page: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}
