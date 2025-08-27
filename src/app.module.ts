import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { CommonModule } from '@infra/commom/commom.module';
import { ChatModule } from '@chat/chat.module';

@Module({
  imports: [CommonModule, ChatModule],
  controllers: [AppController],
})
export class AppModule {}
