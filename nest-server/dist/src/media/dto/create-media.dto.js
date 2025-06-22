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
exports.CreateMediaDto = exports.TranslationsDto = exports.MultiLanguageStringDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
const types_1 = require("../types");
class MultiLanguageStringDto {
}
exports.MultiLanguageStringDto = MultiLanguageStringDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], MultiLanguageStringDto.prototype, "zh", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], MultiLanguageStringDto.prototype, "en", void 0);
class TranslationsDto {
}
exports.TranslationsDto = TranslationsDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], TranslationsDto.prototype, "title", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], TranslationsDto.prototype, "description", void 0);
class CreateMediaDto {
}
exports.CreateMediaDto = CreateMediaDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: '标题' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateMediaDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '描述' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateMediaDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '海报URL' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateMediaDto.prototype, "poster", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '背景图URL' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateMediaDto.prototype, "backdrop", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '年份' }),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateMediaDto.prototype, "year", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '评分', minimum: 0, maximum: 10 }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(10),
    __metadata("design:type", Number)
], CreateMediaDto.prototype, "rating", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '类型', enum: types_1.MediaType }),
    (0, class_validator_1.IsEnum)(types_1.MediaType),
    __metadata("design:type", String)
], CreateMediaDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '状态', enum: types_1.MediaStatus }),
    (0, class_validator_1.IsEnum)(types_1.MediaStatus),
    __metadata("design:type", String)
], CreateMediaDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '类型', isArray: true }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], CreateMediaDto.prototype, "genres", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '时长（分钟）', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateMediaDto.prototype, "duration", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '导演', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateMediaDto.prototype, "director", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '票房收入', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateMediaDto.prototype, "boxOffice", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '季数', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateMediaDto.prototype, "seasons", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '总集数', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateMediaDto.prototype, "episodes", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '制片人/创作者', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateMediaDto.prototype, "creator", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '播出网络/平台', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateMediaDto.prototype, "network", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '演员阵容', isArray: true }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], CreateMediaDto.prototype, "cast", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '来源URL', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateMediaDto.prototype, "sourceUrl", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '图片下载状态', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateMediaDto.prototype, "isImagesDownloaded", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '观看次数', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateMediaDto.prototype, "views", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '喜欢次数', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateMediaDto.prototype, "likes", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => TranslationsDto),
    __metadata("design:type", TranslationsDto)
], CreateMediaDto.prototype, "translations", void 0);
//# sourceMappingURL=create-media.dto.js.map