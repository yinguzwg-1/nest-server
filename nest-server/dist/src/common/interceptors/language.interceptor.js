"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LanguageInterceptor = void 0;
const common_1 = require("@nestjs/common");
const operators_1 = require("rxjs/operators");
let LanguageInterceptor = class LanguageInterceptor {
    intercept(context, next) {
        const request = context.switchToHttp().getRequest();
        const lang = request.headers['accept-language']?.split(',')[0]?.substring(0, 2) || 'zh';
        return next.handle().pipe((0, operators_1.map)(data => {
            if (Array.isArray(data?.items)) {
                return {
                    ...data,
                    items: data.items.map(item => this.transformItem(item, lang))
                };
            }
            else if (data?.translations) {
                return this.transformItem(data, lang);
            }
            return data;
        }));
    }
    transformItem(item, lang) {
        if (!item.translations) {
            return item;
        }
        const result = { ...item };
        if (item.translations.title) {
            result.title = item.translations.title[lang] || item.title;
        }
        if (item.translations.description) {
            result.description = item.translations.description[lang] || item.description;
        }
        delete result.translations;
        return result;
    }
};
exports.LanguageInterceptor = LanguageInterceptor;
exports.LanguageInterceptor = LanguageInterceptor = __decorate([
    (0, common_1.Injectable)()
], LanguageInterceptor);
//# sourceMappingURL=language.interceptor.js.map