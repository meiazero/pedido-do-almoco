// @ts-check

import { z } from 'zod';

const envSchema = z.object({
  GOOGLE_EMAIL: z.string(),
  GOOGLE_PASSWORD: z.string(),
});

export const env = envSchema.safeParse(process.env);

if (!env.success) {
  console.error(env.data);
  process.exit(1);
}
