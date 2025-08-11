
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as fs from 'fs';
import * as path from 'path';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  // HTTPS配置 - 可选，如果证书文件不存在则使用HTTP
  let httpsOptions = undefined;
  try {
    const keyPath = path.join(__dirname, '../ssl/private.key');
    const certPath = path.join(__dirname, '../ssl/certificate.crt');
    
    if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
      httpsOptions = {
        key: fs.readFileSync(keyPath),
        cert: fs.readFileSync(certPath),
      };
      logger.log('HTTPS证书加载成功');
    } else {
      logger.warn('HTTPS证书文件不存在，将使用HTTP模式');
    }
  } catch (error) {
    logger.warn('HTTPS证书加载失败，将使用HTTP模式:', error.message);
  }

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
    ...(httpsOptions && { httpsOptions }), // 只有在有证书时才启用HTTPS
    cors: {
      origin: ['http://223.4.248.176:8080', 'https://223.4.248.176:8080', 'http://localhost:8080', 'http://localhost:3000', 'https://zwg.autos', 'http://zwg.autos'], // 允许特定来源
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
      credentials: true,
    },
  });

  // 设置全局前缀
  app.setGlobalPrefix('api');

  // 配置静态文件服务（与保存路径一致，使用进程工作目录）
  app.useStaticAssets(path.join(process.cwd(), '..', 'music_files'), {
    prefix: '/music_files',
  });
  app.useStaticAssets(path.join(process.cwd(), '..', 'cover_files'), {
    prefix: '/cover_files',
  });

  // 启用全局验证管道 
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  // 配置 Swagger
  const config = new DocumentBuilder()
    .setTitle('Media API')
    .setDescription('The Media API description')
    .setVersion('1.0')
    .addServer('http://localhost:3001/api', 'Local Development')
    .addServer('https://zwg.autos/api', 'Production')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  // 启动服务器
  const port = process.env.PORT || 3001;
  await app.listen(port);

  const protocol = httpsOptions ? 'HTTPS' : 'HTTP';
  logger.log(`应用程序已启动，使用${protocol}协议，监听端口: ${port}`);
  logger.log(`API 文档地址: ${protocol.toLowerCase()}://localhost:${port}/api`);
}
bootstrap();
