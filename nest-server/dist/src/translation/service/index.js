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
var TranslationService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TranslationService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const entities_1 = require("../entities");
let TranslationService = TranslationService_1 = class TranslationService {
    constructor(translationRepository, dataSource) {
        this.translationRepository = translationRepository;
        this.dataSource = dataSource;
        this.logger = new common_1.Logger(TranslationService_1.name);
    }
    async getTranslation(mediaId, field, language) {
        const translation = await this.translationRepository.findOne({
            where: { mediaId, field, language }
        });
        return translation?.value || null;
    }
    async setTranslation(mediaId, field, language, value) {
        let translation = await this.translationRepository.findOne({
            where: { mediaId, field, language }
        });
        if (translation) {
            translation.value = value;
            return await this.translationRepository.save(translation);
        }
        else {
            translation = this.translationRepository.create({
                mediaId,
                field,
                language,
                value
            });
            return await this.translationRepository.save(translation);
        }
    }
    async getTranslations(mediaId, field) {
        const translations = await this.translationRepository.find({
            where: { mediaId, field },
        });
        return translations.reduce((acc, translation) => {
            acc[translation.language] = translation.value;
            return acc;
        }, {});
    }
    async setTranslations(mediaId, field, translations) {
        try {
            await this.translationRepository.delete({ mediaId, field });
            const translationEntities = Object.entries(translations).map(([language, value]) => ({
                mediaId,
                field,
                language,
                value,
            }));
            await this.translationRepository.save(translationEntities);
            this.logger.log(`Successfully set translations for media ${mediaId}, field ${field}`);
        }
        catch (error) {
            this.logger.error(`Failed to set translations for media ${mediaId}, field ${field}: ${error.message}`);
            throw error;
        }
    }
    async createTranslationsForNewMedia(media, translations) {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            if (translations.title) {
                const titleTranslations = Object.entries(translations.title).map(([language, value]) => this.translationRepository.create({
                    mediaId: media.id,
                    field: entities_1.TranslationField.TITLE,
                    language,
                    value,
                }));
                await queryRunner.manager.save(entities_1.Translation, titleTranslations);
            }
            await queryRunner.commitTransaction();
            this.logger.log(`Successfully created translations for new media ${media.id}`);
        }
        catch (error) {
            await queryRunner.rollbackTransaction();
            this.logger.error(`Failed to create translations for new media ${media.id}: ${error.message}`);
            throw error;
        }
        finally {
            await queryRunner.release();
        }
    }
    async deleteTranslations(mediaId) {
        await this.translationRepository.delete({ mediaId });
    }
};
exports.TranslationService = TranslationService;
exports.TranslationService = TranslationService = TranslationService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(entities_1.Translation)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.DataSource])
], TranslationService);
//# sourceMappingURL=index.js.map