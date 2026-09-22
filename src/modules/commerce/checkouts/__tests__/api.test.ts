import { setApiKey } from '@/lib/api-session';
import { getCheckout, getCheckouts } from '../api';
import { checkoutsKeys } from '../queries';
import { ordersKeys } from '@/modules/orders/queries';
import { checkoutResponseSchema, checkoutRouteSchema, checkoutsInputSchema, checkoutsResponseSchema } from '../schemas';
import { checkoutFilterError, checkoutListInput } from '../utils';
import type { ListState } from '@/components/ui';
import { checkout, checkoutId, checkoutListItem, page, response } from '../test-fixtures';

const fetchMock = jest.spyOn(globalThis, 'fetch');
beforeEach(() => { setApiKey('test-key'); fetchMock.mockReset(); });
afterEach(() => setApiKey(null));

test('requests both documented endpoints with authentication and distinct response envelopes', async () => {
  fetchMock.mockResolvedValueOnce(response(page([checkoutListItem]))).mockResolvedValueOnce(response({ checkout }));
  await expect(getCheckouts()).resolves.toEqual(page([checkoutListItem]));
  await expect(getCheckout(checkoutId)).resolves.toEqual(checkout);
  expect(fetchMock.mock.calls.map(([url]) => new URL(String(url)).pathname)).toEqual(['/v1/checkouts/', `/v1/checkouts/${checkoutId}`]);
  expect(Object.fromEntries(new URL(String(fetchMock.mock.calls[0]?.[0])).searchParams)).toEqual({ pageNumber: '0', pageSize: '50', sortField: 'createdAt', sortDirection: 'desc' });
  for (const [, options] of fetchMock.mock.calls) { expect(options?.method ?? 'GET').toBe('GET'); expect(new Headers(options?.headers).get('Authorization')).toBe('Bearer test-key'); }
});
test('encodes every list input including nested advanced conditions', async () => {
  fetchMock.mockResolvedValue(response(page([])));
  const filters = [{ logic: 'and' as const, conditions: [{ logic: 'or' as const, conditions: [{ field: 'name', operator: 'contains' as const, value: 'A & B' }] }] }];
  await getCheckouts({ pageNumber: 3, pageSize: 200, search: ' A & B ', status: 'closed', eventId: 'event/one', timeslotId: 'slot & one', sortField: 'event', sortDirection: 'asc', filters });
  expect(Object.fromEntries(new URL(String(fetchMock.mock.calls[0]?.[0])).searchParams)).toEqual({ pageNumber: '3', pageSize: '200', search: 'A & B', status: 'closed', eventId: 'event/one', timeslotId: 'slot & one', sortField: 'event', sortDirection: 'asc', filters: JSON.stringify(filters) });
});
test.each(['', 'ABCDEF0123456789ABCDEF01', 'bad/id', '..', 'short', undefined, [checkoutId]])('rejects invalid route ID %j', id => {
  expect(checkoutRouteSchema.safeParse({ checkoutId: id }).success).toBe(false);
});
test('rejects invalid inputs before fetching and forwards cancellation', async () => {
  await expect(getCheckout('bad')).rejects.toThrow();
  await expect(getCheckouts({ pageSize: 201 })).rejects.toThrow();
  await expect(getCheckouts({ pageNumber: -1 })).rejects.toThrow();
  const controller = new AbortController(); controller.abort();
  await expect(getCheckout(checkoutId, controller.signal)).rejects.toMatchObject({ code: 'cancelled' });
  expect(fetchMock).not.toHaveBeenCalled();
});
test('validates nested fields and keeps list projections out of the detail contract', () => {
  expect(checkoutResponseSchema.safeParse({ checkout }).success).toBe(true);
  expect(checkoutsResponseSchema.safeParse(page([checkout])).success).toBe(false);
  for (const product of [
    { productId: 'id', visibility: 'visible' },
    { productId: 'id', visibility: 'visible', quantity: 1.5, dependents: [] },
    { productId: 'id', visibility: 'visible', dependents: [{ productId: 'id', priceMode: 'unknown' }] },
    { productId: 'id', visibility: 'visible', dependents: [{ productId: 'id', customFees: [{ name: 'Fee', rate: '5' }] }] },
  ]) expect(checkoutResponseSchema.safeParse({ checkout: { ...checkout, products: [product] } }).success).toBe(false);
  expect(checkoutResponseSchema.safeParse({ checkout: { ...checkout, payByInvoice: { memo: 'missing enabled' } } }).success).toBe(false);
  expect(checkoutResponseSchema.safeParse({ checkout: { ...checkout, paymentMethods: ['cash'] } }).success).toBe(false);
  expect(checkoutResponseSchema.safeParse({ checkout: { ...checkout, availableFrom: 'not-a-date' } }).success).toBe(false);
  expect(checkoutsInputSchema.safeParse({ pageSize: 0 }).success).toBe(false);
});
test('rejects malformed responses and mismatched identities, with safe errors', async () => {
  fetchMock.mockResolvedValueOnce(response({ data: checkout })).mockResolvedValueOnce(response({ checkout: { ...checkout, id: 'different' } })).mockResolvedValueOnce(response({ data: [] }));
  await expect(getCheckout(checkoutId)).rejects.toMatchObject({ code: 'response' });
  await expect(getCheckout(checkoutId)).rejects.toMatchObject({ code: 'response' });
  await expect(getCheckouts()).rejects.toMatchObject({ code: 'response' });
  fetchMock.mockResolvedValueOnce(response({ error: { code: 'missing', message: 'internal information' } }, 404));
  await expect(getCheckout(checkoutId)).rejects.toMatchObject({ code: 'not_found' });
});
test('normalizes defaults and separates caches from finance and every list input', () => {
  expect(checkoutsKeys.list({})).toEqual(checkoutsKeys.list({ pageNumber: 0, pageSize: 50, sortField: 'createdAt', sortDirection: 'desc' }));
  expect(checkoutsKeys.detail(checkoutId)).not.toEqual(ordersKeys.checkout(checkoutId));
  for (const input of [{ pageNumber: 1 }, { pageSize: 200 }, { search: 'a' }, { status: 'open' as const }, { eventId: 'event' }, { timeslotId: 'slot' }, { sortField: 'form' as const }, { sortDirection: 'asc' as const }, { filters: [{ logic: 'and' as const, conditions: [{ field: 'name', operator: 'contains' as const, value: 'a' }] }] }]) expect(checkoutsKeys.list(input)).not.toEqual(checkoutsKeys.list({}));
});
test('translates UI pagination and typed conditions without sending display labels', () => {
  const controls: ListState = { page: 2, pageSize: 50, primaryFilter: 'open', search: ' pass ', sortField: 'name', sortDirection: 'asc', filters: { eventId: 'event', timeslotId: 'slot', advanced: JSON.stringify([{ kind: 'group', logic: 'and', conditions: [{ kind: 'condition', field: 'maxTicketsPerOrder', type: 'number', operator: 'is_between', value: '1', end: '5' }] }]) } };
  expect(checkoutListInput(controls)).toMatchObject({ pageNumber: 1, search: 'pass', status: 'open', eventId: 'event', timeslotId: 'slot', filters: [{ logic: 'and', conditions: [{ field: 'maxTicketsPerOrder', operator: 'is_between', value: { start: 1, end: 5 } }] }] });
  expect(checkoutFilterError({ ...controls, filters: { advanced: 'bad-json' } })).toBeDefined();
});
