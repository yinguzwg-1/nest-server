import { MediaType, MediaStatus } from '../types';
import { Translation } from '../../translation/entities';
export declare class Media {
    id: number;
    title: string;
    description: string;
    poster: string;
    backdrop: string;
    year: number;
    rating: number;
    genres: string[];
    status: MediaStatus;
    type: MediaType;
    cast: string[];
    duration: number;
    director: string;
    boxOffice: number;
    views: number;
    likes: number;
    sourceUrl: string;
    isImagesDownloaded: boolean;
    translations: Translation[];
    createdAt: Date;
    updatedAt: Date;
}
