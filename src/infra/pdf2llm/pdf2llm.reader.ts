import { EventEmitter } from 'node:events';
import { startReading } from './pdf2llm.native';
import type { PageEvent, ProgressEvent } from './types';

// Sobrecargas para ter IntelliSense forte nos eventos:
export declare interface PdfReader {
  on(event: 'page', listener: (payload: PageEvent) => void): this;
  on(event: 'progress', listener: (payload: ProgressEvent) => void): this;
  on(event: 'end', listener: () => void): this;
  on(event: 'error', listener: (err: unknown) => void): this;

  once(event: 'page', listener: (payload: PageEvent) => void): this;
  once(event: 'progress', listener: (payload: ProgressEvent) => void): this;
  once(event: 'end', listener: () => void): this;
  once(event: 'error', listener: (err: unknown) => void): this;
}

export class PdfReader extends EventEmitter {
  constructor(filePath: string) {
    super();
    try {
      // o addon chamará `emit(eventName, payload)` a partir do C++/N-API
      startReading(this.emit.bind(this), filePath);
    } catch (err) {
      // joga para o próximo tick para não quebrar o construtor
      queueMicrotask(() => this.emit('error', err));
    }
  }
}

// helper igual ao seu JS, mas tipado:
export function readPDF2LLM(name: string, filePath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const reader = new PdfReader(filePath);

    reader.on('page', ({ page, text }) => {
      console.log(`[${name}] Página ${page}: ${text.length}`);
    });

    reader.on('progress', ({ current, total, percent }) => {
      console.log(
        `[${name}] Progresso: ${current}/${total} (${percent.toFixed(1)}%)`,
      );
    });

    reader.on('end', () => {
      console.log(`✅ ${name} concluída`);
      resolve();
    });

    reader.on('error', (err) => {
      console.error(`❌ ${name} erro:`, err);
      reject(err);
    });
  });
}
