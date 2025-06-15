import { Entity, Column, PrimaryColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

export enum MediaType {
  MOVIE = 'movie',
  TV = 'tv'
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
    enum: ['released', 'upcoming', 'ongoing'],
    default: 'released',
  })
  status: string;

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
} 