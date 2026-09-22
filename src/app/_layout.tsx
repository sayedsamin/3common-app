import '@/global.css';

import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

import { initializeSentry, withSentry } from '@/lib/sentry';
import { AppProviders } from '@/providers/AppProviders';
import { TypographyProvider } from '@/providers/TypographyProvider';
import { useAppFonts } from '@/hooks/useAppFonts';
import { ThemeStatusBar } from '@/components/ui/ThemeStatusBar';
import { AppHeader } from '@/components/navigation/AppHeader';
import { useReducedMotion } from '@/hooks/useReducedMotion';

initializeSentry();
void SplashScreen.preventAutoHideAsync().catch(() => undefined);

function RootLayout() {
  const isReduced = useReducedMotion();
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
        <Stack screenOptions={{ headerShown: false, animation: isReduced ? 'none' : 'default' }}>
          <Stack.Screen name="(app)" />
          {(['settings', 'help', 'about'] as const).map(name => (
            <Stack.Screen key={name} name={name} options={{ headerShown: true, header: () => <AppHeader title={name.charAt(0).toUpperCase() + name.slice(1)} back /> }} />
          ))}
        </Stack>
      </AppProviders>
    </TypographyProvider>
  );
}

export { ErrorBoundary } from 'expo-router';
export default withSentry(RootLayout);
