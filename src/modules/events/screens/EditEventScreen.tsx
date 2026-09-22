import { useQuery } from '@tanstack/react-query';
import { Button, ErrorState, LoadingState, Screen, Text } from '@/components/ui';
import { router } from 'expo-router';
import { eventQueryOptions } from '../queries';
import { eventErrorMessage } from '../utils';
import { EventEditForm } from '../components/EventEditForm';

export function EditEventScreen({ eventId }: { eventId: string }) {
  const query = useQuery({ ...eventQueryOptions(eventId), refetchOnMount: 'always' });
  if (query.data && (query.isFetchedAfterMount || !query.isFetching)) return <EventEditForm key={eventId} event={query.data}
    notice={query.error ? 'The latest details could not be loaded. These are the previously loaded values.' : query.fetchStatus === 'paused' ? 'You are offline. Connect before saving your changes.' : undefined} />;
  return <Screen edges={['left', 'right', 'bottom']}>
    {query.fetchStatus === 'paused' ? <Text accessibilityRole="alert">You are offline. Connect to load this event.</Text>
      : query.error ? <ErrorState message={eventErrorMessage(query.error)} onRetry={() => { void query.refetch(); }} /> : <LoadingState label="Loading event to edit..." />}
    <Button label="Back to event" variant="secondary" onPress={() => router.replace({ pathname: '/events/[eventId]', params: { eventId } })} />
  </Screen>;
}
