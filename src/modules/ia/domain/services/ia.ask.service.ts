import { GoogleGenAI, GenerateContentResponse } from '@google/genai';
import { Injectable } from '@nestjs/common';
import { RESPONSE_SCHEMA, SYSTEM_INSTRUCTION_ANSWER } from '../../utils';

@Injectable()
export class AIAskService {
  private ai: GoogleGenAI;
  private MODEL = process.env.GOOGLE_GENAI_MODEL ?? 'gemini-2.5-flash';

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  async ask(question: string): Promise<string> {
    const response: GenerateContentResponse =
      await this.ai.models.generateContent({
        model: this.MODEL,
        contents: SYSTEM_INSTRUCTION_ANSWER(question),
        config: {
          responseMimeType: 'application/json',
          responseSchema: RESPONSE_SCHEMA,
        },
      });

    const text = response.text;
    if (!text) {
      throw new Error('Failed to communicate with Gemini API.');
    }

    return JSON.parse(text);
  }
}
