import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { getUploadRootDir } from './uploads/uploads.config';

function parseCorsOrigins(): string | string[] {
  const raw = process.env.CORS_ORIGIN ?? 'http://localhost:3000';
  const origins = raw.split(',').map((o) => o.trim()).filter(Boolean);
  return origins.length === 1 ? origins[0] : origins;
}

function validateProductionConfig() {
  if (process.env.NODE_ENV !== 'production') return;

  const secret = process.env.JWT_SECRET ?? '';
  if (secret.length < 32) {
    throw new Error(
      'JWT_SECRET debe tener al menos 32 caracteres en producción',
    );
  }

  if (secret.includes('dev-secret') || secret.includes('cambiar')) {
    throw new Error(
      'JWT_SECRET no puede ser el valor de desarrollo en producción',
    );
  }
}

async function bootstrap() {
  validateProductionConfig();

  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const logger = new Logger('Bootstrap');

  const trustProxy = process.env.TRUST_PROXY;
  if (trustProxy === 'true' || trustProxy === '1') {
    app.set('trust proxy', 1);
  }

  const uploadDir = process.env.UPLOAD_DIR ?? getUploadRootDir();
  app.useStaticAssets(uploadDir, {
    prefix: '/api/v1/uploads/files/',
  });

  app.setGlobalPrefix('api/v1');

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );

  app.enableCors({
    origin: parseCorsOrigins(),
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = process.env.API_PORT ?? 3001;
  await app.listen(port);
  logger.log(`API en http://localhost:${port}/api/v1`);
  logger.log(`TZ restaurante: ${process.env.RESTAURANT_TIMEZONE ?? 'America/La_Paz'}`);
}
bootstrap();
