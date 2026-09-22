import { PortalHost } from '@rn-primitives/portal';
import type { QueryClient } from '@tanstack/react-query';
import type { PropsWithChildren } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { QueryProvider } from './QueryProvider';

type AppProvidersProps = PropsWithChildren<{ client?: QueryClient }>;

export function AppProviders({ children, client }: AppProvidersProps) {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryProvider client={client}>
          {children}
          <PortalHost />
        </QueryProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
