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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CrawlerController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const service_1 = require("../service");
let CrawlerController = class CrawlerController {
    constructor(crawlerService) {
        this.crawlerService = crawlerService;
    }
    async crawlMovies(page = 1) {
        await this.crawlerService.crawlMovieList(page);
        return { message: `Successfully crawled page ${page}` };
    }
};
exports.CrawlerController = CrawlerController;
__decorate([
    (0, common_1.Post)('movies'),
    (0, swagger_1.ApiOperation)({ summary: '爬取电影列表' }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, type: Number, description: '页码' }),
    __param(0, (0, common_1.Query)('page', new common_1.ParseIntPipe({ optional: true }))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], CrawlerController.prototype, "crawlMovies", null);
exports.CrawlerController = CrawlerController = __decorate([
    (0, swagger_1.ApiTags)('爬虫'),
    (0, common_1.Controller)('crawler'),
    __metadata("design:paramtypes", [service_1.CrawlerService])
], CrawlerController);
//# sourceMappingURL=index.js.map