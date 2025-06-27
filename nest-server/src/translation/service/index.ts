import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Translation, TranslationField } from '../entities';
import { Media } from '../../media/entities';

@Injectable()
export class TranslationService {
  private readonly logger = new Logger(TranslationService.name);

  constructor(
    @InjectRepository(Translation)
    private readonly translationRepository: Repository<Translation>,
    private readonly dataSource: DataSource,
  ) {}

  async getTranslation(
    mediaId: number,
    field: TranslationField,
    language: string,
  ): Promise<string | null> {
    const translation = await this.translationRepository.findOne({
      where: { mediaId, field, language },
    });
    return translation?.value || null;
  }

  async setTranslation(
    mediaId: number,
    field: TranslationField,
    language: string,
    value: string,
  ): Promise<Translation> {
    let translation = await this.translationRepository.findOne({
      where: { mediaId, field, language },
    });

    if (translation) {
      translation.value = value;
      return await this.translationRepository.save(translation);
    } else {
      translation = this.translationRepository.create({
        mediaId,
        field,
        language,
        value,
      });
      return await this.translationRepository.save(translation);
    }
  }

  async getTranslations(
    mediaId: number,
    field: TranslationField,
  ): Promise<Record<string, string>> {
    const translations = await this.translationRepository.find({
      where: { mediaId, field },
    });

    return translations.reduce(
      (acc, translation) => {
        acc[translation.language] = translation.value;
        return acc;
      },
      {} as Record<string, string>,
    );
  }

  async setTranslations(
    mediaId: number,
    field: TranslationField,
    translations: Record<string, string>,
  ): Promise<void> {
    try {
      // 删除现有的翻译
      await this.translationRepository.delete({ mediaId, field });

      // 创建新的翻译
      const translationEntities = Object.entries(translations).map(
        ([language, value]) => ({
          mediaId,
          field,
          language,
          value,
        }),
      );

      await this.translationRepository.save(translationEntities);
      this.logger.log(
        `Successfully set translations for media ${mediaId}, field ${field}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to set translations for media ${mediaId}, field ${field}: ${error.message}`,
      );
      throw error;
    }
  }

  async createTranslationsForNewMedia(
    media: Media,
    translations: {
      title?: Record<string, string>;
      description?: Record<string, string>;
    },
  ): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 保存标题翻译
      if (translations.title) {
        const titleTranslations = Object.entries(translations.title).map(
          ([language, value]) =>
            this.translationRepository.create({
              mediaId: media.id,
              field: TranslationField.TITLE,
              language,
              value,
            }),
        );
        await queryRunner.manager.save(Translation, titleTranslations);
      }

      // 保存描述翻译
      // if (translations.description) {
      //   const descriptionTranslations = Object.entries(translations.description).map(([language, value]) =>
      //     this.translationRepository.create({
      //       mediaId: media.id,
      //       field: TranslationField.DESCRIPTION,
      //       language,
      //       value,
      //     })
      //   );
      //   await queryRunner.manager.save(Translation, descriptionTranslations);
      // }

      await queryRunner.commitTransaction();
      this.logger.log(
        `Successfully created translations for new media ${media.id}`,
      );
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(
        `Failed to create translations for new media ${media.id}: ${error.message}`,
      );
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async deleteTranslations(mediaId: number): Promise<void> {
    await this.translationRepository.delete({ mediaId });
  }
}
