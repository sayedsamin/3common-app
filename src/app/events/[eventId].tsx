import { useLocalSearchParams } from 'expo-router';
import { EventDetailsScreen, InvalidEventScreen, eventRouteSchema } from '@/modules/events';

export default function EventRoute() {
  const result = eventRouteSchema.safeParse(useLocalSearchParams());
  return result.success ? <EventDetailsScreen eventId={result.data.eventId} /> : <InvalidEventScreen />;
}
