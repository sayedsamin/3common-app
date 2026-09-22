import { z } from 'zod';

const optionalUrl = z.preprocess(
  (value) => value === '' ? undefined : value,
  z.url().optional(),
);

const envSchema = z.object({ apiUrl: optionalUrl, sentryDsn: optionalUrl });

// Static dot notation lets Expo inline public values. Never add secrets here.
export const env = envSchema.parse({
  apiUrl: process.env.EXPO_PUBLIC_API_URL,
  sentryDsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
});
