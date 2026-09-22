import { ApiError, apiRequest } from '@/lib/api-client';
import { createInvoiceSchema, deleteInvoiceResponseSchema, finalizeInvoiceSchema, invoiceIdSchema, invoiceResponseSchema, invoicesInputSchema, invoicesResponseSchema, paymentSchema, updateInvoiceSchema, voidInvoiceSchema, type CreateInvoice, type InvoicePayment, type InvoicesInput, type UpdateInvoice } from './schemas';

const invoicePath = (id: string) => `invoices/${encodeURIComponent(invoiceIdSchema.parse(id))}`;
export async function getInvoices(input: InvoicesInput = {}, signal?: AbortSignal) {
  const values = invoicesInputSchema.parse(input);
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) if (value !== undefined) params.set(key, String(value));
  const result = invoicesResponseSchema.safeParse(await apiRequest(`invoices/?${params}`, { signal }));
  if (!result.success) throw new ApiError('response', 'The invoices response could not be read. Please refresh.');
  return result.data;
}
async function requestInvoice(path: string, options?: RequestInit, id?: string) {
  const result = invoiceResponseSchema.safeParse(await apiRequest(path, options));
  if (!result.success || (id !== undefined && result.data.data.id !== id)) throw new ApiError('response', 'The invoice response could not be read. Refresh before trying again.');
  return result.data.data;
}
function json(method: 'POST' | 'PATCH', body: unknown): RequestInit {
  return { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) };
}
export function getInvoice(id: string, signal?: AbortSignal) {
  return requestInvoice(invoicePath(id), { signal }, invoiceIdSchema.parse(id));
}
export function createInvoice(input: CreateInvoice) {
  return requestInvoice('invoices/', json('POST', createInvoiceSchema.parse(input)));
}
export function updateInvoice(id: string, input: UpdateInvoice) {
  return requestInvoice(invoicePath(id), json('PATCH', updateInvoiceSchema.parse(input)), invoiceIdSchema.parse(id));
}
export async function deleteInvoice(id: string) {
  const result = deleteInvoiceResponseSchema.safeParse(await apiRequest(invoicePath(id), { method: 'DELETE' }));
  if (!result.success || result.data.data.id !== invoiceIdSchema.parse(id)) throw new ApiError('response', 'The delete response could not be read. Refresh your invoices.');
  return result.data.data;
}
export function finalizeInvoice(id: string, input: { sendEmail?: boolean } = {}) {
  const { sendEmail } = finalizeInvoiceSchema.parse(input);
  return requestInvoice(`${invoicePath(id)}/finalize${sendEmail === undefined ? '' : `?sendEmail=${sendEmail}`}`, { method: 'POST' }, invoiceIdSchema.parse(id));
}
export function sendInvoice(id: string) {
  return requestInvoice(`${invoicePath(id)}/send`, { method: 'POST' }, invoiceIdSchema.parse(id));
}
export function voidInvoice(id: string, input: { reason?: string } = {}) {
  return requestInvoice(`${invoicePath(id)}/void`, json('POST', voidInvoiceSchema.parse(input)), invoiceIdSchema.parse(id));
}
export function recordInvoicePayment(id: string, input: InvoicePayment) {
  return requestInvoice(`${invoicePath(id)}/payments`, json('POST', paymentSchema.parse(input)), invoiceIdSchema.parse(id));
}
