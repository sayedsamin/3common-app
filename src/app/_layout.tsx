import '@/global.css';

import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

import { initializeSentry, withSentry } from '@/lib/sentry';
import { AppProviders } from '@/providers/AppProviders';
import { TypographyProvider } from '@/providers/TypographyProvider';
import { useAppFonts } from '@/hooks/useAppFonts';
import { ThemeStatusBar } from '@/components/ui/ThemeStatusBar';

initializeSentry();
void SplashScreen.preventAutoHideAsync().catch(() => undefined);

function RootLayout() {
  const [fontsLoaded, fontError] = useAppFonts();
  const isReady = fontsLoaded || Boolean(fontError);
  useEffect(() => {
    if (isReady) void SplashScreen.hideAsync().catch(() => undefined);
  }, [isReady]);
  if (!isReady) return null;

  return (
    <TypographyProvider value={fontsLoaded}>
      <AppProviders>
        <ThemeStatusBar />
        <Stack screenOptions={{ headerShown: false }} />
      </AppProviders>
    </TypographyProvider>
  );
}

export { ErrorBoundary } from 'expo-router';
export default withSentry(RootLayout);
