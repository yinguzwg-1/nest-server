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
exports.Translation = exports.TranslationField = void 0;
const typeorm_1 = require("typeorm");
const entities_1 = require("../../media/entities");
var TranslationField;
(function (TranslationField) {
    TranslationField["TITLE"] = "title";
    TranslationField["DESCRIPTION"] = "description";
})(TranslationField || (exports.TranslationField = TranslationField = {}));
let Translation = class Translation {
};
exports.Translation = Translation;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Translation.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => entities_1.Media, media => media.translations, { onDelete: 'CASCADE' }),
    __metadata("design:type", entities_1.Media)
], Translation.prototype, "media", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], Translation.prototype, "mediaId", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: TranslationField
    }),
    __metadata("design:type", String)
], Translation.prototype, "field", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 2 }),
    __metadata("design:type", String)
], Translation.prototype, "language", void 0);
__decorate([
    (0, typeorm_1.Column)('text'),
    __metadata("design:type", String)
], Translation.prototype, "value", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Translation.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Translation.prototype, "updatedAt", void 0);
exports.Translation = Translation = __decorate([
    (0, typeorm_1.Entity)('translations')
], Translation);
//# sourceMappingURL=index.js.map