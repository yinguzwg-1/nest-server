import { MediaWithTranslations } from '../service';
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
    items: MediaWithTranslations[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}
