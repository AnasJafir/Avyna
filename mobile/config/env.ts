import { z } from 'zod';

const envSchema = z
  .object({
    baseUrl: z.string(),
  })
  .readonly();

export const env = envSchema.parse({
  baseUrl: process.env.EXPO_PUBLIC_BASE_URL,
});
