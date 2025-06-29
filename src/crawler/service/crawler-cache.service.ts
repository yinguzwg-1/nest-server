import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AITranslationService } from '../../translation/service/ai-translation.service';

@Injectable()
export class CrawlerCacheService {
  private readonly logger = new Logger(CrawlerCacheService.name);
  private readonly cache = new Map<string, string>(); // 简单的内存缓存，生产环境建议使用Redis
  private readonly cacheExpiry = new Map<string, number>();
  private readonly CACHE_TTL = 24 * 60 * 60 * 1000; // 24小时

  constructor(
    private readonly aiTranslationService: AITranslationService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * 获取缓存的翻译结果
   */
  async getCachedTranslation(text: string): Promise<string | null> {
    const cacheKey = `translation:${this.hashText(text)}`;
    const cached = this.cache.get(cacheKey);
    const expiry = this.cacheExpiry.get(cacheKey);

    if (cached && expiry && Date.now() < expiry) {
      this.logger.debug(
        `Cache hit for translation: ${text.substring(0, 20)}...`,
      );
      return cached;
    }

    // 清理过期缓存
    if (expiry && Date.now() >= expiry) {
      this.cache.delete(cacheKey);
      this.cacheExpiry.delete(cacheKey);
    }

    return null;
  }

  /**
   * 设置翻译缓存
   */
  async setCachedTranslation(text: string, translation: string): Promise<void> {
    const cacheKey = `translation:${this.hashText(text)}`;
    this.cache.set(cacheKey, translation);
    this.cacheExpiry.set(cacheKey, Date.now() + this.CACHE_TTL);
    this.logger.debug(`Cached translation: ${text.substring(0, 20)}...`);
  }

  /**
   * 批量获取翻译（优先使用缓存）
   */
  async batchTranslateWithCache(
    texts: string[],
  ): Promise<{ text: string; translation: string }[]> {
    const results: { text: string; translation: string }[] = [];
    const uncachedTexts: string[] = [];

    // 先检查缓存
    for (const text of texts) {
      const cached = await this.getCachedTranslation(text);
      if (cached) {
        results.push({ text, translation: cached });
      } else {
        uncachedTexts.push(text);
      }
    }

    // 批量翻译未缓存的文本
    if (uncachedTexts.length > 0) {
      this.logger.log(`需要翻译 ${uncachedTexts.length} 个未缓存的文本`);

      const translationPromises = uncachedTexts.map(async (text) => {
        try {
          const translation =
            await this.aiTranslationService.translateToEnglish(text);
          await this.setCachedTranslation(text, translation);
          return { text, translation };
        } catch (error) {
          this.logger.warn(`翻译失败 "${text}": ${error.message}`);
          return { text, translation: text }; // 翻译失败时使用原文
        }
      });

      const newTranslations = await Promise.all(translationPromises);
      results.push(...newTranslations);
    }

    return results;
  }

  /**
   * 简单的文本哈希函数
   */
  private hashText(text: string): string {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // 转换为32位整数
    }
    return hash.toString();
  }

  /**
   * 清理过期缓存
   */
  private cleanupExpiredCache(): void {
    const now = Date.now();
    for (const [key, expiry] of this.cacheExpiry.entries()) {
      if (now >= expiry) {
        this.cache.delete(key);
        this.cacheExpiry.delete(key);
      }
    }
  }

  /**
   * 获取缓存统计信息
   */
  getCacheStats(): { size: number; hitRate: number } {
    this.cleanupExpiredCache();
    return {
      size: this.cache.size,
      hitRate: 0, // 这里可以添加命中率统计
    };
  }

  /**
   * 清空所有缓存
   */
  clearCache(): void {
    this.cache.clear();
    this.cacheExpiry.clear();
    this.logger.log('缓存已清空');
  }
}
