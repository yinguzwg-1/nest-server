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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AITranslationService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const axios_1 = require("axios");
const CryptoJS = require("crypto-js");
let AITranslationService = class AITranslationService {
    constructor(configService) {
        this.configService = configService;
        this.youdaoApiUrl = 'https://openapi.youdao.com/api';
        this.appKey = this.configService.get('YOUDAO_APP_KEY');
        this.appSecret = this.configService.get('YOUDAO_APP_SECRET');
    }
    truncate(q) {
        const len = q.length;
        if (len <= 20)
            return q;
        return q.substring(0, 10) + len + q.substring(len - 10, len);
    }
    generateSign(q, salt, curtime) {
        const str = this.appKey + this.truncate(q) + salt + curtime + this.appSecret;
        return CryptoJS.SHA256(str).toString(CryptoJS.enc.Hex);
    }
    async translateText(text, from, to) {
        try {
            const salt = (new Date).getTime().toString();
            const curtime = Math.round(new Date().getTime() / 1000).toString();
            const sign = this.generateSign(text, salt, curtime);
            const response = await axios_1.default.post(this.youdaoApiUrl, {
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
            }
            else {
                console.error('Translation error:', response.data);
                return text;
            }
        }
        catch (error) {
            console.error('Translation request error:', error);
            return text;
        }
    }
    async translateToEnglish(text) {
        return this.translateText(text, 'zh-CHS', 'en');
    }
    async translateToChinese(text) {
        return this.translateText(text, 'en', 'zh-CHS');
    }
    async translateBatch(texts, targetLanguage) {
        const from = targetLanguage === 'en' ? 'zh-CHS' : 'en';
        const to = targetLanguage === 'en' ? 'en' : 'zh-CHS';
        const translations = await Promise.all(texts.map(text => this.translateText(text, from, to)));
        return translations;
    }
};
exports.AITranslationService = AITranslationService;
exports.AITranslationService = AITranslationService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], AITranslationService);
//# sourceMappingURL=ai-translation.service.js.map