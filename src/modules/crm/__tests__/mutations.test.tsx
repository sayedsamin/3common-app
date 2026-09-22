import type { PropsWithChildren } from 'react';
import { act, cleanup, renderHook, waitFor } from '@testing-library/react-native';
import { onlineManager, QueryClientProvider } from '@tanstack/react-query';
import { createQueryClient } from '@/lib/query-client';
import { setApiKey } from '@/lib/api-session';
import { useCreateContact, useDeleteContact, useUpdateContact } from '../mutations';
import { contactsKeys } from '../queries';
import { activity, contact, page, patch, response, updatedContact } from '../test-fixtures';

const fetchMock = jest.spyOn(globalThis, 'fetch');
function context() {
  const client = createQueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { gcTime: 0 } } });
  function wrapper({ children }: PropsWithChildren) { return <QueryClientProvider client={client}>{children}</QueryClientProvider>; }
  client.setQueryData(contactsKeys.list({}), page([contact]));
  client.setQueryData(contactsKeys.detail(contact.id), contact);
  client.setQueryData(contactsKeys.activity(contact.id, {}), page([activity]));
  return { client, wrapper };
}
beforeEach(() => { setApiKey('test-key'); fetchMock.mockReset(); });
afterEach(async () => { await cleanup(); onlineManager.setOnline(true); setApiKey(null); });

test('create seeds canonical detail and invalidates contact lists', async () => {
  const { client, wrapper } = context();
  fetchMock.mockResolvedValueOnce(response({ data: { ...contact, id: 'new-contact' } }));
  const { result } = await renderHook(() => useCreateContact(), { wrapper });
  await act(async () => { await result.current.mutateAsync({ email: contact.email }); });
  expect(client.getQueryData(contactsKeys.detail('new-contact'))).toEqual({ ...contact, id: 'new-contact' });
  expect(client.getQueryState(contactsKeys.list({}))?.isInvalidated).toBe(true);
  await waitFor(() => expect(result.current.isSuccess || result.current.isError).toBe(true));
  await cleanup();
  client.clear();
});
test('update keeps PATCH shape out of detail cache and invalidates detail and activity', async () => {
  const { client, wrapper } = context();
  fetchMock.mockResolvedValueOnce(response({ data: updatedContact }));
  const { result } = await renderHook(() => useUpdateContact(contact.id), { wrapper });
  await act(async () => { await result.current.mutateAsync(patch); });
  expect(client.getQueryData(contactsKeys.detail(contact.id))).toEqual(contact);
  for (const key of [contactsKeys.list({}), contactsKeys.detail(contact.id), contactsKeys.activity(contact.id, {})]) expect(client.getQueryState(key)?.isInvalidated).toBe(true);
  await waitFor(() => expect(result.current.isSuccess || result.current.isError).toBe(true));
  await cleanup();
  client.clear();
});
test('merge removes the absorbed contact and all its activity pages', async () => {
  const { client, wrapper } = context();
  client.setQueryData(contactsKeys.detail('other'), { ...contact, id: 'other' });
  client.setQueryData(contactsKeys.activity('other', { pageNumber: 1 }), page([activity], 1));
  fetchMock.mockResolvedValueOnce(response({ data: updatedContact }));
  const { result } = await renderHook(() => useUpdateContact(contact.id), { wrapper });
  await act(async () => { await result.current.mutateAsync({ ...patch, mergeWith: 'other', resolution: 'safe-merge' }); });
  expect(client.getQueriesData({ queryKey: contactsKeys.contact('other') })).toEqual([]);
  await waitFor(() => expect(result.current.isSuccess || result.current.isError).toBe(true));
  await cleanup();
  client.clear();
});
test('delete cancels obsolete reads before removing all contact caches', async () => {
  const { client, wrapper } = context();
  const cancel = jest.spyOn(client, 'cancelQueries');
  const remove = jest.spyOn(client, 'removeQueries');
  fetchMock.mockResolvedValueOnce(response({ data: { id: contact.id } }));
  const { result } = await renderHook(() => useDeleteContact(contact.id), { wrapper });
  await act(async () => { await result.current.mutateAsync(); });
  expect(client.getQueriesData({ queryKey: contactsKeys.contact(contact.id) })).toEqual([]);
  expect(client.getQueryState(contactsKeys.list({}))?.isInvalidated).toBe(true);
  expect(cancel.mock.invocationCallOrder[0]).toBeLessThan(remove.mock.invocationCallOrder[0] ?? Infinity);
  await waitFor(() => expect(result.current.isSuccess || result.current.isError).toBe(true));
  await cleanup();
  client.clear();
});
test('failed offline writes settle immediately, retain cached records and never retry on reconnect', async () => {
  const { client, wrapper } = context();
  onlineManager.setOnline(false);
  fetchMock.mockRejectedValue(new TypeError('offline'));
  const { result } = await renderHook(() => useDeleteContact(contact.id), { wrapper });
  await act(async () => { await expect(result.current.mutateAsync()).rejects.toMatchObject({ code: 'network' }); });
  expect(result.current.isPaused).toBe(false);
  expect(client.getQueryData(contactsKeys.detail(contact.id))).toEqual(contact);
  await act(async () => { onlineManager.setOnline(true); });
  expect(fetchMock).toHaveBeenCalledTimes(1);
  await waitFor(() => expect(result.current.isSuccess || result.current.isError).toBe(true));
  await cleanup();
  client.clear();
});
