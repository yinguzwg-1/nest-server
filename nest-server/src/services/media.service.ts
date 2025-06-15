import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, FindOptionsWhere } from 'typeorm';
import { Media, MediaType, MediaStatus } from '../entities/media.entity';
import { CreateMediaDto, UpdateMediaDto, QueryMediaDto, PaginatedMediaResponseDto } from '../dto/media.dto';

@Injectable()
export class MediaService {
  private readonly logger = new Logger(MediaService.name);

  constructor(
    @InjectRepository(Media)
    private mediaRepository: Repository<Media>,
  ) {}

  // 创建媒体记录
  async create(createMediaDto: CreateMediaDto): Promise<Media> {
    this.logger.debug(`创建新媒体: ${JSON.stringify(createMediaDto)}`);
    const media = this.mediaRepository.create(createMediaDto);
    return await this.mediaRepository.save(media);
  }

  // 获取所有媒体记录（支持筛选和分页）
  async findAll(queryDto: QueryMediaDto): Promise<PaginatedMediaResponseDto> {
    this.logger.debug(`查询媒体列表，参数: ${JSON.stringify(queryDto)}`);
    
    const {
      type,
      genre,
      year,
      rating,
      status,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
      page = 1,
      limit = 12,
      search
    } = queryDto;

    const queryBuilder = this.mediaRepository.createQueryBuilder('media');

    // 构建查询条件
    const where: FindOptionsWhere<Media> = {};

    if (type) {
      queryBuilder.andWhere('media.type = :type', { type });
    }

    if (year) {
      queryBuilder.andWhere('media.year = :year', { year });
    }

    if (rating) {
      queryBuilder.andWhere('media.rating >= :rating', { rating });
    }

    if (status) {
      queryBuilder.andWhere('media.status = :status', { status });
    }

    if (genre) {
      queryBuilder.andWhere('JSON_CONTAINS(media.genres, :genre)', { 
        genre: JSON.stringify(genre) 
      });
    }

    if (search) {
      queryBuilder.andWhere(
        '(media.title LIKE :search OR media.description LIKE :search OR media.director LIKE :search OR media.creator LIKE :search)',
        { search: `%${search}%` }
      );
    }

    // 排序
    const validSortFields = ['year', 'rating', 'title', 'createdAt', 'updatedAt'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
    queryBuilder.orderBy(`media.${sortField}`, sortOrder);

    // 分页
    const offset = (page - 1) * limit;
    queryBuilder.skip(offset).take(limit);

    // 执行查询
    const [data, total] = await queryBuilder.getManyAndCount();
    
    this.logger.debug(`查询完成，返回 ${data.length} 条记录，总数: ${total}`);
    
    // 计算分页信息
    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    return {
      data,
      total,
      page,
      totalPages,
      hasNext,
      hasPrev,
    };
  }

  // 根据ID查找媒体记录
  async findOne(id: string): Promise<Media> {
    this.logger.debug(`获取单个媒体，ID: ${id}`);
    const media = await this.mediaRepository.findOne({ where: { id } });
    if (!media) {
      throw new NotFoundException(`媒体记录 ID ${id} 未找到`);
    }
    return media;
  }

  // 更新媒体记录
  async update(id: string, updateMediaDto: UpdateMediaDto): Promise<Media> {
    this.logger.debug(`更新媒体，ID: ${id}, 数据: ${JSON.stringify(updateMediaDto)}`);
    await this.mediaRepository.update(id, updateMediaDto);
    return this.findOne(id);
  }

  // 删除媒体记录
  async remove(id: string): Promise<void> {
    this.logger.debug(`删除媒体，ID: ${id}`);
    const media = await this.findOne(id);
    await this.mediaRepository.remove(media);
  }

  // 根据类型获取媒体统计
  async getStatistics(): Promise<{
    total: number;
    movies: number;
    tvShows: number;
    averageRating: number;
  }> {
    this.logger.debug('获取媒体统计信息');
    const total = await this.mediaRepository.count();
    const movies = await this.mediaRepository.count({ where: { type: MediaType.MOVIE } });
    const tvShows = await this.mediaRepository.count({ where: { type: MediaType.TV } });
    
    const result = await this.mediaRepository
      .createQueryBuilder('media')
      .select('AVG(media.rating)', 'averageRating')
      .getRawOne();
    
    const averageRating = parseFloat(result.averageRating) || 0;

    return {
      total,
      movies,
      tvShows,
      averageRating: Math.round(averageRating * 10) / 10, // 保留一位小数
    };
  }

  // 获取所有类型
  async getGenres(): Promise<string[]> {
    this.logger.debug('获取所有类型');
    const medias = await this.mediaRepository.find({ select: ['genres'] });
    const allGenres = medias.flatMap(media => media.genres);
    return [...new Set(allGenres)].sort();
  }

  // 搜索媒体
  async search(query: string, options: QueryMediaDto): Promise<PaginatedMediaResponseDto> {
    this.logger.debug(`搜索媒体，关键词: ${query}, 选项: ${JSON.stringify(options)}`);
    return this.findAll({ ...options, search: query });
  }

  // 按评分获取热门媒体
  async getPopular(limit: number = 10): Promise<Media[]> {
    this.logger.debug(`获取热门媒体，限制: ${limit}`);
    return await this.mediaRepository.find({
      order: { rating: 'DESC' },
      take: limit,
    });
  }

  // 按年份获取最新媒体
  async getLatest(limit: number = 10): Promise<Media[]> {
    this.logger.debug(`获取最新媒体，限制: ${limit}`);
    return await this.mediaRepository.find({
      order: { year: 'DESC', createdAt: 'DESC' },
      take: limit,
    });
  }

  // 获取即将上映的媒体
  async getUpcoming(limit: number = 10): Promise<Media[]> {
    this.logger.debug(`获取即将上映媒体，限制: ${limit}`);
    return await this.mediaRepository.find({
      where: { status: MediaStatus.UPCOMING },
      order: { year: 'ASC' },
      take: limit,
    });
  }
} 