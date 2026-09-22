import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import type { ListState } from '@/components/ui';
import { ApiError } from '@/lib/api-client';
import { contactsQueryOptions } from './queries';
import { contactFormSchema, type Contact, type ContactFormValues } from './schemas';
import { useCreateContact, useUpdateContact } from './mutations';
import { contactErrorMessage } from './utils';

export const initialContactControls: ListState = { primaryFilter: 'all', search: '', filters: {}, sortField: 'mostRecentOrder', sortDirection: 'desc', pageSize: 20, page: 1 };
export function useContactSearch(enabled: boolean) {
  const [controls, setControls] = useState({ search: '', page: 0 });
  const [search, setDebouncedSearch] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(controls.search.trim()), 300);
    return () => clearTimeout(timer);
  }, [controls.search]);
  const isSearchPending = search !== controls.search.trim();
  const query = useQuery({ ...contactsQueryOptions({ search, pageNumber: controls.page, pageSize: 5, sortField: 'fullName', sortDirection: 'asc', filter: 'all' }), enabled: enabled && !isSearchPending });
  return { query, isSearchPending, search: controls.search, page: controls.page,
    setSearch: (value: string) => setControls({ search: value, page: 0 }),
    setPage: (page: number) => setControls(previous => ({ ...previous, page })),
  };
}
export function useContactsList() {
  const [controls, setControls] = useState(initialContactControls);
  const [search, setSearch] = useState('');
  useEffect(() => { const timer = setTimeout(() => setSearch(controls.search.trim()), 300); return () => clearTimeout(timer); }, [controls.search]);
  const isSearchPending = search !== controls.search.trim();
  // Toolbar choices are validated at the same boundary as programmatic inputs.
  const input = { pageNumber: controls.page - 1, pageSize: controls.pageSize, search, sortField: controls.sortField, sortDirection: controls.sortDirection };
  const filter = contactFormSchema.shape.status.safeParse(controls.primaryFilter);
  const query = useQuery({ ...contactsQueryOptions({ ...input, filter: filter.success ? filter.data : 'all' }), enabled: !isSearchPending });
  return { controls, setControls, query, isSearchPending };
}
export function useContactEditor(contact?: Contact) {
  const form = useForm<ContactFormValues>({ defaultValues: {
    email: contact?.email ?? '', billingEmail: contact?.billingEmail ?? '', firstName: contact?.firstName ?? '',
    lastName: contact?.lastName ?? '', phone: contact?.phone ?? '', status: contact?.status ?? 'unknown',
  } });
  const create = useCreateContact();
  const update = useUpdateContact(contact?.id ?? '');
  const saving = useRef(false);
  const [savedId, setSavedId] = useState<string>();
  const submit = () => form.handleSubmit(async values => {
    if (saving.current) return;
    saving.current = true;
    form.clearErrors();
    try {
      const parsed = contactFormSchema.safeParse({ ...values, email: values.email.trim(), billingEmail: values.billingEmail.trim() });
      if (!parsed.success) {
        for (const issue of parsed.error.issues) {
          const field = contactFormSchema.keyof().safeParse(issue.path[0]);
          form.setError(field.success ? field.data : 'root', { message: issue.message });
        }
        return;
      }
      const data = parsed.data;
      let id: string;
      if (contact) {
        const result = await update.mutateAsync({ contact: {
          firstName: data.firstName, lastName: data.lastName, email: data.email, status: data.status,
          ...(data.billingEmail !== (contact.billingEmail ?? '') ? { billingEmail: data.billingEmail } : {}),
          ...(data.phone !== (contact.phone ?? '') ? { phone: data.phone || null } : {}),
        } });
        id = result._id;
      } else {
        const result = await create.mutateAsync({ email: data.email, billingEmail: data.billingEmail || undefined,
          firstName: data.firstName || undefined, lastName: data.lastName || undefined, phone: data.phone || undefined });
        id = result.id;
      }
      form.reset(data);
      setSavedId(id);
    } catch (error) {
      if (error instanceof ApiError && error.code === 'conflict') form.setError('email', { message: contactErrorMessage(error) });
      if (error instanceof ApiError && error.code === 'validation') {
        const fields = z.record(z.string(), z.union([z.string(), z.array(z.string())])).safeParse(error.details?.fieldErrors ?? error.details?.fields ?? error.details);
        if (fields.success) for (const [key, message] of Object.entries(fields.data)) {
          const field = contactFormSchema.keyof().safeParse(key.replace(/^contact\./, ''));
          if (field.success) form.setError(field.data, { message: typeof message === 'string' ? message : message.join(' ') });
        }
      }
      form.setError('root', { message: error instanceof ApiError && ['network', 'timeout', 'response'].includes(error.code)
        ? 'We could not confirm the save. Your entries are kept here. Check Contacts before trying again.' : contactErrorMessage(error) });
    } finally { saving.current = false; }
  })();
  return { form, submit, savedId };
}
