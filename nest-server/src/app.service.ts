import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    Logger.log('欢迎使用NestJS服务！数据库连接正常。');
    return '欢迎使用NestJS服务！数据库连接正常。';
  }
}
