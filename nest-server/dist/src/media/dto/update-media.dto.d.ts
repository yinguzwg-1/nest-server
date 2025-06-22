import { TranslationsDto } from './create-media.dto';
import { MediaType, MediaStatus } from '../types';
export declare class UpdateMediaDto {
    title?: string;
    description?: string;
    poster?: string;
    backdrop?: string;
    year?: number;
    rating?: number;
    genres?: string[];
    status?: MediaStatus;
    type?: MediaType;
    cast?: string[];
    duration?: number;
    director?: string;
    boxOffice?: number;
    views?: number;
    likes?: number;
    sourceUrl?: string;
    isImagesDownloaded?: boolean;
    translations?: TranslationsDto;
}
