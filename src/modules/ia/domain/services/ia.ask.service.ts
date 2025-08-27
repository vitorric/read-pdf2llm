// src/core/ai/ai.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ChatOllama } from '@langchain/ollama';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';

@Injectable()
export class AIAskService {
  private readonly logger = new Logger(AIAskService.name);
  private readonly baseUrl =
    process.env.OLLAMA_BASE_URL ?? 'http://ollama:11434';
  private readonly modelName = process.env.NLP_MODEL ?? 'gemma3:4b';

  private readonly model = new ChatOllama({
    baseUrl: this.baseUrl,
    model: this.modelName,
    temperature: 0,
    maxRetries: 2,
    // ↓ estes campos são suportados pelo cliente do Ollama/LC e reduzem latência
    numPredict: 180, // limite de saída (~180 tokens)
    numCtx: 2048, // contexto suficiente
    // força JSON (reduz verbosidade)
    format: 'json',
  });

  /** Pergunta simples; retorna o texto da resposta. */
  async ask(question: string, system?: string): Promise<string> {
    try {
      console.log(question);
      const messages = system
        ? [new SystemMessage(system), new HumanMessage(question)]
        : [new HumanMessage(question)];

      const res = await this.model.invoke(messages);

      const content = Array.isArray(res.content)
        ? res.content.map((c: any) => c?.text ?? String(c ?? '')).join('')
        : String(res.content ?? '');

      console.log(res.content);
      return content.trim();
    } catch (err: any) {
      // log útil pra diagnosticar 404 (modelo não baixado) ou ECONNREFUSED
      this.logger.error(
        `Ollama call failed (baseUrl=${this.baseUrl}, model=${this.modelName}): ${err?.message}`,
        err?.stack,
      );
      throw err;
    }
  }

  /** Streaming token-a-token. */
  async askStream(
    question: string,
    onToken: (chunk: string) => void,
    system?: string,
  ): Promise<void> {
    const messages = system
      ? [new SystemMessage(system), new HumanMessage(question)]
      : [new HumanMessage(question)];

    const stream = await this.model.stream(messages);
    for await (const chunk of stream) {
      const text = Array.isArray(chunk.content)
        ? chunk.content.map((c: any) => c?.text ?? '').join('')
        : String(chunk.content ?? '');
      if (text) onToken(text);
    }
  }
}
