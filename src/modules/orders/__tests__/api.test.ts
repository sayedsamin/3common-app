import { setApiKey } from '@/lib/api-session';
import { getCheckoutDetails, getOrders } from '../api';
import { checkoutRouteSchema, ordersInputSchema, type OrdersInput } from '../schemas';
import { ordersKeys } from '../queries';
import { fieldLabel, orderMoney } from '../utils';
import { checkout, order, response } from '../test-fixtures';

const fetchMock = jest.spyOn(globalThis, 'fetch');
beforeEach(() => { setApiKey('test-key'); fetchMock.mockReset(); });
afterEach(() => setApiKey(null));

test('serializes every list filter including false booleans and zero-based pagination', async () => {
  const input: OrdersInput = { page: 2, pageSize: 50, eventId: 'e & 1', productSetId: 's', timeslotId: 't', contactId: 'c', purchaserId: 'p', orderNumber: 'ORD-1', orderStatus: 'paid', type: 'ticket', status: true, refunded: false, isBoxOffice: true, sortDirection: 'asc' };
  fetchMock.mockResolvedValueOnce(response({ data: [order], hasMore: true }));
  expect(await getOrders(input)).toEqual({ data: [order], hasMore: true });
  const url = new URL(String(fetchMock.mock.calls[0]?.[0]));
  expect(url.pathname).toBe('/v1/orders/');
  for (const [key, value] of Object.entries(input)) expect(url.searchParams.get(key)).toBe(String(value));
  expect(new Headers(fetchMock.mock.calls[0]?.[1]?.headers).get('Authorization')).toBe('Bearer test-key');
});

test('defaults list pagination and omits blank optional filters', async () => {
  fetchMock.mockResolvedValueOnce(response({ data: [], hasMore: false }));
  await getOrders({ contactId: '  ' });
  const url = new URL(String(fetchMock.mock.calls[0]?.[0]));
  expect(Object.fromEntries(url.searchParams)).toEqual({ page: '0', pageSize: '20', sortDirection: 'desc' });
});

test('loads checkout by encoded product set ID and preserves loosely documented records', async () => {
  fetchMock.mockResolvedValueOnce(response({ data: checkout }));
  expect(await getCheckoutDetails('set&one')).toEqual(checkout);
  expect(fetchMock.mock.calls[0]?.[0]).toBe('https://api.3common.com/v1/orders/checkout/set%26one/details');
});

test('aborted reads do not issue requests', async () => {
  const controller = new AbortController(); controller.abort();
  await expect(getOrders({}, controller.signal)).rejects.toMatchObject({ code: 'cancelled' });
  await expect(getCheckoutDetails('set-1', controller.signal)).rejects.toMatchObject({ code: 'cancelled' });
  expect(fetchMock).not.toHaveBeenCalled();
});

test.each([{ data: [order] }, { data: [{ ...order, amount: '5250' }], hasMore: false }, { data: [{ id: 'missing-required' }], hasMore: false }, { data: [{ ...order, date: 'yesterday' }], hasMore: false }])('rejects malformed list response %j', async value => {
  fetchMock.mockResolvedValueOnce(response(value));
  await expect(getOrders()).rejects.toMatchObject({ code: 'response' });
});
test.each([{ ...checkout, tickets: [null] }, { ...checkout, orders: ['invalid'] }, { ...checkout, products: { mode: 'event', data: [], inventoryByProductId: {} } }, { products: checkout.products, orders: [] }])('rejects malformed checkout response %j', async value => {
  fetchMock.mockResolvedValueOnce(response({ data: value }));
  await expect(getCheckoutDetails('set-1')).rejects.toMatchObject({ code: 'response' });
});

test.each([400, 401, 403, 404, 429, 500])('normalizes HTTP %i without exposing server messages', async status => {
  fetchMock.mockResolvedValueOnce(response({ error: { code: 'ORDER_ERROR', message: 'private server message' } }, status));
  await expect(getOrders()).rejects.toMatchObject({ status, serverCode: 'ORDER_ERROR', isRetryable: status === 429 || status >= 500 });
});

test.each([undefined, [], ['a', 'b'], '', '.', '..', 'bad/id', 'bad\\id', 'bad?query', ' spaced '])('rejects invalid checkout ID %j', productSetId => {
  expect(checkoutRouteSchema.safeParse({ productSetId }).success).toBe(false);
});

test('normalizes query keys and distinguishes all inputs', () => {
  expect(ordersKeys.list({})).toEqual(ordersKeys.list({ page: 0, pageSize: 20, sortDirection: 'desc' }));
  const base = JSON.stringify(ordersKeys.list({}));
  const changes: OrdersInput[] = [{ page: 1 }, { pageSize: 500 }, { eventId: 'e' }, { productSetId: 's' }, { timeslotId: 't' }, { contactId: 'c' }, { purchaserId: 'p' }, { orderNumber: 'n' }, { orderStatus: 'paid' }, { type: 'booking' }, { status: false }, { refunded: false }, { isBoxOffice: true }, { sortDirection: 'asc' }];
  for (const input of changes) expect(JSON.stringify(ordersKeys.list(input))).not.toBe(base);
  expect(ordersKeys.checkout('one')).not.toEqual(ordersKeys.checkout('two'));
  expect(ordersInputSchema.safeParse({ pageSize: 501 }).success).toBe(false);
  expect(ordersInputSchema.safeParse({ refunded: 'false' }).success).toBe(false);
});

test('formats only documented monetary units and provides safe currency fallbacks', () => {
  expect(orderMoney(5250, 'CAD')).toContain('52.50'); expect(orderMoney(5250, 'CAD')).toContain('CAD');
  expect(orderMoney(0, 'usd')).toContain('USD');
  expect(orderMoney(5250)).toBe('5250 cents (currency unavailable)');
  expect(orderMoney(5250, 'invalid')).toBe('5250 cents (currency unavailable)');
  expect(fieldLabel('productsByType')).toBe('Products By Type');
});
