import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { MD5 } from './md5';

@Injectable()
export class AITranslationService {
  private readonly logger = new Logger(AITranslationService.name);
  private readonly appKey: string;
  private readonly appSecret: string;
  private readonly youdaoApiUrl =
    'http://api.fanyi.baidu.com/api/trans/vip/translate';

  constructor(private configService: ConfigService) {
    this.appKey = this.configService.get<string>('YOUDAO_APP_KEY');
    this.appSecret = this.configService.get<string>('YOUDAO_APP_SECRET');

    if (!this.appKey || !this.appSecret) {
      this.logger.error(
        '有道翻译配置缺失！请检查环境变量 YOUDAO_APP_KEY 和 YOUDAO_APP_SECRET',
      );
    } else {
      this.logger.log('有道翻译服务初始化成功');
    }
  }

  // 获取配置的延迟时间
  private getTranslationDelay(): number {
    return this.configService.get<number>('TRANSLATION_DELAY', 1500);
  }

  // 获取配置的最大重试次数
  private getMaxRetries(): number {
    return this.configService.get<number>('TRANSLATION_MAX_RETRIES', 3);
  }

  // 获取配置的超时时间
  private getTimeout(): number {
    return this.configService.get<number>('TRANSLATION_TIMEOUT', 10000);
  }

  private truncate(q: string): string {
    const len = q.length;
    if (len <= 20) return q;
    return q.substring(0, 10) + len + q.substring(len - 10, len);
  }

  private generateSign(q: string, salt: string): string {
    const str = this.appKey + this.truncate(q) + salt + this.appSecret;
    return MD5(str);
  }

  private async translateText(
    text: string,
    from: string,
    to: string,
    retryCount: number = 0,
  ): Promise<string> {
    if (!text.trim()) {
      this.logger.warn('翻译文本为空');
      return text;
    }

    const maxRetries = this.getMaxRetries();
    const baseDelay = this.getTranslationDelay();

    try {
      const salt = new Date().getTime().toString();
      const sign = this.generateSign(text, salt);

      this.logger.debug(
        `开始翻译，原文: ${text}, 源语言: ${from}, 目标语言: ${to}`,
      );

      const response = await axios.get(this.youdaoApiUrl, {
        params: {
          q: text,
          from,
          to,
          appid: this.appKey,
          salt,
          sign,
        },
        headers: {
          dataType: 'jsonp',
        },
        timeout: this.getTimeout(),
      });

      if (response.data.trans_result) {
        const translatedText = response.data.trans_result[0].dst;
        this.logger.debug(`翻译成功，结果: ${translatedText}`);
        return translatedText;
      } else {
        // 检查是否是访问限制错误
        if (response.data.error_code === '54003') {
          this.logger.warn(`访问限制错误 (54003)，当前重试次数: ${retryCount}`);
          
          if (retryCount < maxRetries) {
            const delay = baseDelay * Math.pow(2, retryCount); // 指数退避
            this.logger.log(`等待 ${delay}ms 后重试...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            return this.translateText(text, from, to, retryCount + 1);
          } else {
            this.logger.error(`翻译失败，已达到最大重试次数: ${JSON.stringify(response.data)}`);
            return text; // 返回原文
          }
        } else {
          this.logger.error(
            `翻译失败，错误信息: ${JSON.stringify(response.data)}`,
          );
          return text; // 如果翻译失败，返回原文
        }
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        this.logger.error(`网络请求错误: ${error.message}`);
        if (error.response) {
          this.logger.error(`响应状态: ${error.response.status}`);
          this.logger.error(`响应数据: ${JSON.stringify(error.response.data)}`);
          
          // 如果是访问限制错误，尝试重试
          if (error.response.data?.error_code === '54003' && retryCount < maxRetries) {
            const delay = baseDelay * Math.pow(2, retryCount);
            this.logger.log(`网络错误，等待 ${delay}ms 后重试...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            return this.translateText(text, from, to, retryCount + 1);
          }
        }
      } else {
        this.logger.error(`未知错误: ${error.message}`);
      }
      return text; // 如果请求失败，返回原文
    }
  }

  async translateToEnglish(text: string): Promise<string> {
    return this.translateText(text, 'zh', 'en');
  }

  async translateToChinese(text: string): Promise<string> {
    return this.translateText(text, 'en', 'zh');
  }

  async translateBatch(
    texts: string[],
    targetLanguage: 'en' | 'zh',
  ): Promise<string[]> {
    if (!texts.length) {
      this.logger.warn('批量翻译文本数组为空');
      return texts;
    }

    const from = targetLanguage === 'en' ? 'zh-CHS' : 'en';
    const to = targetLanguage === 'en' ? 'en' : 'zh-CHS';

    this.logger.log(`开始批量翻译 ${texts.length} 条文本`);

    // 有道翻译 API 不支持批量翻译，所以我们需要逐个翻译
    // 使用串行处理而不是并行，以避免触发频率限制
    const translations: string[] = [];
    
    for (let i = 0; i < texts.length; i++) {
      const text = texts[i];
      this.logger.debug(`翻译第 ${i + 1}/${texts.length} 条文本: ${text}`);
      
      try {
        const translation = await this.translateText(text, from, to);
        translations.push(translation);
        
        // 增加延迟以避免触发频率限制
        if (i < texts.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, this.getTranslationDelay()));
        }
      } catch (error) {
        this.logger.error(`翻译第 ${i + 1} 条文本失败: ${error.message}`);
        translations.push(text); // 失败时返回原文
      }
    }

    this.logger.log(`批量翻译完成，成功翻译 ${translations.length} 条文本`);
    return translations;
  }
}
