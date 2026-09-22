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
        <Stack.Screen name="commerce/checkouts/[checkoutId]" options={{ headerShown: true, header: () => <AppHeader title="Checkout details" back backHref="/commerce/checkouts" /> }} />
        <Stack.Screen name="finance/orders/checkout/[productSetId]" options={{ headerShown: true, header: () => <AppHeader title="Checkout details" back backHref="/finance/orders" /> }} />
        <Stack.Screen name="commerce/invoices/new" options={{ headerShown: true, header: () => <AppHeader title="New invoice" back backHref="/commerce/invoices" /> }} />
        <Stack.Screen name="commerce/invoices/[invoiceId]" options={{ headerShown: true, header: () => <AppHeader title="Invoice details" back backHref="/commerce/invoices" /> }} />
        <Stack.Screen name="commerce/invoices/[invoiceId]/edit" options={{ headerShown: true, header: () => <AppHeader title="Edit invoice" back backHref="/commerce/invoices" /> }} />
        <Stack.Screen name="marketing/emails/new" options={{ headerShown: true, header: () => <AppHeader title="New email" back backHref="/marketing/emails" /> }} />
        <Stack.Screen name="marketing/emails/[emailId]" options={{ headerShown: true, header: () => <AppHeader title="Email details" back backHref="/marketing/emails" /> }} />
        <Stack.Screen name="marketing/emails/[emailId]/edit" options={{ headerShown: true, header: () => <AppHeader title="Edit email" back backHref="/marketing/emails" /> }} />
        <Stack.Screen name="marketing/emails/[emailId]/events" options={{ headerShown: true, header: () => <AppHeader title="Delivery events" back backHref="/marketing/emails" /> }} />
        <Stack.Screen name="marketing/emails/[emailId]/activity" options={{ headerShown: true, header: () => <AppHeader title="Email activity" back backHref="/marketing/emails" /> }} />
        <Stack.Screen name="events/[eventId]" options={{ headerShown: true, header: () => <AppHeader title="Event details" back backHref="/events/my-events" /> }} />
        <Stack.Screen name="events/[eventId]/edit" />
        <Stack.Screen name="crm/segments/new" options={{ headerShown: true, header: () => <AppHeader title="New segment" back backHref="/crm/segments" /> }} />
        <Stack.Screen name="crm/segments/[segmentId]" options={{ headerShown: true, header: () => <AppHeader title="Segment details" back backHref="/crm/segments" /> }} />
        <Stack.Screen name="crm/segments/[segmentId]/edit" options={{ headerShown: true, header: () => <AppHeader title="Edit segment" back backHref="/crm/segments" /> }} />
        <Stack.Screen name="crm/segments/[segmentId]/members" options={{ headerShown: true, header: () => <AppHeader title="Segment members" back backHref="/crm/segments" /> }} />
        <Stack.Screen name="crm/contacts/new" options={{ headerShown: true, header: () => <AppHeader title="New contact" back backHref="/crm/contacts" /> }} />
        <Stack.Screen name="crm/contacts/[contactId]" options={{ headerShown: true, header: () => <AppHeader title="Contact details" back backHref="/crm/contacts" /> }} />
        <Stack.Screen name="crm/contacts/[contactId]/edit" options={{ headerShown: true, header: () => <AppHeader title="Edit contact" back backHref="/crm/contacts" /> }} />
        <Stack.Screen name="crm/contacts/[contactId]/activity" options={{ headerShown: true, header: () => <AppHeader title="Contact activity" back backHref="/crm/contacts" /> }} />
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
