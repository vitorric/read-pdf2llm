// src/core/ai/ai.module.ts
import { Module } from '@nestjs/common';
import { AIAskService } from './domain/services/ia.ask.service';

@Module({
  providers: [AIAskService],
  exports: [AIAskService],
})
export class AIModule {}
