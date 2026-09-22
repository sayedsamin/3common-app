import { QueryClient, type QueryClientConfig } from '@tanstack/react-query';

export function createQueryClient(config?: QueryClientConfig) {
  return new QueryClient(config);
}

// One app client outside component rendering. Tests inject an isolated client.
export const queryClient = createQueryClient();
