import * as Sentry from '@sentry/react-native';

import { env } from './env';

let isInitialized = false;

export function initializeSentry() {
  if (isInitialized || !env.sentryDsn) return;
  Sentry.init({
    dsn: env.sentryDsn,
    sendDefaultPii: false,
    // Enable tracing and additional context after reviewing the app's data policy.
    tracesSampleRate: 0,
  });
  isInitialized = true;
}

export const withSentry = Sentry.wrap;
