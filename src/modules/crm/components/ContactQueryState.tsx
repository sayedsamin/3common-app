import { ErrorState, LoadingState, Text } from '@/components/ui';
import { contactErrorMessage } from '../utils';

export function ContactQueryState({ query, label, isSearchPending = false }: {
  query: { fetchStatus: string; isFetching: boolean; data?: unknown; error: unknown; refetch: () => unknown };
  label: string; isSearchPending?: boolean;
}) {
  return <>
    {query.fetchStatus === 'paused' ? <Text accessibilityRole="alert">You are offline. {query.data ? 'Showing previously loaded data.' : 'Data will load when you reconnect.'}</Text> : null}
    {query.error && !isSearchPending ? <ErrorState message={contactErrorMessage(query.error)} onRetry={() => { void query.refetch(); }} /> : null}
    {query.error && query.data && !isSearchPending ? <Text variant="muted">Showing previously loaded data.</Text> : null}
    {query.isFetching || isSearchPending ? <LoadingState label={`Loading ${label}...`} /> : null}
  </>;
}
