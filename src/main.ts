import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // 允许跨域
  app.enableCors();
  
  // 全局校验管道
  app.useGlobalPipes(new ValidationPipe());

  // 设置全局前缀
  app.setGlobalPrefix('api');

  await app.listen(3001, '0.0.0.0');
  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
