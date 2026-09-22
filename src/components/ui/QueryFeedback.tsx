import { ApiError } from '@/lib/api-client';
import { ErrorState } from './ErrorState';
import { LoadingState } from './LoadingState';
import { Text } from './Text';
export function QueryFeedback({ query, label }: { label: string; query: { error: unknown; isFetching: boolean; fetchStatus: string; data?: unknown; refetch: () => Promise<unknown> } }) {
  return <>{query.fetchStatus === 'paused' ? <Text accessibilityRole="alert">You are offline. {query.data ? 'Showing previously loaded data.' : 'Connect to load this content.'}</Text> : null}
    {query.error ? <ErrorState message={query.error instanceof ApiError ? query.error.message : `Unable to load ${label}.`} onRetry={() => { void query.refetch(); }} /> : null}
    {query.error && query.data ? <Text>Showing previously loaded data.</Text> : null}
    {query.isFetching ? <LoadingState label={`Loading ${label}...`} /> : null}</>;
}
