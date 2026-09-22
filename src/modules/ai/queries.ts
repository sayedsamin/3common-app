import { queryOptions, skipToken } from '@tanstack/react-query';
import { fetchResults } from './api';
import type { Query, Result } from './contracts';

export const chatResultKey = (id: string) => ['ai', 'results', id] as const;
export function resultQueryOptions(id: string) { return queryOptions<Result>({ queryKey: chatResultKey(id), queryFn: skipToken, staleTime: Infinity, gcTime: Infinity }); }
export function resultPageQueryOptions(id: string, query: Query, controller: AbortController) {
  return queryOptions({ queryKey: ['ai', 'page', id, query], queryFn: ({ signal }) => {
    const abort = () => controller.abort(); signal.addEventListener('abort', abort, { once: true });
    if (signal.aborted) controller.abort();
    return fetchResults(query, controller.signal).finally(() => signal.removeEventListener('abort', abort));
  }, retry: false, staleTime: 0, gcTime: 0, networkMode: 'always' });
}
