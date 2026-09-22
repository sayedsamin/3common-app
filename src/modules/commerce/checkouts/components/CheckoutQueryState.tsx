import { ErrorState, LoadingState, Text } from '@/components/ui';
import { checkoutErrorMessage } from '../utils';

export function CheckoutQueryState({ query, label }: { query: { fetchStatus: string; isFetching: boolean; data?: unknown; error: unknown; refetch: () => unknown }; label: string }) {
  return <>
    {query.fetchStatus === 'paused' ? <Text accessibilityRole="alert">You are offline. {query.data ? 'Showing previously loaded data.' : 'Connect to load data.'}</Text> : null}
    {query.error ? <ErrorState message={checkoutErrorMessage(query.error)} onRetry={() => { void query.refetch(); }} /> : null}
    {query.error && query.data ? <Text variant="muted">Showing previously loaded data.</Text> : null}
    {query.isFetching ? <LoadingState label={`Loading ${label}...`} /> : null}
  </>;
}
