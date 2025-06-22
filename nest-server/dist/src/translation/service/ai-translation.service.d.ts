import { ConfigService } from '@nestjs/config';
export declare class AITranslationService {
    private configService;
    private readonly logger;
    private readonly appKey;
    private readonly appSecret;
    private readonly youdaoApiUrl;
    constructor(configService: ConfigService);
    private truncate;
    private generateSign;
    private translateText;
    translateToEnglish(text: string): Promise<string>;
    translateToChinese(text: string): Promise<string>;
    translateBatch(texts: string[], targetLanguage: 'en' | 'zh'): Promise<string[]>;
}
