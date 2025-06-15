import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Media, MediaType } from './entities/media.entity';
import { CreateMediaDto } from './dto/create-media.dto';
import { UpdateMediaDto } from './dto/update-media.dto';
import { MediaListResponseDto } from './dto/media.dto';

@Injectable()
export class MediaService {
  constructor(
    @InjectRepository(Media)
    private mediaRepository: Repository<Media>,
  ) {}

  async create(createMediaDto: CreateMediaDto): Promise<Media> {
    const media = this.mediaRepository.create(createMediaDto);
    return await this.mediaRepository.save(media);
  }

  async findAll(
    page = 1,
    pageSize = 10,
    type?: MediaType,
    year?: number,
    status?: string,
    sortBy: 'rating' | 'year' = 'rating',
    order: 'ASC' | 'DESC' = 'DESC',
  ): Promise<MediaListResponseDto> {
    const queryBuilder = this.mediaRepository.createQueryBuilder('media');

    // 添加过滤条件
    if (type) {
      queryBuilder.andWhere('media.type = :type', { type });
    }
    if (year) {
      queryBuilder.andWhere('media.year = :year', { year });
    }
    if (status) {
      queryBuilder.andWhere('media.status = :status', { status });
    }

    // 添加排序
    queryBuilder.orderBy(`media.${sortBy}`, order);

    // 添加分页
    const skip = (page - 1) * pageSize;
    queryBuilder.skip(skip).take(pageSize);

    // 执行查询
    const [data, total] = await queryBuilder.getManyAndCount();

    return {
      data,
      total,
      page,
      pageSize,
    };
  }

  async findOne(id: string): Promise<Media> {
    const media = await this.mediaRepository.findOneBy({ id });
    if (!media) {
      throw new NotFoundException(`Media with ID ${id} not found`);
    }
    return media;
  }

  async update(id: string, updateMediaDto: UpdateMediaDto): Promise<Media> {
    const media = await this.findOne(id);
    Object.assign(media, updateMediaDto);
    return await this.mediaRepository.save(media);
  }

  async remove(id: string): Promise<void> {
    const media = await this.findOne(id);
    await this.mediaRepository.remove(media);
  }

  async findByType(type: MediaType): Promise<Media[]> {
    return await this.mediaRepository.find({
      where: { type },
      order: { rating: 'DESC' },
    });
  }

  async findByYear(year: number): Promise<Media[]> {
    return await this.mediaRepository.find({
      where: { year },
      order: { rating: 'DESC' },
    });
  }

  async findByStatus(status: string): Promise<Media[]> {
    return await this.mediaRepository.find({
      where: { status },
      order: { rating: 'DESC' },
    });
  }
} 