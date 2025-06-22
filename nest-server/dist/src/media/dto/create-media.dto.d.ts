import { MediaType, MediaStatus } from '../types';
export declare class MultiLanguageStringDto {
    zh: string;
    en: string;
}
export declare class TranslationsDto {
    title?: Record<string, string>;
    description?: Record<string, string>;
}
export declare class CreateMediaDto {
    title: string;
    description: string;
    poster: string;
    backdrop: string;
    year: number;
    rating: number;
    type: MediaType;
    status: MediaStatus;
    genres: string[];
    duration?: number;
    director?: string;
    boxOffice?: number;
    seasons?: number;
    episodes?: number;
    creator?: string;
    network?: string;
    cast: string[];
    sourceUrl?: string;
    isImagesDownloaded?: boolean;
    views?: number;
    likes?: number;
    translations?: TranslationsDto;
}
