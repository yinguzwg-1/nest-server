import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { RedisService } from '../service';
import { createClient } from 'redis';

@Module({
  imports: [
    BullModule.forRoot({
      redis: {
        host: '172.22.166.117',
        port: 6379,
      },
    }),
    BullModule.registerQueue({
      name: 'redis',
      defaultJobOptions: {
        // 完成的任务立即删除
        removeOnComplete: true,
        // 失败的任务立即删除
        removeOnFail: true,
        // 重试次数
        attempts: 3,
        // 重试延迟
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      },
    }),
    BullModule.registerQueue({
      name: 'file-merge-queue', // 建议使用有意义的队列名
      defaultJobOptions: {
        // 完成的任务立即删除
        removeOnComplete: true,
        // 失败的任务立即删除
        removeOnFail: true,
        // 重试次数
        attempts: 3,
        // 重试延迟
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      },
    })
  ],
  providers: [
    RedisService,
    // Redis客户端提供者
    {
      provide: 'REDIS_CLIENT',
      useFactory: async () => {
        const client = createClient({ url: 'redis://172.22.166.117:6379' });
        await client.connect();
        return client;
      }
    }
  ],
  exports: [BullModule, RedisService, 'REDIS_CLIENT'],
})
export class RedisModule {}
