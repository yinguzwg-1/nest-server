import { Media } from '../../media/entities';
export declare enum TranslationField {
    TITLE = "title",
    DESCRIPTION = "description"
}
export declare class Translation {
    id: number;
    media: Media;
    mediaId: number;
    field: TranslationField;
    language: string;
    value: string;
    createdAt: Date;
    updatedAt: Date;
}
