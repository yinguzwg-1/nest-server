import { MediaType, MediaStatus } from '../types';
export declare class QueryMediaDto {
    page?: number;
    limit?: number;
    type?: MediaType;
    status?: MediaStatus;
    year?: number;
    title?: string;
    language?: string;
    genre?: string;
    rating?: number;
    sortBy?: string;
    orderBy?: 'ASC' | 'DESC';
    search?: string;
}
