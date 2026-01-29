import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import 'dotenv/config';
import 'reflect-metadata';
import { AppModule } from './app.module';
import { elasticService } from './services/elastic.service';
async function bootstrap() {
  const logger = new Logger('Bootstrap');

  const app = await NestFactory.create(AppModule, {
    logger: ['log', 'error', 'warn', 'debug', 'verbose'],
  });

  // Habilitar validação global com class-validator
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Remove propriedades não declaradas no DTO
      forbidNonWhitelisted: true, // Lança erro se propriedades não declaradas forem enviadas
      transform: true, // Transforma payloads em instâncias de DTOs
      transformOptions: {
        enableImplicitConversion: true, // Converte tipos automaticamente
      },
    }),
  );

  // Habilitar CORS
  app.enableCors();

  // Inicia fila SQS
  try {
    await elasticService.createQueueIfNotExists();
  } catch (e) {
    console.log(e);
    throw e;
  }

  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  logger.log(`🚀 Aplicação rodando em http://localhost:${port}`);
  logger.log(`📚 Ambiente: ${process.env.NODE_ENV || 'development'}`);
}

void bootstrap();
