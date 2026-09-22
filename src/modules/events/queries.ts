import { queryOptions } from '@tanstack/react-query';
import { getEvent, getEvents } from './api';
import type { EventsInput } from './schemas';

export const eventsKeys = {
  all: ['events'] as const,
  list: (input: EventsInput) => ['events', 'list', input] as const,
  detail: (id: string) => ['events', 'detail', id] as const,
};
export function eventsQueryOptions(input: EventsInput) {
  return queryOptions({ queryKey: eventsKeys.list(input), queryFn: ({ signal }) => getEvents(input, signal), staleTime: 30_000 });
}
export function eventQueryOptions(id: string) {
  return queryOptions({ queryKey: eventsKeys.detail(id), queryFn: ({ signal }) => getEvent(id, signal), staleTime: 30_000 });
}
