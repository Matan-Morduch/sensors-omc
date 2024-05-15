import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const env = process.env.NODE_ENV || 'dev';
  
  if (env != 'dev') {
    Logger.overrideLogger(['error', 'warn']);
  } else {
    Logger.overrideLogger(['log', 'error', 'warn', 'debug', 'verbose']);
  }
  
  await app.listen(3001);
}
bootstrap();
