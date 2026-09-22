import { render } from '@testing-library/react-native';
import type { PropsWithChildren, ReactElement } from 'react';

import { createQueryClient } from '@/lib/query-client';
import { AppProviders } from '@/providers/AppProviders';

export function renderWithProviders(ui: ReactElement) {
  const client = createQueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false, gcTime: 0 },
    },
  });

  function Wrapper({ children }: PropsWithChildren) {
    return <AppProviders client={client}>{children}</AppProviders>;
  }

  return render(ui, { wrapper: Wrapper });
}
