import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return '欢迎使用NestJS服务！数据库连接正常。';
  }
} 