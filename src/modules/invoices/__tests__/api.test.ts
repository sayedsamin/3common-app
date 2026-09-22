import { setApiKey } from '@/lib/api-session';
import { createInvoice, deleteInvoice, finalizeInvoice, getInvoice, getInvoices, recordInvoicePayment, sendInvoice, updateInvoice, voidInvoice } from '../api';
import { createInvoiceSchema, invoiceRouteSchema, invoicesInputSchema, invoiceSchema, paymentSchema, updateInvoiceSchema } from '../schemas';
import { invoicesKeys } from '../queries';
import { decimalToCents, invoiceActions, invoiceMoney } from '../utils';
import { invoiceFormPayload, invoiceFormValues } from '../form-schemas';
import { invoice, response } from '../test-fixtures';

const fetchMock = jest.spyOn(globalThis, 'fetch');
beforeEach(() => { setApiKey('test-key'); fetchMock.mockReset().mockImplementation(async () => response({ data: invoice })); });
afterEach(() => { setApiKey(null); });

test('lists with every documented filter and zero-based pagination', async () => {
  fetchMock.mockResolvedValueOnce(response({ data: [invoice], hasMore: true }));
  const input = { page: 2, pageSize: 50, status: 'draft' as const, customerId: 'contact & name', subscriptionId: 'subscription-1', issuedAfter: '2026-01-01T00:00:00Z', issuedBefore: '2026-10-01T00:00:00Z', fields: 'id,status' };
  expect(await getInvoices(input)).toEqual({ data: [invoice], hasMore: true });
  const url = new URL(String(fetchMock.mock.calls[0]?.[0]));
  expect(url.pathname).toBe('/v1/invoices/');
  for (const [key, value] of Object.entries(input)) expect(url.searchParams.get(key)).toBe(String(value));
  expect(new Headers(fetchMock.mock.calls[0]?.[1]?.headers).get('Authorization')).toBe('Bearer test-key');
});

test('implements create, detail, patch, delete, finalize, send, void, and payments', async () => {
  const draft = createInvoiceSchema.parse({ customerId: 'customer-1', currency: 'CAD', lineItems: invoice.lineItems });
  await createInvoice(draft);
  await getInvoice(invoice.id);
  await updateInvoice(invoice.id, { notes: 'Updated' });
  fetchMock.mockResolvedValueOnce(response({ data: { id: invoice.id } }));
  await deleteInvoice(invoice.id);
  await finalizeInvoice(invoice.id, { sendEmail: true });
  await sendInvoice(invoice.id);
  await voidInvoice(invoice.id);
  await recordInvoicePayment(invoice.id, { payment: 1050, idempotencyKey: 'payment-1', note: 'Cash' });
  const calls = fetchMock.mock.calls.map(([url, options]) => ({ path: new URL(String(url)).pathname + new URL(String(url)).search, method: options?.method ?? 'GET', body: options?.body ? JSON.parse(String(options.body)) : undefined }));
  expect(calls).toEqual([
    { path: '/v1/invoices/', method: 'POST', body: draft },
    { path: '/v1/invoices/invoice-1', method: 'GET', body: undefined },
    { path: '/v1/invoices/invoice-1', method: 'PATCH', body: { notes: 'Updated' } },
    { path: '/v1/invoices/invoice-1', method: 'DELETE', body: undefined },
    { path: '/v1/invoices/invoice-1/finalize?sendEmail=true', method: 'POST', body: undefined },
    { path: '/v1/invoices/invoice-1/send', method: 'POST', body: undefined },
    { path: '/v1/invoices/invoice-1/void', method: 'POST', body: {} },
    { path: '/v1/invoices/invoice-1/payments', method: 'POST', body: { payment: 1050, idempotencyKey: 'payment-1', note: 'Cash' } },
  ]);
});

test('encodes IDs, supports read cancellation, and finalizes without sending by default', async () => {
  fetchMock.mockResolvedValueOnce(response({ data: { ...invoice, id: 'a&b' } }));
  await getInvoice('a&b');
  expect(String(fetchMock.mock.calls[0]?.[0])).toContain('/a%26b');
  const controller = new AbortController(); controller.abort();
  await expect(getInvoice(invoice.id, controller.signal)).rejects.toMatchObject({ code: 'cancelled' });
  await finalizeInvoice(invoice.id);
  expect(String(fetchMock.mock.calls.at(-1)?.[0])).toBe('https://api.3common.com/v1/invoices/invoice-1/finalize');
});

test('rejects malformed responses and mismatched identities', async () => {
  fetchMock.mockResolvedValueOnce(response({ data: [invoice] }));
  await expect(getInvoices()).rejects.toMatchObject({ code: 'response' });
  fetchMock.mockResolvedValueOnce(response({ data: { ...invoice, payments: [{ amount: '10' }] } }));
  await expect(getInvoice(invoice.id)).rejects.toMatchObject({ code: 'response' });
  for (const request of [getInvoice, deleteInvoice, sendInvoice]) {
    fetchMock.mockResolvedValueOnce(response({ data: { id: 'different' } }));
    await expect(request(invoice.id)).rejects.toMatchObject({ code: 'response' });
  }
  expect(invoiceSchema.parse({ id: 'minimal' })).toEqual({ id: 'minimal' });
});

test.each([400, 401, 403, 404, 409, 429, 500])('normalizes HTTP %i and does not retry writes', async status => {
  fetchMock.mockResolvedValueOnce(response({ error: { code: 'INVOICE_ERROR', message: 'private details' } }, status));
  await expect(sendInvoice(invoice.id)).rejects.toMatchObject({ status, serverCode: 'INVOICE_ERROR', isRetryable: false });
  expect(fetchMock).toHaveBeenCalledTimes(1);
});

test.each([undefined, [], ['one', 'two'], '', '.', '..', 'bad/id', 'bad\\id', 'bad?query', ' spaced '])('rejects invalid route ID %j', invoiceId => {
  expect(invoiceRouteSchema.safeParse({ invoiceId }).success).toBe(false);
});

test('separates every list filter and normalizes default keys', () => {
  expect(invoicesKeys.list({})).toEqual(invoicesKeys.list({ page: 0, pageSize: 20 }));
  const base = JSON.stringify(invoicesKeys.list({}));
  for (const input of [{ page: 1 }, { pageSize: 10 }, { status: 'open' as const }, { customerId: 'c' }, { subscriptionId: 's' }, { issuedAfter: '2026-01-01T00:00:00Z' }, { issuedBefore: '2026-02-01T00:00:00Z' }, { fields: 'id,status' }]) expect(JSON.stringify(invoicesKeys.list(input))).not.toBe(base);
  expect(invoicesInputSchema.safeParse({ pageSize: 101 }).success).toBe(false);
});

test('converts money without rounding, rejecting unsafe or malformed values', () => {
  expect(decimalToCents('0.29')).toBe(29);
  expect(decimalToCents('10.1')).toBe(1010);
  expect(decimalToCents('90071992547409.91')).toBe(Number.MAX_SAFE_INTEGER);
  for (const input of ['90071992547409.92', '1.001', '-1', '1e2', 'NaN', '', '1,000']) expect(decimalToCents(input)).toBeUndefined();
  expect(paymentSchema.safeParse({ payment: 0 }).success).toBe(false);
  expect(invoiceMoney(0, 'CAD')).toContain('0.00');
  expect(invoiceMoney(5250, 'CAD')).toContain('CAD');
  expect(invoiceMoney(undefined, 'CAD')).toBe('Unavailable');
});

test('only sends changed draft fields and preserves nested metadata when removing/reordering lines', () => {
  const original = { ...invoice, lineItems: [...(invoice.lineItems ?? []), { description: 'Second', quantity: 1, unitAmount: 100, productId: 'second-product' }] };
  const values = invoiceFormValues(original);
  expect(invoiceFormPayload({ ...values, notes: 'New notes' }, original)).toEqual({ notes: 'New notes' });
  const second = values.lineItems[1];
  if (!second) throw new Error('Missing fixture');
  expect(invoiceFormPayload({ ...values, lineItems: [{ ...second, description: 'Changed' }] }, original)).toEqual({ lineItems: [{ description: 'Changed', quantity: 1, unitAmount: 100, productId: 'second-product' }] });
  const first = values.lineItems[0];
  if (!first) throw new Error('Missing fixture');
  const patch = invoiceFormPayload({ ...values, lineItems: [{ ...first, quantity: '3' }] }, original);
  expect(patch.lineItems?.[0]).toEqual({ ...invoice.lineItems?.[0], quantity: 3 });
  expect(() => invoiceFormPayload(values, original)).toThrow('Change at least one field');
});

test('enforces PATCH fields, validates forms, and normalizes dates', () => {
  for (const input of [{ currency: 'USD' }, { autoCharge: true }, { subscriptionId: 's' }, { quoteId: 'q' }, { lineItems: [] }]) expect(updateInvoiceSchema.safeParse(input).success).toBe(false);
  const values = invoiceFormValues(invoice);
  expect(invoiceFormPayload({ ...values, dueAt: '2026-10-01T12:00:00-05:00' }, invoice)).toEqual({ dueAt: '2026-10-01T17:00:00.000Z' });
  expect(() => invoiceFormPayload({ ...values, dueAt: '' }, { ...invoice, dueAt: '2026-10-01T17:00:00Z' })).toThrow('does not support clearing');
  expect(() => invoiceFormPayload({ ...values, lineItems: [] })).toThrow();
  expect(invoiceActions({ id: 'minimal' })).toEqual({ canEdit: false, canDelete: false, canFinalize: false, canVoid: false, canSend: false, canPay: false });
  expect(invoiceActions({ ...invoice, status: 'payment_failed' })).toMatchObject({ canPay: false, canVoid: false, canSend: true });
});
