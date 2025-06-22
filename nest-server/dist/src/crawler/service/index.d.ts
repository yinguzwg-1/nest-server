import { Repository } from 'typeorm';
import { Media } from '../../media/entities';
import { TranslationService } from '../../translation/service';
export declare class CrawlerService {
    private readonly mediaRepository;
    private readonly translationService;
    private readonly logger;
    private readonly baseUrl;
    constructor(mediaRepository: Repository<Media>, translationService: TranslationService);
    crawlMovieList(pageNum?: number): Promise<void>;
}
