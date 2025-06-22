import { CrawlerService } from '../service';
export declare class CrawlerController {
    private readonly crawlerService;
    private readonly logger;
    constructor(crawlerService: CrawlerService);
    crawlMovies(page?: number): Promise<{
        message: string;
    }>;
}
