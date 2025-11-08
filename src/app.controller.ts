import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
// import { RedisService } from './redis/service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    // private readonly redisService: RedisService
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  getHealth(): { status: string; database: string } {
    return {
      status: 'OK',
      database: 'Connected to MySQL',
    };
  }

  // @Get('redis-status')
  // async getRedisStatus() {
  //   return await this.redisService.getDetailedQueueInfo();
  // }
}
