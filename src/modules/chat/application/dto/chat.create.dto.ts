import z from 'zod';

export const ChatCreatePayloadSchema = z.object({
  message: z.string().optional(),
});

export type ChatCreatePayload = z.infer<typeof ChatCreatePayloadSchema>;
