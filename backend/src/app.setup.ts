import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AllExceptionsFilter } from './common/all-exceptions.filter';
import { loadConfig } from './config/config';

export function configureApp(app: NestExpressApplication) {
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  );
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useStaticAssets(loadConfig().uploadDir, {
    prefix: '/media',
    index: false,
    fallthrough: false,
  });
  app.enableShutdownHooks();
}
