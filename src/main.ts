import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './infra/filters/exception.filter';
import { Logger } from '@infra/logger/logger.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  app.useGlobalFilters(new AllExceptionsFilter(app.get(Logger)));
  app.useLogger(app.get(Logger));

  const port = app.get(ConfigService).get('port');

  await app.listen(port);
}

bootstrap();
