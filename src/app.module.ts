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
import { APP_INTERCEPTOR } from '@nestjs/core';
import { LoggingInterceptor } from './common/logging/logging.interceptor';
import { MonitorModule } from './monitor/module';
import { Monitor } from './monitor/entities';
import { RedisModule } from './redis/module';
import { SyncModule } from './sync/module';
import { WebSocketModule } from './common/websocket/websocket.module';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: process.env.NODE_ENV === 'development' ? '.env.development' : '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        
        return {
          type: 'mysql',
          host: configService.get('DB_HOST'),
          port: configService.get('DB_PORT'),
          username: configService.get('DB_USERNAME'),
          password: configService.get('DB_PASSWORD'),
          database: configService.get('DB_DATABASE'),
          entities: [Media, Translation, TrackerEvent, Monitor],
          synchronize: false,
        };
      },
      inject: [ConfigService],
    }),
    MediaModule,
    TranslationModule,
    CacheModule,
    CrawlerModule,
    TrackerModule,
    MonitorModule,
    RedisModule,
    SyncModule,
    WebSocketModule,
  ],
  controllers: [AppController],
  providers: [AppService,
  {
    provide: APP_INTERCEPTOR,
    useClass: LoggingInterceptor,
  }
],
})
export class AppModule {}
