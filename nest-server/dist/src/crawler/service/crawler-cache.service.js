"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var CrawlerCacheService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CrawlerCacheService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const ai_translation_service_1 = require("../../translation/service/ai-translation.service");
let CrawlerCacheService = CrawlerCacheService_1 = class CrawlerCacheService {
    constructor(aiTranslationService, configService) {
        this.aiTranslationService = aiTranslationService;
        this.configService = configService;
        this.logger = new common_1.Logger(CrawlerCacheService_1.name);
        this.cache = new Map();
        this.cacheExpiry = new Map();
        this.CACHE_TTL = 24 * 60 * 60 * 1000;
    }
    async getCachedTranslation(text) {
        const cacheKey = `translation:${this.hashText(text)}`;
        const cached = this.cache.get(cacheKey);
        const expiry = this.cacheExpiry.get(cacheKey);
        if (cached && expiry && Date.now() < expiry) {
            this.logger.debug(`Cache hit for translation: ${text.substring(0, 20)}...`);
            return cached;
        }
        if (expiry && Date.now() >= expiry) {
            this.cache.delete(cacheKey);
            this.cacheExpiry.delete(cacheKey);
        }
        return null;
    }
    async setCachedTranslation(text, translation) {
        const cacheKey = `translation:${this.hashText(text)}`;
        this.cache.set(cacheKey, translation);
        this.cacheExpiry.set(cacheKey, Date.now() + this.CACHE_TTL);
        this.logger.debug(`Cached translation: ${text.substring(0, 20)}...`);
    }
    async batchTranslateWithCache(texts) {
        const results = [];
        const uncachedTexts = [];
        for (const text of texts) {
            const cached = await this.getCachedTranslation(text);
            if (cached) {
                results.push({ text, translation: cached });
            }
            else {
                uncachedTexts.push(text);
            }
        }
        if (uncachedTexts.length > 0) {
            this.logger.log(`需要翻译 ${uncachedTexts.length} 个未缓存的文本`);
            const translationPromises = uncachedTexts.map(async (text) => {
                try {
                    const translation = await this.aiTranslationService.translateToEnglish(text);
                    await this.setCachedTranslation(text, translation);
                    return { text, translation };
                }
                catch (error) {
                    this.logger.warn(`翻译失败 "${text}": ${error.message}`);
                    return { text, translation: text };
                }
            });
            const newTranslations = await Promise.all(translationPromises);
            results.push(...newTranslations);
        }
        return results;
    }
    hashText(text) {
        let hash = 0;
        for (let i = 0; i < text.length; i++) {
            const char = text.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return hash.toString();
    }
    cleanupExpiredCache() {
        const now = Date.now();
        for (const [key, expiry] of this.cacheExpiry.entries()) {
            if (now >= expiry) {
                this.cache.delete(key);
                this.cacheExpiry.delete(key);
            }
        }
    }
    getCacheStats() {
        this.cleanupExpiredCache();
        return {
            size: this.cache.size,
            hitRate: 0
        };
    }
    clearCache() {
        this.cache.clear();
        this.cacheExpiry.clear();
        this.logger.log('缓存已清空');
    }
};
exports.CrawlerCacheService = CrawlerCacheService;
exports.CrawlerCacheService = CrawlerCacheService = CrawlerCacheService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [ai_translation_service_1.AITranslationService,
        config_1.ConfigService])
], CrawlerCacheService);
//# sourceMappingURL=crawler-cache.service.js.map