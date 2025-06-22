import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { MediaType, MediaStatus } from '../types';
import { Translation } from '../../translation/entities';

@Entity('media')
export class Media {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column()
  description: string;

  @Column()
  poster: string;

  @Column()
  backdrop: string;

  @Column()
  year: number;

  @Column('decimal', { precision: 3, scale: 1 })
  rating: number;

  @Column('simple-array')
  genres: string[];

  @Column({
    type: 'enum',
    enum: MediaStatus,
    default: MediaStatus.UPCOMING
  })
  status: MediaStatus;

  @Column({
    type: 'enum',
    enum: MediaType
  })
  type: MediaType;

  @Column('simple-array')
  cast: string[];

  @Column({ nullable: true })
  duration: number;

  @Column({ nullable: true })
  director: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  boxOffice: number;

  @Column({ default: 0 })
  views: number;

  @Column({ default: 0 })
  likes: number;

  @Column({ nullable: true })
  sourceUrl: string;

  @Column({ default: false })
  isImagesDownloaded: boolean;

  @OneToMany(() => Translation, translation => translation.media)
  translations: Translation[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 

