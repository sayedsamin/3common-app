import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateEvent } from './api';
import { eventsKeys } from './queries';
import type { UpdateEvent } from './edit-schemas';

export function useUpdateEvent(eventId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (changes: UpdateEvent) => updateEvent(eventId, changes),
    retry: false,
    // A paused write must not unexpectedly run after the user leaves the editor.
    networkMode: 'always',
    onMutate: async () => { await client.cancelQueries({ queryKey: eventsKeys.detail(eventId) }); },
    onSuccess: event => {
      client.setQueryData(eventsKeys.detail(eventId), event);
      void client.invalidateQueries({ queryKey: eventsKeys.all });
    },
  });
}
