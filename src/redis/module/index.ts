import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { RedisService } from '../service';
import { createClient } from 'redis';

@Module({
  imports: [
    BullModule.forRoot({
      redis: {
        host: 'localhost',
        port: 6379,
      },
    }),
    BullModule.registerQueue({
      name: 'redis',
    }),
    BullModule.registerQueue({
      name: 'file-merge-queue' // 建议使用有意义的队列名
    })
  ],
  providers: [
    RedisService,
    // Redis客户端提供者
    {
      provide: 'REDIS_CLIENT',
      useFactory: async () => {
        const client = createClient({ url: 'redis://localhost:6379' });
        await client.connect();
        return client;
      }
    }
  ],
  exports: [BullModule, RedisService, 'REDIS_CLIENT'],
})
export class RedisModule {}
