import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // 允许跨域（Wujie 微前端沙箱的 origin 可能不同，必须放行）
  app.enableCors({
    origin: true,                   // 允许任意 origin
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    credentials: true,
  });
  
  // 全局校验管道
  app.useGlobalPipes(new ValidationPipe());

  // 设置全局前缀
  app.setGlobalPrefix('api');

  await app.listen(3001, '0.0.0.0');
  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
