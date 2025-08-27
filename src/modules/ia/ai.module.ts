// src/core/ai/ai.module.ts
import { Module } from '@nestjs/common';
import { AIAskService } from './domain/services/ia.ask.service';
import { AIController } from './application/ai.controller';

@Module({
  providers: [AIAskService],
  controllers: [AIController],
  exports: [AIAskService],
})
export class AIModule {}
