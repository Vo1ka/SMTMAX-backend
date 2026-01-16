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

  // CORS - разрешаем Vercel домены
  const nodeEnv = configService.get<string>('app.nodeEnv') || 'development';
  const corsOrigin = process.env.CORS_ORIGIN?.split(',') || [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:3001',
  ];

  if (nodeEnv === 'production') {
    // В production разрешаем только указанные домены
    app.enableCors({
      origin: (origin, callback) => {
        // Разрешаем запросы без origin (например, мобильные приложения)
        if (!origin) return callback(null, true);
        
        // Проверяем точное совпадение или паттерн Vercel
        const isAllowed = corsOrigin.some(allowed => {
          if (allowed === origin) return true;
          // Разрешаем все preview деплои Vercel (*.vercel.app)
          if (origin.endsWith('.vercel.app')) return true;
          return false;
        });

        if (isAllowed) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    });
  } else {
    // В development разрешаем все
    app.enableCors({
      origin: true,
      credentials: true,
    });
  }

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
  await app.listen(port, '0.0.0.0'); // Важно: слушаем на 0.0.0.0 для Render

  console.log(`
    🚀 Application is running on: http://localhost:${port}/${apiPrefix}
    📚 Swagger documentation: http://localhost:${port}/api-docs
    🌍 Environment: ${nodeEnv}
  `);
}

bootstrap();

