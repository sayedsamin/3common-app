import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Button, ErrorState, LoadingState, Screen, Text } from '@/components/ui';
import { EventDetails } from '../components/EventDetails';
import { eventQueryOptions } from '../queries';
import { eventErrorMessage } from '../utils';

export function EventDetailsScreen({ eventId }: { eventId: string }) {
  const query = useQuery(eventQueryOptions(eventId));
  return <Screen edges={['left', 'right', 'bottom']}>
    {query.fetchStatus === 'paused' ? <Text accessibilityRole="alert">You are offline. {query.data ? 'Showing saved details.' : 'Details will load when you reconnect.'}</Text> : null}
    {query.isPending && query.fetchStatus !== 'paused' ? <LoadingState label="Loading event details..." /> : null}
    {query.error ? <ErrorState message={eventErrorMessage(query.error)} onRetry={() => { void query.refetch(); }} /> : null}
    {query.data ? <>
      {query.error ? <Text variant="muted">Showing previously loaded details.</Text> : null}
      <EventDetails event={query.data} />
      <Button label="Refresh details" loading={query.isFetching} variant="secondary" onPress={() => { void query.refetch(); }} />
    </> : null}
    <Button label="Back to My Events" variant="ghost" onPress={() => router.replace('/events/my-events')} />
  </Screen>;
}

export function InvalidEventScreen() {
  return <Screen edges={['left', 'right', 'bottom']}><ErrorState message="This event link is invalid." /><Button label="Back to My Events" onPress={() => router.replace('/events/my-events')} /></Screen>;
}
