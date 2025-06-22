import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as CryptoJS from 'crypto-js';

@Injectable()
export class AITranslationService {
  private readonly appKey: string;
  private readonly appSecret: string;
  private readonly youdaoApiUrl = 'https://openapi.youdao.com/api';

  constructor(private configService: ConfigService) {
    this.appKey = this.configService.get<string>('YOUDAO_APP_KEY');
    this.appSecret = this.configService.get<string>('YOUDAO_APP_SECRET');
  }

  private truncate(q: string): string {
    const len = q.length;
    if (len <= 20) return q;
    return q.substring(0, 10) + len + q.substring(len - 10, len);
  }

  private generateSign(q: string, salt: string, curtime: string): string {
    const str = this.appKey + this.truncate(q) + salt + curtime + this.appSecret;
    return CryptoJS.SHA256(str).toString(CryptoJS.enc.Hex);
  }

  private async translateText(text: string, from: string, to: string): Promise<string> {
    try {
      const salt = (new Date).getTime().toString();
      const curtime = Math.round(new Date().getTime() / 1000).toString();
      const sign = this.generateSign(text, salt, curtime);

      const response = await axios.post(this.youdaoApiUrl, {
        q: text,
        from,
        to,
        appKey: this.appKey,
        salt,
        sign,
        signType: 'v3',
        curtime,
      });

      if (response.data.errorCode === '0') {
        return response.data.translation[0];
      } else {
        console.error('Translation error:', response.data);
        return text; // 如果翻译失败，返回原文
      }
    } catch (error) {
      console.error('Translation request error:', error);
      return text; // 如果请求失败，返回原文
    }
  }

  async translateToEnglish(text: string): Promise<string> {
    return this.translateText(text, 'zh-CHS', 'en');
  }

  async translateToChinese(text: string): Promise<string> {
    return this.translateText(text, 'en', 'zh-CHS');
  }

  async translateBatch(texts: string[], targetLanguage: 'en' | 'zh'): Promise<string[]> {
    const from = targetLanguage === 'en' ? 'zh-CHS' : 'en';
    const to = targetLanguage === 'en' ? 'en' : 'zh-CHS';

    // 有道翻译 API 不支持批量翻译，所以我们需要逐个翻译
    const translations = await Promise.all(
      texts.map(text => this.translateText(text, from, to))
    );

    return translations;
  }
} 