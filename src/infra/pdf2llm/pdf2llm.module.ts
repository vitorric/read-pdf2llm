import { Module } from '@nestjs/common';
import { Pdf2LlmService } from './pdf2llm.service';

@Module({
  providers: [Pdf2LlmService],
  exports: [Pdf2LlmService],
})
export class Pdf2LlmModule {}
