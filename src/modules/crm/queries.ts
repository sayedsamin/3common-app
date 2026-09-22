import { queryOptions } from '@tanstack/react-query';
import { getContact, getContactActivity, getContacts } from './api';
import { activityInputSchema, contactsInputSchema, type ActivityInput, type ContactsInput } from './schemas';

export const contactsKeys = {
  all: ['contacts'] as const,
  lists: ['contacts', 'list'] as const,
  list: (input: ContactsInput) => ['contacts', 'list', contactsInputSchema.parse(input)] as const,
  contact: (id: string) => ['contacts', 'contact', id] as const,
  detail: (id: string) => ['contacts', 'contact', id, 'detail'] as const,
  activity: (id: string, input: ActivityInput) => ['contacts', 'contact', id, 'activity', activityInputSchema.parse(input)] as const,
};
export function contactsQueryOptions(input: ContactsInput) {
  return queryOptions({ queryKey: contactsKeys.list(input), queryFn: ({ signal }) => getContacts(input, signal), staleTime: 30_000 });
}
export function contactQueryOptions(id: string) {
  return queryOptions({ queryKey: contactsKeys.detail(id), queryFn: ({ signal }) => getContact(id, signal), staleTime: 30_000 });
}
export function contactActivityQueryOptions(id: string, input: ActivityInput) {
  return queryOptions({ queryKey: contactsKeys.activity(id, input), queryFn: ({ signal }) => getContactActivity(id, input, signal), staleTime: 30_000 });
}
