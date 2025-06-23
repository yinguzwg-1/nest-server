import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as CryptoJS from 'crypto-js';
import { Logger } from '@nestjs/common';

@Injectable()
export class AITranslationService {
  private readonly logger = new Logger(AITranslationService.name);
  private readonly appKey: string;
  private readonly appSecret: string;
  private readonly youdaoApiUrl = 'https://openapi.youdao.com/api';

  constructor(private configService: ConfigService) {
    this.appKey = this.configService.get<string>('YOUDAO_APP_KEY');
    this.appSecret = this.configService.get<string>('YOUDAO_APP_SECRET');

    if (!this.appKey || !this.appSecret) {
      this.logger.error('有道翻译配置缺失！请检查环境变量 YOUDAO_APP_KEY 和 YOUDAO_APP_SECRET');
    } else {
      this.logger.log('有道翻译服务初始化成功');
    }
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
    if (!text.trim()) {
      this.logger.warn('翻译文本为空');
      return text;
    }

    try {
      const salt = (new Date).getTime().toString();
      const curtime = Math.round(new Date().getTime() / 1000).toString();
      const sign = this.generateSign(text, salt, curtime);

      this.logger.debug(`开始翻译，原文: ${text}, 源语言: ${from}, 目标语言: ${to}`);

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
      console.log(text, from, to, this.appKey, salt, sign, curtime);
      if (response.data.errorCode === '0') {
        const translatedText = response.data.translation[0];
        this.logger.debug(`翻译成功，结果: ${translatedText}`);
        return translatedText;
      } else {
        this.logger.error(`翻译失败，错误码: ${response.data.errorCode}，错误信息: ${JSON.stringify(response.data)}`);
        // 有道翻译错误码对照表
        const errorMessages = {
          '101': '缺少必填的参数',
          '102': '不支持的语言类型',
          '103': '翻译文本过长',
          '104': '不支持的API类型',
          '105': '不支持的签名类型',
          '106': '不支持的响应类型',
          '107': '不支持的传输加密类型',
          '108': '应用ID无效',
          '109': 'batchLog格式不正确',
          '110': '无相关服务的有效实例',
          '111': '开发者账号无效',
          '113': '查询为空',
          '201': '解密失败',
          '202': '签名检验失败',
          '203': '访问IP地址不在可访问IP列表',
          '205': '请求的接口与应用的平台类型不一致',
          '206': '因为时间戳无效导致签名校验失败',
          '207': '重放请求',
          '301': '辞典查询失败',
          '302': '翻译查询失败',
          '303': '服务端的其它异常',
          '304': '会话闲置太久超时',
          '401': '账户已经欠费',
          '402': 'offlinesdk不可用',
          '411': '访问频率受限,请稍后访问',
          '412': '长请求过于频繁，请稍后访问',
        };
        
        const errorMessage = errorMessages[response.data.errorCode] || '未知错误';
        this.logger.error(`翻译错误: ${errorMessage}`);
        return text; // 如果翻译失败，返回原文
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        this.logger.error(`网络请求错误: ${error.message}`);
        if (error.response) {
          this.logger.error(`响应状态: ${error.response.status}`);
          this.logger.error(`响应数据: ${JSON.stringify(error.response.data)}`);
        }
      } else {
        this.logger.error(`未知错误: ${error.message}`);
      }
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
    if (!texts.length) {
      this.logger.warn('批量翻译文本数组为空');
      return texts;
    }

    const from = targetLanguage === 'en' ? 'zh-CHS' : 'en';
    const to = targetLanguage === 'en' ? 'en' : 'zh-CHS';

    this.logger.log(`开始批量翻译 ${texts.length} 条文本`);

    // 有道翻译 API 不支持批量翻译，所以我们需要逐个翻译
    const translations = await Promise.all(
      texts.map(async (text, index) => {
        // 添加延迟以避免请求过于频繁
        await new Promise(resolve => setTimeout(resolve, index * 100));
        return this.translateText(text, from, to);
      })
    );

    this.logger.log(`批量翻译完成，成功翻译 ${translations.length} 条文本`);
    return translations;
  }
} 