import { QueryClientProvider, type QueryClient } from '@tanstack/react-query';
import type { PropsWithChildren } from 'react';

import { queryClient } from '@/lib/query-client';

export function QueryProvider({ children, client = queryClient }: PropsWithChildren<{ client?: QueryClient }>) {
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
