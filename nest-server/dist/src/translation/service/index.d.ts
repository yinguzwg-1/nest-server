import { Repository, DataSource } from 'typeorm';
import { Translation, TranslationField } from '../entities';
import { Media } from '../../media/entities';
export declare class TranslationService {
    private readonly translationRepository;
    private readonly dataSource;
    private readonly logger;
    constructor(translationRepository: Repository<Translation>, dataSource: DataSource);
    getTranslation(mediaId: number, field: TranslationField, language: string): Promise<string | null>;
    setTranslation(mediaId: number, field: TranslationField, language: string, value: string): Promise<Translation>;
    getTranslations(mediaId: number, field: TranslationField): Promise<Record<string, string>>;
    setTranslations(mediaId: number, field: TranslationField, translations: Record<string, string>): Promise<void>;
    createTranslationsForNewMedia(media: Media, translations: {
        title?: Record<string, string>;
        description?: Record<string, string>;
    }): Promise<void>;
    deleteTranslations(mediaId: number): Promise<void>;
}
