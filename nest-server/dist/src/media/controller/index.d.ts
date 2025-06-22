import { MediaService } from '../service';
import { CreateMediaDto } from '../dto/create-media.dto';
import { UpdateMediaDto } from '../dto/update-media.dto';
import { QueryMediaDto } from '../dto/query-media.dto';
export declare class MediaController {
    private readonly mediaService;
    private readonly logger;
    constructor(mediaService: MediaService);
    create(createMediaDto: CreateMediaDto): Promise<import("../entities").Media>;
    findAll(query: QueryMediaDto): Promise<import("../dto/media.dto").MediaListResponseDto>;
    findOne(id: number): Promise<import("../service").MediaWithTranslations>;
    update(id: number, updateMediaDto: UpdateMediaDto): Promise<import("../entities").Media>;
    remove(id: number): Promise<void>;
    search(query: string, page?: number, pageSize?: number): Promise<import("../dto/media.dto").MediaListResponseDto>;
}
