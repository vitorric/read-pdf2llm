import { Controller, Get } from '@nestjs/common';

@Controller('ai')
export class AIController {
  @Get('ready')
  async ready() {
    const res = await fetch(`${process.env.OLLAMA_BASE_URL}/api/tags`);
    return { ok: res.ok };
  }
}
