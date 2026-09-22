import { ApiError, apiRequest } from '@/lib/api-client';
import { eventIdSchema, eventResponseSchema, eventsInputSchema, eventsResponseSchema, type EventsInput } from './schemas';

export async function getEvents(input: EventsInput, signal?: AbortSignal) {
  const values = eventsInputSchema.parse(input);
  const params = new URLSearchParams({ page: String(values.page), pageSize: String(values.pageSize), sortField: values.sortField, sortDirection: values.sortDirection });
  if (values.search) params.set('search', values.search);
  if (values.status) params.set('status', values.status);
  const result = eventsResponseSchema.safeParse(await apiRequest(`events/?${params}`, { signal }));
  if (!result.success) throw new ApiError('response', 'The events response could not be read. Please try again.');
  return result.data;
}

export async function getEvent(eventId: string, signal?: AbortSignal) {
  const id = eventIdSchema.parse(eventId);
  const result = eventResponseSchema.safeParse(await apiRequest(`events/${encodeURIComponent(id)}`, { signal }));
  if (!result.success || result.data.data.id !== id) throw new ApiError('response', 'The event details could not be read. Please try again.');
  return result.data.data;
}
