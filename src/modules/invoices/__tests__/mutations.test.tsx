import type { PropsWithChildren } from 'react';
import { act, cleanup, renderHook } from '@testing-library/react-native';
import { onlineManager, QueryClientProvider } from '@tanstack/react-query';
import { createQueryClient } from '@/lib/query-client';
import { setApiKey } from '@/lib/api-session';
import { useInvoiceMutation, type InvoiceAction } from '../mutations';
import { invoicesKeys } from '../queries';
import { invoice, response } from '../test-fixtures';

const fetchMock = jest.spyOn(globalThis, 'fetch');
function context() {
  const client = createQueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { gcTime: 0 } } });
  function wrapper({ children }: PropsWithChildren) { return <QueryClientProvider client={client}>{children}</QueryClientProvider>; }
  client.setQueryData(invoicesKeys.list({}), { data: [invoice], hasMore: false });
  client.setQueryData(invoicesKeys.list({ status: 'draft' }), { data: [invoice], hasMore: false });
  client.setQueryData(invoicesKeys.detail(invoice.id), invoice);
  return { client, wrapper };
}
beforeEach(() => { setApiKey('test-key'); fetchMock.mockReset(); });
afterEach(async () => { await cleanup(); onlineManager.setOnline(true); setApiKey(null); });

const actions: InvoiceAction[] = [
  { type: 'create', input: { customerId: 'c', currency: 'CAD', lineItems: [{ description: 'Item', quantity: 1, unitAmount: 100 }] } },
  { type: 'update', id: invoice.id, input: { notes: 'Saved' } },
  { type: 'finalize', id: invoice.id, sendEmail: false },
  { type: 'send', id: invoice.id },
  { type: 'void', id: invoice.id, reason: 'Cancelled' },
  { type: 'payment', id: invoice.id, input: { payment: 100, idempotencyKey: 'one' } },
];
test.each(actions)('$type updates canonical details and invalidates all list variants', async action => {
  const { client, wrapper } = context();
  const updated = { ...invoice, notes: 'Server response' };
  fetchMock.mockResolvedValueOnce(response({ data: updated }));
  const { result } = await renderHook(useInvoiceMutation, { wrapper });
  await act(async () => { await result.current.mutateAsync(action); });
  expect(client.getQueryData(invoicesKeys.detail(invoice.id))).toEqual(updated);
  expect(client.getQueryState(invoicesKeys.list({}))?.isInvalidated).toBe(true);
  expect(client.getQueryState(invoicesKeys.list({ status: 'draft' }))?.isInvalidated).toBe(true);
  await cleanup(); client.clear();
});

test('delete cancels obsolete reads, removes details, and invalidates lists', async () => {
  const { client, wrapper } = context();
  const cancel = jest.spyOn(client, 'cancelQueries');
  const remove = jest.spyOn(client, 'removeQueries');
  fetchMock.mockResolvedValueOnce(response({ data: { id: invoice.id } }));
  const { result } = await renderHook(useInvoiceMutation, { wrapper });
  await act(async () => { await result.current.mutateAsync({ type: 'delete', id: invoice.id }); });
  expect(client.getQueryData(invoicesKeys.detail(invoice.id))).toBeUndefined();
  expect(client.getQueryState(invoicesKeys.list({}))?.isInvalidated).toBe(true);
  expect(cancel.mock.invocationCallOrder[0]).toBeLessThan(remove.mock.invocationCallOrder[0] ?? Infinity);
  await cleanup(); client.clear();
});

test.each([409, 500])('HTTP %i refreshes stale caches without applying optimistic changes', async status => {
  const { client, wrapper } = context();
  fetchMock.mockResolvedValueOnce(response({ error: { code: 'FAILED', message: 'Error' } }, status));
  const { result } = await renderHook(useInvoiceMutation, { wrapper });
  await act(async () => { await expect(result.current.mutateAsync({ type: 'delete', id: invoice.id })).rejects.toMatchObject({ status }); });
  expect(client.getQueryData(invoicesKeys.detail(invoice.id))).toEqual(invoice);
  expect(client.getQueryState(invoicesKeys.detail(invoice.id))?.isInvalidated).toBe(true);
  expect(fetchMock).toHaveBeenCalledTimes(1);
  await cleanup(); client.clear();
});

test('offline writes fail immediately and never run again on reconnect', async () => {
  const { client, wrapper } = context();
  onlineManager.setOnline(false);
  fetchMock.mockRejectedValue(new TypeError('offline'));
  const { result } = await renderHook(useInvoiceMutation, { wrapper });
  await act(async () => { await expect(result.current.mutateAsync({ type: 'send', id: invoice.id })).rejects.toMatchObject({ code: 'network' }); });
  expect(result.current.isPaused).toBe(false);
  expect(client.getQueryState(invoicesKeys.detail(invoice.id))?.isInvalidated).toBe(true);
  await act(async () => { onlineManager.setOnline(true); });
  expect(fetchMock).toHaveBeenCalledTimes(1);
  await cleanup(); client.clear();
});

test('late writes do not restore invoice caches after sign-out', async () => {
  const { client, wrapper } = context();
  fetchMock.mockImplementationOnce(async () => { setApiKey(null); client.clear(); return response({ data: invoice }); });
  const { result } = await renderHook(useInvoiceMutation, { wrapper });
  await act(async () => { await result.current.mutateAsync({ type: 'send', id: invoice.id }); });
  expect(client.getQueryData(invoicesKeys.detail(invoice.id))).toBeUndefined();
  await cleanup(); client.clear();
});
