import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Translation, TranslationField } from '../entities';

@Injectable()
export class TranslationService {
  constructor(
    @InjectRepository(Translation)
    private readonly translationRepository: Repository<Translation>,
  ) {}

  async getTranslation(mediaId: number, field: TranslationField, language: string): Promise<string | null> {
    const translation = await this.translationRepository.findOne({
      where: { mediaId, field, language }
    });
    return translation?.value || null;
  }

  async setTranslation(mediaId: number, field: TranslationField, language: string, value: string): Promise<Translation> {
    let translation = await this.translationRepository.findOne({
      where: { mediaId, field, language }
    });

    if (translation) {
      translation.value = value;
      return await this.translationRepository.save(translation);
    } else {
      translation = this.translationRepository.create({
        mediaId,
        field,
        language,
        value
      });
      return await this.translationRepository.save(translation);
    }
  }

  async getTranslations(mediaId: number, field: TranslationField): Promise<Record<string, string>> {
    const translations = await this.translationRepository.find({
      where: { mediaId, field },
    });

    return translations.reduce((acc, translation) => {
      acc[translation.language] = translation.value;
      return acc;
    }, {} as Record<string, string>);
  }

  async setTranslations(
    mediaId: number,
    field: TranslationField,
    translations: Record<string, string>,
  ): Promise<void> {
    // 删除现有的翻译
    await this.translationRepository.delete({ mediaId, field });

    // 创建新的翻译
    const translationEntities = Object.entries(translations).map(([language, value]) => ({
      mediaId,
      field,
      language,
      value,
    }));

    await this.translationRepository.save(translationEntities);
  }

  async deleteTranslations(mediaId: number): Promise<void> {
    await this.translationRepository.delete({ mediaId });
  }
} 