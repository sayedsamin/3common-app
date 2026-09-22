import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createContact, deleteContact, updateContact } from './api';
import { contactsKeys } from './queries';
import type { CreateContact, UpdateContact } from './schemas';

export function useCreateContact() {
  const client = useQueryClient();
  return useMutation({ mutationFn: (input: CreateContact) => createContact(input), retry: false, networkMode: 'always',
    onSuccess: async contact => {
      await client.cancelQueries({ queryKey: contactsKeys.all });
      client.setQueryData(contactsKeys.detail(contact.id), contact);
      void client.invalidateQueries({ queryKey: contactsKeys.lists });
    } });
}
export function useUpdateContact(id: string) {
  const client = useQueryClient();
  return useMutation({ mutationFn: (input: UpdateContact) => updateContact(id, input), retry: false, networkMode: 'always',
    onMutate: () => client.cancelQueries({ queryKey: contactsKeys.all }),
    onSuccess: async (contact, input) => {
      await client.cancelQueries({ queryKey: contactsKeys.all });
      if (input.mergeWith && input.mergeWith !== id) client.removeQueries({ queryKey: contactsKeys.contact(input.mergeWith) });
      if (contact.status === 'deleted') client.removeQueries({ queryKey: contactsKeys.contact(id) });
      else void client.invalidateQueries({ queryKey: contactsKeys.contact(id) });
      void client.invalidateQueries({ queryKey: contactsKeys.lists });
    } });
}
export function useDeleteContact(id: string) {
  const client = useQueryClient();
  return useMutation({ mutationFn: () => deleteContact(id), retry: false, networkMode: 'always',
    onMutate: () => client.cancelQueries({ queryKey: contactsKeys.all }),
    onSuccess: async () => {
      await client.cancelQueries({ queryKey: contactsKeys.all });
      client.removeQueries({ queryKey: contactsKeys.contact(id) });
      void client.invalidateQueries({ queryKey: contactsKeys.lists });
    } });
}
