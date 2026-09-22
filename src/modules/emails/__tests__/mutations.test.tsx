import type { PropsWithChildren } from 'react';
import { act, cleanup, renderHook } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { setApiKey } from '@/lib/api-session';
import { useEmailAction, useSaveEmail } from '../mutations';
import { emailsKeys } from '../queries';
const fetchMock = jest.spyOn(globalThis, 'fetch');
const email = { id: 'email-1', subject: 'Draft', sent: false };
let client: QueryClient;
function Wrapper({ children }: PropsWithChildren) { return <QueryClientProvider client={client}>{children}</QueryClientProvider>; }
beforeEach(() => { client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { retry: false, gcTime: 0 } } }); setApiKey('test-key'); fetchMock.mockReset(); });
afterEach(async () => { await cleanup(); client.clear(); setApiKey(null); });
test('saving updates detail and invalidates the list without discarding other campaigns', async () => {
  client.setQueryData(emailsKeys.list({}), { data: [email] }); client.setQueryData(emailsKeys.detail('other'), { id: 'other' });
  fetchMock.mockImplementation(async () => new Response(JSON.stringify({ data: { ...email, subject: 'Saved' } })));
  const hook = await renderHook(() => useSaveEmail(email.id), { wrapper: Wrapper }); await act(async () => { await hook.result.current.mutateAsync({ subject: 'Saved' }); });
  expect(client.getQueryData(emailsKeys.detail(email.id))).toMatchObject({ subject: 'Saved' }); expect(client.getQueryState(emailsKeys.list({}))?.isInvalidated).toBe(true); expect(client.getQueryData(emailsKeys.detail('other'))).toEqual({ id: 'other' });
});
test('cancel schedule invalidates detail and activity; deletion removes the campaign cache', async () => {
  const activityKey = [...emailsKeys.campaign(email.id), 'activity', {}]; client.setQueryData(emailsKeys.detail(email.id), email); client.setQueryData(activityKey, { data: [] }); client.setQueryData(emailsKeys.list({}), { data: [email] });
  fetchMock.mockImplementation(async (_, options) => new Response(JSON.stringify({ data: options?.method === 'DELETE' ? { deleted: true } : email })));
  const hook = await renderHook(() => useEmailAction(email.id), { wrapper: Wrapper }); await act(async () => { await hook.result.current.mutateAsync({ type: 'cancel' }); });
  expect(client.getQueryState(activityKey)?.isInvalidated).toBe(true); expect(client.getQueryState(emailsKeys.detail(email.id))?.isInvalidated).toBe(true);
  await act(async () => { await hook.result.current.mutateAsync({ type: 'delete' }); }); expect(client.getQueryData(activityKey)).toBeUndefined(); expect(client.getQueryData(emailsKeys.detail(email.id))).toBeUndefined(); expect(client.getQueryState(emailsKeys.list({}))?.isInvalidated).toBe(true);
});
test('write errors preserve cache and are never automatically retried', async () => {
  client.setQueryData(emailsKeys.detail(email.id), email); fetchMock.mockImplementation(async () => new Response(JSON.stringify({ error: { code: 'UNAVAILABLE', message: 'Unavailable' } }), { status: 503 }));
  const hook = await renderHook(() => useEmailAction(email.id), { wrapper: Wrapper }); await act(async () => { await expect(hook.result.current.mutateAsync({ type: 'send' })).rejects.toMatchObject({ status: 503 }); }); expect(fetchMock).toHaveBeenCalledTimes(1); expect(client.getQueryData(emailsKeys.detail(email.id))).toEqual(email);
});
