import { Public } from '@infra/decorators/public.decorator';
import { Logger } from '@infra/logger/logger.service';
import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Controller()
export class AppController {
  constructor(
    private readonly logger: Logger,
    private readonly configService: ConfigService,
  ) {}

  @Get('/health')
  @Public()
  health(): string {
    this.logger.log(`/GET(health): ${Date.now()}`);
    return `Server is up and running on ${this.configService.get('port')}`;
  }
}
