import { Repository } from 'typeorm';
import { Translation, TranslationField } from '../entities';
export declare class TranslationService {
    private readonly translationRepository;
    constructor(translationRepository: Repository<Translation>);
    getTranslation(mediaId: number, field: TranslationField, language: string): Promise<string | null>;
    setTranslation(mediaId: number, field: TranslationField, language: string, value: string): Promise<Translation>;
    getTranslations(mediaId: number, field: TranslationField): Promise<Record<string, string>>;
    setTranslations(mediaId: number, field: TranslationField, translations: Record<string, string>): Promise<void>;
    deleteTranslations(mediaId: number): Promise<void>;
}
