import { QueryClient, type QueryClientConfig } from '@tanstack/react-query';
import { apiQueryRetryDelay, shouldRetryApiQuery } from './api-error';

export function createQueryClient(config?: QueryClientConfig) {
  return new QueryClient({
    ...config,
    defaultOptions: {
      ...config?.defaultOptions,
      queries: {
        retry: shouldRetryApiQuery,
        retryDelay: apiQueryRetryDelay,
        ...config?.defaultOptions?.queries,
      },
      mutations: { retry: false, ...config?.defaultOptions?.mutations },
    },
  });
}

// One app client outside component rendering. Tests inject an isolated client.
export const queryClient = createQueryClient();
