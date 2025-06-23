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
exports.MediaController = void 0;
const common_1 = require("@nestjs/common");
const service_1 = require("../service");
const create_media_dto_1 = require("../dto/create-media.dto");
const query_media_dto_1 = require("../dto/query-media.dto");
const swagger_1 = require("@nestjs/swagger");
const language_interceptor_1 = require("../../common/interceptors/language.interceptor");
let MediaController = class MediaController {
    constructor(mediaService) {
        this.mediaService = mediaService;
    }
    create(createMediaDto) {
        return this.mediaService.create(createMediaDto);
    }
    findAll(query) {
        return this.mediaService.findAllWithTranslationsRaw(query);
    }
};
exports.MediaController = MediaController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: '创建媒体' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: '创建成功' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_media_dto_1.CreateMediaDto]),
    __metadata("design:returntype", void 0)
], MediaController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: '获取媒体列表' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '获取成功' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_media_dto_1.QueryMediaDto]),
    __metadata("design:returntype", void 0)
], MediaController.prototype, "findAll", null);
exports.MediaController = MediaController = __decorate([
    (0, swagger_1.ApiTags)('media'),
    (0, common_1.Controller)('media'),
    (0, common_1.UseInterceptors)(language_interceptor_1.LanguageInterceptor),
    __metadata("design:paramtypes", [service_1.MediaService])
], MediaController);
//# sourceMappingURL=index.js.map