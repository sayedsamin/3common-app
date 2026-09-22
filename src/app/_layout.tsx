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
import { useSession } from '@/providers/SessionProvider';
import { ErrorState, LoadingState, Screen } from '@/components/ui';

initializeSentry();
void SplashScreen.preventAutoHideAsync().catch(() => undefined);

function RootNavigator() {
  const isReduced = useReducedMotion();
  const { status, retryRestore } = useSession();
  if (status === 'loading') return <Screen><LoadingState label="Restoring your session..." /></Screen>;
  if (status === 'error') return <Screen><ErrorState message="Unable to read your saved API key. Please try again." onRetry={retryRestore} /></Screen>;
  return (
    <Stack screenOptions={{ headerShown: false, animation: isReduced ? 'none' : 'default' }}>
      <Stack.Protected guard={status === 'signedOut'}>
        <Stack.Screen name="(auth)/sign-in" />
      </Stack.Protected>
      <Stack.Protected guard={status === 'signedIn'}>
        <Stack.Screen name="(app)" />
        <Stack.Screen name="events/[eventId]" options={{ headerShown: true, header: () => <AppHeader title="Event details" back backHref="/events/my-events" /> }} />
        {(['settings', 'help', 'about'] as const).map(name => (
          <Stack.Screen key={name} name={name} options={{ headerShown: true, header: () => <AppHeader title={name.charAt(0).toUpperCase() + name.slice(1)} back /> }} />
        ))}
      </Stack.Protected>
    </Stack>
  );
}

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
        <RootNavigator />
      </AppProviders>
    </TypographyProvider>
  );
}

export { ErrorBoundary } from 'expo-router';
export default withSentry(RootLayout);
