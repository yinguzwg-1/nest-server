import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('music_metadata')
@Index(['title', 'artist', 'album'])
export class MusicMetadata {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255, nullable: false })
  title: string;

  @Column({ type: 'varchar', length: 255, nullable: false })
  artist: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  album: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  genre: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  duration: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  release_date: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  language: string;

  @Column({ type: 'json', nullable: true })
  tags: string[];

  @Column({ type: 'varchar', length: 100, nullable: true })
  mood: string;

  @Column({ type: 'json', nullable: true })
  lyrics: Array<{ time: number; text: string }>;

  @Column({ type: 'varchar', length: 512, nullable: true })
  cover: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
} 