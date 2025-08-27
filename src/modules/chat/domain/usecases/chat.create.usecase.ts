import { ChatCreatePayload } from '@chat/application/dto/chat.create.dto';
import { Pdf2LlmService } from '@infra/pdf2llm/pdf2llm.service';
import { Injectable } from '@nestjs/common';
import { IUseCase } from '@shared/interfaces/use-case';
import { AIAskService } from 'src/modules/ia/domain/services/ia.ask.service';

@Injectable()
export class ChatCreateUseCase
  implements IUseCase<ChatCreatePayload, Promise<any>>
{
  constructor(
    private readonly svc: Pdf2LlmService,
    private readonly aiAskService: AIAskService,
  ) {}

  async execute(
    data: ChatCreatePayload & {
      file: Express.Multer.File;
    },
  ): Promise<any> {
    const pages: string[] = [];

    await this.svc.readToEnd({
      filePath: data.file.path,
      callback: (val) => pages.push(val),
    });

    const joined = pages.join('\n\n').slice(0, 8000); // limite simples
    const answer = await this.aiAskService.ask(joined);
    return { answer };
  }
}
