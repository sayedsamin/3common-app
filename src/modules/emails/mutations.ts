import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from './api';
import { emailsKeys } from './queries';
import type { CreateEmail, UpdateEmail } from './schemas';

export type EmailAction = { type: 'send' } | { type: 'schedule'; sendAt: string } | { type: 'cancel' } | { type: 'delete' };
export function useSaveEmail(id?: string) {
  const client = useQueryClient();
  return useMutation({ mutationFn: (input: CreateEmail | UpdateEmail) => id ? api.updateEmail(id, input) : api.createEmail(input), retry: false, networkMode: 'always',
    onMutate: () => id ? client.cancelQueries({ queryKey: emailsKeys.campaign(id) }) : undefined,
    onSuccess: email => { if (email.id) client.setQueryData(emailsKeys.detail(email.id), email); void client.invalidateQueries({ queryKey: emailsKeys.all }); },
  });
}
export function useEmailAction(id: string) {
  const client = useQueryClient();
  return useMutation({ mutationFn: async (action: EmailAction) => { switch (action.type) { case 'send': await api.sendEmail(id); break; case 'schedule': await api.scheduleEmail(id, { sendAt: action.sendAt }); break; case 'cancel': await api.cancelEmailSchedule(id); break; case 'delete': await api.deleteEmail(id); } }, retry: false, networkMode: 'always',
    onMutate: () => client.cancelQueries({ queryKey: emailsKeys.campaign(id) }),
    onSuccess: (_, action) => { if (action.type === 'delete') client.removeQueries({ queryKey: emailsKeys.campaign(id) }); else void client.invalidateQueries({ queryKey: emailsKeys.campaign(id) }); void client.invalidateQueries({ queryKey: emailsKeys.lists }); },
  });
}
