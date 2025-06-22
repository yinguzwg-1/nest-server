import { Repository } from 'typeorm';
import { Media } from '../../media/entities';
import { TranslationService } from '../../translation/service';
import { AITranslationService } from '../../translation/service/ai-translation.service';
import { ConfigService } from '@nestjs/config';
interface CrawlerProgress {
    lastPage: number;
    lastUpdateTime: string;
    source: string;
}
export declare class CrawlerService {
    private readonly mediaRepository;
    private readonly translationService;
    private readonly aiTranslationService;
    private configService;
    private readonly logger;
    private readonly baseUrl;
    private readonly progressFilePath;
    constructor(mediaRepository: Repository<Media>, translationService: TranslationService, aiTranslationService: AITranslationService, configService: ConfigService);
    private initProgressFile;
    private getProgress;
    private saveProgress;
    getLastCrawledPage(source: string): Promise<number>;
    crawl(source: string, startPage?: number): Promise<void>;
    getAllProgress(): Promise<Record<string, CrawlerProgress>>;
    resetProgress(source: string): Promise<void>;
    crawlMovieList(pageNum?: number): Promise<void>;
}
export {};
