import { ErrorState, LoadingState, Text } from '@/components/ui';
import { segmentErrorMessage } from '../utils';

export function SegmentQueryState({ query, label }: { query: { fetchStatus: string; isFetching: boolean; data?: unknown; error: unknown; refetch: () => unknown }; label: string }) {
  return <>
    {query.fetchStatus === 'paused' ? <Text accessibilityRole="alert">You are offline. {query.data ? 'Showing previously loaded data.' : 'Connect to load data.'}</Text> : null}
    {query.error ? <ErrorState message={segmentErrorMessage(query.error)} onRetry={() => { void query.refetch(); }} /> : null}
    {query.error && query.data ? <Text>Showing previously loaded data.</Text> : null}
    {query.isFetching ? <LoadingState label={`Loading ${label}...`} /> : null}
  </>;
}
