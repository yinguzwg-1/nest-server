import { Media } from '../entities';
export declare class MediaResponseDto {
    id: string;
    title: string;
    description: string;
    poster: string;
    backdrop: string;
    year: number;
    rating: number;
    type: string;
    status: string;
    genres: string[];
    duration?: number;
    director?: string;
    boxOffice?: number;
    seasons?: number;
    episodes?: number;
    creator?: string;
    network?: string;
    cast: string[];
    createdAt: Date;
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
