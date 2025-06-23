import { Injectable, NotFoundException, Logger, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Media } from '../entities';
import { CreateMediaDto } from '../dto/create-media.dto';
import { UpdateMediaDto } from '../dto/update-media.dto';
import { MediaListResponseDto, MediaWithTranslationsResponseDto, MediaWithTranslations } from '../dto/media.dto';
import { QueryMediaDto } from '../dto/query-media.dto';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { TranslationService } from '../../translation/service';
import { TranslationField } from '../../translation/entities';

@Injectable()
export class MediaService {
  private readonly logger = new Logger(MediaService.name);

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


    const result = {
      items,
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

    const result = {
      items,
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


  async findOneWithTranslationsRaw(id: number): Promise<MediaWithTranslations> {
    const cacheKey = this.getCacheKey(`${id}:with-translations-raw`);
    const cached = await this.cacheManager.get<MediaWithTranslations>(cacheKey);
    
    if (cached) {
      return cached;
    }

    // 使用原生SQL进行多表查询
    const result = await this.mediaRepository.query(`
      SELECT 
          m.title,
          MAX(CASE WHEN t.language = 'en' THEN t.value END) AS title_en,
          
      FROM 
          media m
      LEFT JOIN 
          translations t ON m.id = t.mediaId
      GROUP BY 
          m.id;
    `, [id]);

    if (!result || result.length === 0) {
      throw new NotFoundException(`Media with ID ${id} not found`);
    }

    // 构建媒体对象
    const media = {
      id: result[0].id,
      title: result[0].title,
      title_en: result[0].title_en,
      description: result[0].description,
      poster: result[0].poster,
      backdrop: result[0].backdrop,
      year: result[0].year,
      rating: result[0].rating,
      status: result[0].status,
      type: result[0].type,
      cast: result[0].cast.split(','),
      duration: result[0].duration,
      director: result[0].director,
      boxOffice: result[0].boxOffice,
      views: result[0].views,
      likes: result[0].likes,
      sourceUrl: result[0].sourceUrl,
      isImagesDownloaded: result[0].isImagesDownloaded,
      createdAt: result[0].createdAt,
      updatedAt: result[0].updatedAt,
    };

    // 处理翻译数据
    const translations = {
      title: {},
      description: {}
    };

    result.forEach(row => {
      if (row.field && row.language && row.value) {
        if (row.field === TranslationField.TITLE) {
          translations.title[row.language] = row.value;
        } else if (row.field === TranslationField.DESCRIPTION) {
          translations.description[row.language] = row.value;
        }
      }
    });

    const mediaWithTranslations = { ...media, translations };
    await this.cacheManager.set(cacheKey, mediaWithTranslations);
    return mediaWithTranslations;
  }

  async findAllWithTranslationsRaw(query: QueryMediaDto): Promise<MediaWithTranslationsResponseDto> {
    const cacheKey = this.getCacheKey(`list-with-translations-raw:${JSON.stringify(query)}`);
    const cached = await this.cacheManager.get<MediaWithTranslationsResponseDto>(cacheKey);
    
    if (cached) {
      return cached;
    }

    const { page = 1, limit = 10, type, status, year, search, sortBy, orderBy } = query;
    
    // 构建WHERE条件
    let whereConditions = 'WHERE 1=1';
    const params: any[] = [];
    
    if (type) {
      whereConditions += ' AND m.type = ?';
      params.push(type);
    }
    if (status) {
      whereConditions += ' AND m.status = ?';
      params.push(status);
    }
    if (year) {
      whereConditions += ' AND m.year = ?';
      params.push(year);
    }
    if (search) {
      whereConditions += ' AND (m.title LIKE ?)';
      params.push(`%${search}%`);
    } 
   
    this.logger.log('sortBy', sortBy);
    this.logger.log('orderBy', orderBy);
    
    // 使用原生SQL进行多表查询
    const offset = (page - 1) * limit;
    const result = await this.mediaRepository.query(`
      SELECT 
          m.*,
          MAX(CASE WHEN t.language = 'en' THEN t.value END) AS title_en    
      FROM 
          media m   
      LEFT JOIN
          translations t ON m.id = t.mediaId 
      ${whereConditions}
      GROUP BY 
          m.id
      ${sortBy ? `ORDER BY m.${sortBy} ${orderBy ? orderBy : 'DESC'}` : 'ORDER BY m.id DESC'}
      LIMIT ? OFFSET ?;
    `, [...params, limit, offset]);
    // 获取总数
      const countResult = await this.mediaRepository.query(`
        SELECT COUNT(DISTINCT m.id) as total
        FROM media m
        ${whereConditions}
       
      `, params);
    
    const total = countResult[0].total;

    // 处理结果数据
    const mediaMap = new Map();
    
    result.forEach(row => {
      if (!mediaMap.has(row.id)) {
        mediaMap.set(row.id, {
          id: row.id,
          title: row.title,
          description: row.description,
          poster: row.poster,
          backdrop: row.backdrop,
          year: row.year,
          rating: row.rating,
          status: row.status,
          type: row.type,
          cast: row.cast,
          duration: row.duration,
          director: row.director,
          boxOffice: row.boxOffice,
          views: row.views,
          likes: row.likes,
          sourceUrl: row.sourceUrl,
          isImagesDownloaded: row.isImagesDownloaded,
          createdAt: row.createdAt,
          updatedAt: row.updatedAt,
          title_en: row.title_en,
          
        });
      }

      if (row.field && row.language && row.value) {
        const media = mediaMap.get(row.id);
        if (row.field === TranslationField.TITLE) {
          media.translations.title[row.language] = row.value;
        } else if (row.field === TranslationField.DESCRIPTION) {
          media.translations.description[row.language] = row.value;
        }
      }
    });

    const items = Array.from(mediaMap.values());

    const result_data: MediaWithTranslationsResponseDto = {
      items,
      meta: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / limit),
      },
    };

    await this.cacheManager.set(cacheKey, result_data);
    return result_data;
  }

} 