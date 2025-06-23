import { MediaService } from '../service';
import { CreateMediaDto } from '../dto/create-media.dto';
import { QueryMediaDto } from '../dto/query-media.dto';
export declare class MediaController {
    private readonly mediaService;
    constructor(mediaService: MediaService);
    create(createMediaDto: CreateMediaDto): Promise<import("../entities").Media>;
    findAll(query: QueryMediaDto): Promise<import("../dto/media.dto").MediaWithTranslationsResponseDto>;
}
