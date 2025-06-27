import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { Media } from './media/entities';
import { Translation } from './translation/entities';
import { MediaModule } from './media/module';
import { TranslationModule } from './translation/module';
import { CacheModule } from './cache/cache.module';
import { CrawlerModule } from './crawler/module';
import { TrackerModule } from './tracker/module';
import { TrackerEvent } from './tracker/entities';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get('DB_HOST'),
        port: configService.get('DB_PORT'),
        username: configService.get('DB_USERNAME'),
        password: configService.get('DB_PASSWORD'),
        database: configService.get('DB_DATABASE'),
        entities: [Media, Translation, TrackerEvent],
        synchronize: false,
      }),
      inject: [ConfigService],
    }),
    MediaModule,
    TranslationModule,
    CacheModule,
    CrawlerModule,
    TrackerModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
