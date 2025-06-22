"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CrawlerModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const service_1 = require("../service");
const controller_1 = require("../controller");
const entities_1 = require("../../media/entities");
const module_1 = require("../../translation/module");
let CrawlerModule = class CrawlerModule {
};
exports.CrawlerModule = CrawlerModule;
exports.CrawlerModule = CrawlerModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([entities_1.Media]),
            module_1.TranslationModule,
        ],
        controllers: [controller_1.CrawlerController],
        providers: [service_1.CrawlerService],
        exports: [service_1.CrawlerService],
    })
], CrawlerModule);
//# sourceMappingURL=index.js.map