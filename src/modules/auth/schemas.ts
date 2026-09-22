import { z } from 'zod';

export const apiKeySchema = z.string().trim().min(1, 'Enter your API key.')
  .regex(/^[\x21-\x7E]+$/, 'Enter the API key without spaces or line breaks.')
  .refine(value => !/^Bearer$/i.test(value), 'Enter the key only, without Bearer.');
export const signInSchema = z.object({ apiKey: apiKeySchema });
export type SignInValues = z.infer<typeof signInSchema>;
