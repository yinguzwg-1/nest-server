import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { RedisService } from '../service';
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
  ],
  providers: [RedisService],
  exports: [BullModule, RedisService],
})
export class RedisModule {}
