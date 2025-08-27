import { Injectable } from '@nestjs/common';
import { PdfReader } from './pdf2llm.reader';
import type { PageEvent, ProgressEvent } from './types';

type PageEventProcess = {
  filePath: string;
  callback: (val: string) => void;
};

@Injectable()
export class Pdf2LlmService {
  // Retorna a instância para quem quiser assinar eventos
  createReader(filePath: string): PdfReader {
    return new PdfReader(filePath);
  }

  // Ou um método que “agrega” e resolve no final:
  async readToEnd(data: PageEventProcess): Promise<void> {
    return new Promise((resolve, reject) => {
      const reader = new PdfReader(data.filePath);

      reader.on('page', (p: PageEvent) => {
        // TODO: persistir/processar
        console.log('persistir/processar', p);
        data.callback(p.text);
      });

      reader.on('progress', (p: ProgressEvent) => {
        // TODO: log/metricas
        console.log('log/metricas', p);
      });

      reader.once('end', resolve);
      reader.once('error', reject);
    });
  }
}
