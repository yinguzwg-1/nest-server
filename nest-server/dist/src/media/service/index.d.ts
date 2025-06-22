import { Repository } from 'typeorm';
import { Media } from '../entities';
import { CreateMediaDto } from '../dto/create-media.dto';
import { UpdateMediaDto } from '../dto/update-media.dto';
import { MediaListResponseDto } from '../dto/media.dto';
import { QueryMediaDto } from '../dto/query-media.dto';
import { Cache } from 'cache-manager';
import { TranslationService } from '../../translation/service';
export interface MediaWithTranslations extends Omit<Media, 'translations'> {
    translations?: {
        title?: Record<string, string>;
        description?: Record<string, string>;
    };
}
export declare class MediaService {
    private mediaRepository;
    private cacheManager;
    private translationService;
    constructor(mediaRepository: Repository<Media>, cacheManager: Cache, translationService: TranslationService);
    private getCacheKey;
    create(createMediaDto: CreateMediaDto): Promise<Media>;
    update(id: number, updateMediaDto: UpdateMediaDto): Promise<Media>;
    remove(id: number): Promise<void>;
    findAll(query: QueryMediaDto): Promise<MediaListResponseDto>;
    findOne(id: number): Promise<MediaWithTranslations>;
    search(query: string, page?: number, pageSize?: number): Promise<MediaListResponseDto>;
}
