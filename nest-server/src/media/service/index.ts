import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Media } from '../entities';
import { CreateMediaDto } from '../dto/create-media.dto';
import { UpdateMediaDto } from '../dto/update-media.dto';
import { MediaListResponseDto } from '../dto/media.dto';
import { QueryMediaDto } from '../dto/query-media.dto';
import { Like } from 'typeorm';
import { Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { TranslationService } from '../../translation/service';
import { TranslationField } from '../../translation/entities';

export interface MediaWithTranslations extends Omit<Media, 'translations'> {
  translations?: {
    title?: Record<string, string>;
    description?: Record<string, string>;
  };
}

@Injectable()
export class MediaService {
  constructor(
    @InjectRepository(Media)
    private mediaRepository: Repository<Media>,
    @Inject(CACHE_MANAGER)
    private cacheManager: Cache,
    private translationService: TranslationService,
  ) {}

  private getCacheKey(key: string): string {
    return `media:${key}`;
  }

  async create(createMediaDto: CreateMediaDto): Promise<Media> {
    // 创建一个新的对象，只包含 Media 实体的属性
    const media = new Media();
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

    // 保存翻译
    if (createMediaDto.translations) {
      if (createMediaDto.translations.title) {
        await this.translationService.setTranslations(
          savedMedia.id,
          TranslationField.TITLE,
          createMediaDto.translations.title
        );
      }
      if (createMediaDto.translations.description) {
        await this.translationService.setTranslations(
          savedMedia.id,
          TranslationField.DESCRIPTION,
          createMediaDto.translations.description
        );
      }
    }

    // 清除列表缓存
    await this.cacheManager.del(this.getCacheKey('list'));
    return savedMedia;
  }

  async update(id: number, updateMediaDto: UpdateMediaDto): Promise<Media> {
    const media = await this.findOne(id);
    const mediaEntity = media as Media;
    
    // 更新属性
    if (updateMediaDto.title) mediaEntity.title = updateMediaDto.title;
    if (updateMediaDto.description) mediaEntity.description = updateMediaDto.description;
    if (updateMediaDto.poster) mediaEntity.poster = updateMediaDto.poster;
    if (updateMediaDto.backdrop) mediaEntity.backdrop = updateMediaDto.backdrop;
    if (updateMediaDto.year) mediaEntity.year = updateMediaDto.year;
    if (updateMediaDto.rating) mediaEntity.rating = updateMediaDto.rating;
    if (updateMediaDto.genres) mediaEntity.genres = updateMediaDto.genres;
    if (updateMediaDto.status) mediaEntity.status = updateMediaDto.status;
    if (updateMediaDto.type) mediaEntity.type = updateMediaDto.type;
    if (updateMediaDto.cast) mediaEntity.cast = updateMediaDto.cast;
    if (updateMediaDto.duration) mediaEntity.duration = updateMediaDto.duration;
    if (updateMediaDto.director) mediaEntity.director = updateMediaDto.director;
    if (updateMediaDto.boxOffice) mediaEntity.boxOffice = updateMediaDto.boxOffice;
    if (updateMediaDto.views) mediaEntity.views = updateMediaDto.views;
    if (updateMediaDto.likes) mediaEntity.likes = updateMediaDto.likes;
    if (updateMediaDto.sourceUrl) mediaEntity.sourceUrl = updateMediaDto.sourceUrl;
    if (updateMediaDto.isImagesDownloaded !== undefined) mediaEntity.isImagesDownloaded = updateMediaDto.isImagesDownloaded;

    const savedMedia = await this.mediaRepository.save(mediaEntity);

    // 更新翻译
    if (updateMediaDto.translations) {
      if (updateMediaDto.translations.title) {
        await this.translationService.setTranslations(
          savedMedia.id,
          TranslationField.TITLE,
          updateMediaDto.translations.title
        );
      }
      if (updateMediaDto.translations.description) {
        await this.translationService.setTranslations(
          savedMedia.id,
          TranslationField.DESCRIPTION,
          updateMediaDto.translations.description
        );
      }
    }

    // 清除相关缓存
    await this.cacheManager.del(this.getCacheKey(`${id}`));
    await this.cacheManager.del(this.getCacheKey('list'));
    return savedMedia;
  }

  async remove(id: number): Promise<void> {
    const media = await this.findOne(id);
    const mediaEntity = media as Media;
    await this.mediaRepository.remove(mediaEntity);
    // 清除相关缓存
    await this.cacheManager.del(this.getCacheKey(`${id}`));
    await this.cacheManager.del(this.getCacheKey('list'));
  }

  async findAll(query: QueryMediaDto): Promise<MediaListResponseDto> {
    const cacheKey = this.getCacheKey(`list:${JSON.stringify(query)}`);
    const cached = await this.cacheManager.get<MediaListResponseDto>(cacheKey);
    
    if (cached) {
      return cached;
    }

    const { page = 1, limit = 10, type, status, year, title } = query;
    
    const where: any = {};
    if (type) where.type = type;
    if (status) where.status = status;
    if (year) where.year = year;
    if (title) where.title = Like(`%${title}%`);

    const [items, total] = await this.mediaRepository.findAndCount({
      where,
      order: {
        id: 'DESC'
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    // 获取翻译
    const itemsWithTranslations = await Promise.all(
      items.map(async (item) => {
        const translations = {
          title: await this.translationService.getTranslations(item.id, TranslationField.TITLE),
          description: await this.translationService.getTranslations(item.id, TranslationField.DESCRIPTION)
        };
        return { ...item, translations } as MediaWithTranslations;
      })
    );

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

  async findOne(id: number): Promise<MediaWithTranslations> {
    const cacheKey = this.getCacheKey(`${id}`);
    const cached = await this.cacheManager.get<MediaWithTranslations>(cacheKey);
    
    if (cached) {
      return cached;
    }

    const media = await this.mediaRepository.findOneBy({ id });
    if (!media) {
      throw new NotFoundException(`Media with ID ${id} not found`);
    }

    // 获取翻译
    const translations = {
      title: await this.translationService.getTranslations(media.id, TranslationField.TITLE),
      description: await this.translationService.getTranslations(media.id, TranslationField.DESCRIPTION)
    };

    const mediaWithTranslations = { ...media, translations };
    await this.cacheManager.set(cacheKey, mediaWithTranslations);
    return mediaWithTranslations;
  }

  async search(query: string, page: number = 1, pageSize: number = 10): Promise<MediaListResponseDto> {
    const cacheKey = this.getCacheKey(`search:${query}:${page}:${pageSize}`);
    const cached = await this.cacheManager.get<MediaListResponseDto>(cacheKey);
    
    if (cached) {
      return cached;
    }

    const [items, total] = await this.mediaRepository.findAndCount({
      where: [
        { title: Like(`%${query}%`) },
      ],
      order: {
        id: 'DESC'
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    // 获取翻译
    const itemsWithTranslations = await Promise.all(
      items.map(async (item) => {
        const translations = {
          title: await this.translationService.getTranslations(item.id, TranslationField.TITLE),
          description: await this.translationService.getTranslations(item.id, TranslationField.DESCRIPTION)
        };
        return { ...item, translations } as MediaWithTranslations;
      })
    );

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
} 