import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Translation } from '../entities';
import { TranslationService } from '../service';
import { AITranslationService } from '../service/ai-translation.service';

@Module({
  imports: [TypeOrmModule.forFeature([Translation])],
  providers: [TranslationService, AITranslationService],
  exports: [TranslationService, AITranslationService],
})
export class TranslationModule {}
