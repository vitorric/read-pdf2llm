import { Module, Global } from '@nestjs/common';

import { ConfigModule } from '@nestjs/config';
import configuration from '../config/configuration';
import { LoggerModule } from '@infra/logger/logger.module';
import { AuthModule } from '@infra/auth/auth.module';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    LoggerModule,
    AuthModule,
  ],
  exports: [ConfigModule, LoggerModule, AuthModule],
})
export class CommonModule {}
