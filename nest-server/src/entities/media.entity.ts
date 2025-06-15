import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum MediaType {
  MOVIE = 'movie',
  TV = 'tv'
}

export enum MediaStatus {
  RELEASED = 'released',
  UPCOMING = 'upcoming',
  ONGOING = 'ongoing'
}

@Entity('media')
@Index(['type', 'year'])
@Index(['rating'])
@Index(['status'])
export class Media {
  @PrimaryColumn()
  id: string;

  @Column({ length: 255 })
  title: string;

  @Column('text')
  description: string;

  @Column({ length: 500 })
  poster: string;

  @Column({ length: 500 })
  backdrop: string;

  @Column('int')
  year: number;

  @Column('decimal', { precision: 3, scale: 1, default: 0.0 })
  rating: number;

  @Column('json')
  genres: string[];

  @Column({
    type: 'enum',
    enum: MediaType,
  })
  type: MediaType;

  @Column({
    type: 'enum',
    enum: MediaStatus,
    default: MediaStatus.RELEASED,
  })
  status: MediaStatus;

  // 电影特有字段
  @Column('int', { nullable: true })
  duration: number;

  @Column({ length: 255, nullable: true })
  director: string;

  @Column('bigint', { nullable: true })
  boxOffice: number;

  // 电视剧特有字段
  @Column('int', { nullable: true })
  seasons: number;

  @Column('int', { nullable: true })
  episodes: number;

  @Column({ length: 255, nullable: true })
  creator: string;

  @Column({ length: 255, nullable: true })
  network: string;

  // 通用字段
  @Column('json')
  cast: string[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // 计算属性 - 判断是否为电影
  get isMovie(): boolean {
    return this.type === MediaType.MOVIE;
  }

  // 计算属性 - 判断是否为电视剧
  get isTVShow(): boolean {
    return this.type === MediaType.TV;
  }

  // 获取显示时长的方法
  getDurationDisplay(): string {
    if (this.isMovie && this.duration) {
      return `${this.duration}分钟`;
    }
    if (this.isTVShow) {
      return `${this.seasons}季 ${this.episodes}集`;
    }
    return '';
  }

  // 获取创作者信息
  getCreatorInfo(): string {
    if (this.isMovie && this.director) {
      return `导演: ${this.director}`;
    }
    if (this.isTVShow && this.creator) {
      return `制片: ${this.creator}`;
    }
    return '';
  }
} 