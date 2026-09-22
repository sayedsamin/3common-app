import '@/global.css';

import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { initializeSentry, withSentry } from '@/lib/sentry';
import { AppProviders } from '@/providers/AppProviders';

initializeSentry();

function RootLayout() {
  return (
    <AppProviders>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }} />
    </AppProviders>
  );
}

export { ErrorBoundary } from 'expo-router';
export default withSentry(RootLayout);
