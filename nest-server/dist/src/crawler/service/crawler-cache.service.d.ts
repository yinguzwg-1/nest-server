import { ConfigService } from '@nestjs/config';
import { AITranslationService } from '../../translation/service/ai-translation.service';
export declare class CrawlerCacheService {
    private readonly aiTranslationService;
    private readonly configService;
    private readonly logger;
    private readonly cache;
    private readonly cacheExpiry;
    private readonly CACHE_TTL;
    constructor(aiTranslationService: AITranslationService, configService: ConfigService);
    getCachedTranslation(text: string): Promise<string | null>;
    setCachedTranslation(text: string, translation: string): Promise<void>;
    batchTranslateWithCache(texts: string[]): Promise<{
        text: string;
        translation: string;
    }[]>;
    private hashText;
    private cleanupExpiredCache;
    getCacheStats(): {
        size: number;
        hitRate: number;
    };
    clearCache(): void;
}
