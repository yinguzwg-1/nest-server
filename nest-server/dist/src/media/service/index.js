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
exports.MediaService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const entities_1 = require("../entities");
const typeorm_3 = require("typeorm");
const common_2 = require("@nestjs/common");
const cache_manager_1 = require("@nestjs/cache-manager");
const service_1 = require("../../translation/service");
const entities_2 = require("../../translation/entities");
let MediaService = class MediaService {
    constructor(mediaRepository, cacheManager, translationService) {
        this.mediaRepository = mediaRepository;
        this.cacheManager = cacheManager;
        this.translationService = translationService;
    }
    getCacheKey(key) {
        return `media:${key}`;
    }
    async create(createMediaDto) {
        const media = new entities_1.Media();
        media.title = createMediaDto.title;
        media.description = createMediaDto.description;
        media.poster = createMediaDto.poster;
        media.backdrop = createMediaDto.backdrop;
        media.year = createMediaDto.year;
        media.rating = createMediaDto.rating;
        media.genres = createMediaDto.genres;
        media.status = createMediaDto.status;
        media.type = createMediaDto.type;
        media.cast = createMediaDto.cast;
        media.duration = createMediaDto.duration;
        media.director = createMediaDto.director;
        media.boxOffice = createMediaDto.boxOffice;
        media.views = createMediaDto.views;
        media.likes = createMediaDto.likes;
        media.sourceUrl = createMediaDto.sourceUrl;
        media.isImagesDownloaded = createMediaDto.isImagesDownloaded;
        const savedMedia = await this.mediaRepository.save(media);
        if (createMediaDto.translations) {
            if (createMediaDto.translations.title) {
                await this.translationService.setTranslations(savedMedia.id, entities_2.TranslationField.TITLE, createMediaDto.translations.title);
            }
            if (createMediaDto.translations.description) {
                await this.translationService.setTranslations(savedMedia.id, entities_2.TranslationField.DESCRIPTION, createMediaDto.translations.description);
            }
        }
        await this.cacheManager.del(this.getCacheKey('list'));
        return savedMedia;
    }
    async update(id, updateMediaDto) {
        const media = await this.findOne(id);
        const mediaEntity = media;
        if (updateMediaDto.title)
            mediaEntity.title = updateMediaDto.title;
        if (updateMediaDto.description)
            mediaEntity.description = updateMediaDto.description;
        if (updateMediaDto.poster)
            mediaEntity.poster = updateMediaDto.poster;
        if (updateMediaDto.backdrop)
            mediaEntity.backdrop = updateMediaDto.backdrop;
        if (updateMediaDto.year)
            mediaEntity.year = updateMediaDto.year;
        if (updateMediaDto.rating)
            mediaEntity.rating = updateMediaDto.rating;
        if (updateMediaDto.genres)
            mediaEntity.genres = updateMediaDto.genres;
        if (updateMediaDto.status)
            mediaEntity.status = updateMediaDto.status;
        if (updateMediaDto.type)
            mediaEntity.type = updateMediaDto.type;
        if (updateMediaDto.cast)
            mediaEntity.cast = updateMediaDto.cast;
        if (updateMediaDto.duration)
            mediaEntity.duration = updateMediaDto.duration;
        if (updateMediaDto.director)
            mediaEntity.director = updateMediaDto.director;
        if (updateMediaDto.boxOffice)
            mediaEntity.boxOffice = updateMediaDto.boxOffice;
        if (updateMediaDto.views)
            mediaEntity.views = updateMediaDto.views;
        if (updateMediaDto.likes)
            mediaEntity.likes = updateMediaDto.likes;
        if (updateMediaDto.sourceUrl)
            mediaEntity.sourceUrl = updateMediaDto.sourceUrl;
        if (updateMediaDto.isImagesDownloaded !== undefined)
            mediaEntity.isImagesDownloaded = updateMediaDto.isImagesDownloaded;
        const savedMedia = await this.mediaRepository.save(mediaEntity);
        if (updateMediaDto.translations) {
            if (updateMediaDto.translations.title) {
                await this.translationService.setTranslations(savedMedia.id, entities_2.TranslationField.TITLE, updateMediaDto.translations.title);
            }
            if (updateMediaDto.translations.description) {
                await this.translationService.setTranslations(savedMedia.id, entities_2.TranslationField.DESCRIPTION, updateMediaDto.translations.description);
            }
        }
        await this.cacheManager.del(this.getCacheKey(`${id}`));
        await this.cacheManager.del(this.getCacheKey('list'));
        return savedMedia;
    }
    async remove(id) {
        const media = await this.findOne(id);
        const mediaEntity = media;
        await this.mediaRepository.remove(mediaEntity);
        await this.cacheManager.del(this.getCacheKey(`${id}`));
        await this.cacheManager.del(this.getCacheKey('list'));
    }
    async findAll(query) {
        const cacheKey = this.getCacheKey(`list:${JSON.stringify(query)}`);
        const cached = await this.cacheManager.get(cacheKey);
        if (cached) {
            return cached;
        }
        const { page = 1, limit = 10, type, status, year, title } = query;
        const where = {};
        if (type)
            where.type = type;
        if (status)
            where.status = status;
        if (year)
            where.year = year;
        if (title)
            where.title = (0, typeorm_3.Like)(`%${title}%`);
        const [items, total] = await this.mediaRepository.findAndCount({
            where,
            order: {
                id: 'DESC'
            },
            skip: (page - 1) * limit,
            take: limit,
        });
        const itemsWithTranslations = await Promise.all(items.map(async (item) => {
            const translations = {
                title: await this.translationService.getTranslations(item.id, entities_2.TranslationField.TITLE),
                description: await this.translationService.getTranslations(item.id, entities_2.TranslationField.DESCRIPTION)
            };
            return { ...item, translations };
        }));
        const result = {
            items: itemsWithTranslations,
            meta: {
                total,
                page: Number(page),
                limit: Number(limit),
                totalPages: Math.ceil(total / limit),
            },
        };
        await this.cacheManager.set(cacheKey, result);
        return result;
    }
    async findOne(id) {
        const cacheKey = this.getCacheKey(`${id}`);
        const cached = await this.cacheManager.get(cacheKey);
        if (cached) {
            return cached;
        }
        const media = await this.mediaRepository.findOneBy({ id });
        if (!media) {
            throw new common_1.NotFoundException(`Media with ID ${id} not found`);
        }
        const translations = {
            title: await this.translationService.getTranslations(media.id, entities_2.TranslationField.TITLE),
            description: await this.translationService.getTranslations(media.id, entities_2.TranslationField.DESCRIPTION)
        };
        const mediaWithTranslations = { ...media, translations };
        await this.cacheManager.set(cacheKey, mediaWithTranslations);
        return mediaWithTranslations;
    }
    async search(query, page = 1, pageSize = 10) {
        const cacheKey = this.getCacheKey(`search:${query}:${page}:${pageSize}`);
        const cached = await this.cacheManager.get(cacheKey);
        if (cached) {
            return cached;
        }
        const [items, total] = await this.mediaRepository.findAndCount({
            where: [
                { title: (0, typeorm_3.Like)(`%${query}%`) },
            ],
            order: {
                id: 'DESC'
            },
            skip: (page - 1) * pageSize,
            take: pageSize,
        });
        const itemsWithTranslations = await Promise.all(items.map(async (item) => {
            const translations = {
                title: await this.translationService.getTranslations(item.id, entities_2.TranslationField.TITLE),
                description: await this.translationService.getTranslations(item.id, entities_2.TranslationField.DESCRIPTION)
            };
            return { ...item, translations };
        }));
        const result = {
            items: itemsWithTranslations,
            meta: {
                total,
                page,
                limit: pageSize,
                totalPages: Math.ceil(total / pageSize),
            },
        };
        await this.cacheManager.set(cacheKey, result);
        return result;
    }
};
exports.MediaService = MediaService;
exports.MediaService = MediaService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(entities_1.Media)),
    __param(1, (0, common_2.Inject)(cache_manager_1.CACHE_MANAGER)),
    __metadata("design:paramtypes", [typeorm_2.Repository, Object, service_1.TranslationService])
], MediaService);
//# sourceMappingURL=index.js.map