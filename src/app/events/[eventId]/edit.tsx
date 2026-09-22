import { Stack, useLocalSearchParams } from 'expo-router';
import { AppHeader } from '@/components/navigation/AppHeader';
import { EditEventScreen, InvalidEventScreen, eventRouteSchema } from '@/modules/events';

export default function EditEventRoute() {
  const result = eventRouteSchema.safeParse(useLocalSearchParams());
  return result.success ? <>
    <Stack.Screen options={{ headerShown: true, header: () => <AppHeader title="Edit event" back backHref={{ pathname: '/events/[eventId]', params: { eventId: result.data.eventId } }} /> }} />
    <EditEventScreen eventId={result.data.eventId} />
  </> : <InvalidEventScreen />;
}
