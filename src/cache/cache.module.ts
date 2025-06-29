import { Module, Global } from '@nestjs/common';
import { CacheModule as NestCacheModule } from '@nestjs/cache-manager';

@Global()
@Module({
  imports: [
    NestCacheModule.register({
      ttl: 60 * 60, // 1 hour
      max: 100, // maximum number of items in cache
    }),
  ],
  exports: [NestCacheModule],
})
export class CacheModule {}
