import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Global prefix
  const apiPrefix = configService.get<string>('app.apiPrefix') || 'api/v1';
  app.setGlobalPrefix(apiPrefix);

  // CORS - поддержка нескольких источников
  const corsOrigin = configService.get<string>('app.corsOrigin') || 'http://localhost:3001';
  
  // Разрешаем несколько портов для разработки
  const allowedOrigins = [
    corsOrigin,
    'http://localhost:5173',  // Vite default port
    'http://localhost:3000',  // React default port
    'http://localhost:3001',  // Alternative React port
  ];

  app.enableCors({
    origin: (origin, callback) => {
      // Разрешаем запросы без origin (например, Postman, curl)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('SMTMAX Production API')
    .setDescription('API для управления производством и сервисными работами')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  // Start server
  const port = configService.get<number>('app.port') || 3000;
  await app.listen(port);

  console.log(`
    🚀 Application is running on: http://localhost:${port}/${apiPrefix}
    📚 Swagger documentation: http://localhost:${port}/api-docs
    🌐 CORS enabled for: ${allowedOrigins.join(', ')}
  `);
}

bootstrap();
