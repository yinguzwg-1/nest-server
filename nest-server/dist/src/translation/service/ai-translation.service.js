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
var AITranslationService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AITranslationService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const axios_1 = require("axios");
const common_2 = require("@nestjs/common");
const md5_1 = require("./md5");
let AITranslationService = AITranslationService_1 = class AITranslationService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_2.Logger(AITranslationService_1.name);
        this.youdaoApiUrl = 'http://api.fanyi.baidu.com/api/trans/vip/translate';
        this.appKey = this.configService.get('YOUDAO_APP_KEY');
        this.appSecret = this.configService.get('YOUDAO_APP_SECRET');
        if (!this.appKey || !this.appSecret) {
            this.logger.error('有道翻译配置缺失！请检查环境变量 YOUDAO_APP_KEY 和 YOUDAO_APP_SECRET');
        }
        else {
            this.logger.log('有道翻译服务初始化成功');
        }
    }
    truncate(q) {
        const len = q.length;
        if (len <= 20)
            return q;
        return q.substring(0, 10) + len + q.substring(len - 10, len);
    }
    generateSign(q, salt) {
        const str = this.appKey + this.truncate(q) + salt + this.appSecret;
        return (0, md5_1.MD5)(str);
    }
    async translateText(text, from, to) {
        if (!text.trim()) {
            this.logger.warn('翻译文本为空');
            return text;
        }
        try {
            const salt = (new Date).getTime().toString();
            const sign = this.generateSign(text, salt);
            this.logger.debug(`开始翻译，原文: ${text}, 源语言: ${from}, 目标语言: ${to}`);
            const response = await axios_1.default.get(this.youdaoApiUrl, {
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
            });
            if (response.data.trans_result) {
                const translatedText = response.data.trans_result[0].dst;
                this.logger.debug(`翻译成功，结果: ${translatedText}`);
                return translatedText;
            }
            else {
                this.logger.error(`翻译失败，错误信息: ${JSON.stringify(response.data)}`);
                return text;
            }
        }
        catch (error) {
            if (axios_1.default.isAxiosError(error)) {
                this.logger.error(`网络请求错误: ${error.message}`);
                if (error.response) {
                    this.logger.error(`响应状态: ${error.response.status}`);
                    this.logger.error(`响应数据: ${JSON.stringify(error.response.data)}`);
                }
            }
            else {
                this.logger.error(`未知错误: ${error.message}`);
            }
            return text;
        }
    }
    async translateToEnglish(text) {
        return this.translateText(text, 'zh', 'en');
    }
    async translateToChinese(text) {
        return this.translateText(text, 'en', 'zh');
    }
    async translateBatch(texts, targetLanguage) {
        if (!texts.length) {
            this.logger.warn('批量翻译文本数组为空');
            return texts;
        }
        const from = targetLanguage === 'en' ? 'zh-CHS' : 'en';
        const to = targetLanguage === 'en' ? 'en' : 'zh-CHS';
        this.logger.log(`开始批量翻译 ${texts.length} 条文本`);
        const translations = await Promise.all(texts.map(async (text, index) => {
            await new Promise(resolve => setTimeout(resolve, index * 100));
            return this.translateText(text, from, to);
        }));
        this.logger.log(`批量翻译完成，成功翻译 ${translations.length} 条文本`);
        return translations;
    }
};
exports.AITranslationService = AITranslationService;
exports.AITranslationService = AITranslationService = AITranslationService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], AITranslationService);
//# sourceMappingURL=ai-translation.service.js.map