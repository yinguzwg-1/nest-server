import { CrawlerService } from '../service';
export declare class CrawlerController {
    private readonly crawlerService;
    constructor(crawlerService: CrawlerService);
    crawlMovies(page?: number): Promise<{
        message: string;
    }>;
}
