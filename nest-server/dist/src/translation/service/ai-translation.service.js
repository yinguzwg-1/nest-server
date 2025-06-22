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
const CryptoJS = require("crypto-js");
const common_2 = require("@nestjs/common");
let AITranslationService = AITranslationService_1 = class AITranslationService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_2.Logger(AITranslationService_1.name);
        this.youdaoApiUrl = 'https://openapi.youdao.com/api';
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
    generateSign(q, salt, curtime) {
        const str = this.appKey + this.truncate(q) + salt + curtime + this.appSecret;
        return CryptoJS.SHA256(str).toString(CryptoJS.enc.Hex);
    }
    async translateText(text, from, to) {
        if (!text.trim()) {
            this.logger.warn('翻译文本为空');
            return text;
        }
        try {
            const salt = (new Date).getTime().toString();
            const curtime = Math.round(new Date().getTime() / 1000).toString();
            const sign = this.generateSign(text, salt, curtime);
            this.logger.debug(`开始翻译，原文: ${text}, 源语言: ${from}, 目标语言: ${to}`);
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
                const translatedText = response.data.translation[0];
                this.logger.debug(`翻译成功，结果: ${translatedText}`);
                return translatedText;
            }
            else {
                this.logger.error(`翻译失败，错误码: ${response.data.errorCode}，错误信息: ${JSON.stringify(response.data)}`);
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
        return this.translateText(text, 'zh-CHS', 'en');
    }
    async translateToChinese(text) {
        return this.translateText(text, 'en', 'zh-CHS');
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