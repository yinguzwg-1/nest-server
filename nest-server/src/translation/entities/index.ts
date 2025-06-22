import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Media } from '../../media/entities';

export enum TranslationField {
  TITLE = 'title',
  DESCRIPTION = 'description'
}

@Entity('translations')
export class Translation {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Media, media => media.translations, { onDelete: 'CASCADE' })
  media: Media;

  @Column()
  mediaId: number;

  @Column({
    type: 'enum',
    enum: TranslationField
  })
  field: TranslationField;

  @Column({ length: 2 })
  language: string;

  @Column('text')
  value: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 