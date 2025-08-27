import { LoggerModule as LoggerPinoModule } from 'nestjs-pino';

import { Module } from '@nestjs/common';
import { Logger } from './logger.service';

@Module({
  imports: [
    LoggerPinoModule.forRoot({
      pinoHttp: {
        redact: ['req.headers', 'req.body'],
        autoLogging: false,
      },
    }),
  ],
  providers: [Logger],
  exports: [Logger],
})
export class LoggerModule {}
