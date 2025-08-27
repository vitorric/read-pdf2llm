import {
  Body,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { ValidateSchema } from '@shared/base-classes/zod';
import { ChatCreateUseCase } from '@chat/domain/usecases/chat.create.usecase';
import { ChatCreatePayloadSchema } from './dto/chat.create.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { multerUploadConfig } from '@shared/file/multer.config';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatCreate: ChatCreateUseCase) {}

  @Post('/message')
  @UseInterceptors(FileInterceptor('file', multerUploadConfig()))
  async create(@UploadedFile() file: Express.Multer.File, @Body() body: any) {
    const validationReq = ValidateSchema<any, any>(ChatCreatePayloadSchema, {
      ...body,
    });

    return this.chatCreate.execute({ ...validationReq, file });
  }
}
