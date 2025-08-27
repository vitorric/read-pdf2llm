import { Module } from '@nestjs/common';
import { ChatController } from './application/chat.controller';
import { ChatCreateUseCase } from './domain/usecases/chat.create.usecase';
import { Pdf2LlmModule } from '@infra/pdf2llm/pdf2llm.module';
import { AIModule } from '../ia/ai.module';

@Module({
  imports: [Pdf2LlmModule, AIModule],
  providers: [ChatCreateUseCase],
  controllers: [ChatController],
  exports: [ChatCreateUseCase],
})
export class ChatModule {}
