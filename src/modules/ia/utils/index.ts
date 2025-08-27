import { Type } from '@google/genai';

export const SYSTEM_INSTRUCTION_ANSWER = (text: any) => `
Você é um assistente financeiro que identifica dados de boletos bancários.
Extraia APENAS os campos solicitados a partir do Contexto. Não invente valores.
Se não encontrar um campo, deixe vazio ou null.
Contexto:
${text}
`;

export const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    type: Type.OBJECT,
    properties: {
      nomePagador: { type: Type.STRING },
      nomeRecebedor: { type: Type.STRING },
      valor: { type: Type.NUMBER },
      dataVencimento: { type: Type.STRING },
      linhaDigitavel: { type: Type.STRING },
    },
    required: [
      'nomePagador',
      'nomeRecebedor',
      'valor',
      'dataVencimento',
      'linhaDigitavel',
    ],
    // opcional: controla a ordem das chaves no output
    propertyOrdering: [
      'nomePagador',
      'nomeRecebedor',
      'valor',
      'dataVencimento',
      'linhaDigitavel',
    ],
  },
  required: ['answer'],
  propertyOrdering: ['answer'],
} as const;
