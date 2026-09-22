import { queryOptions } from '@tanstack/react-query';
import { getInvoice, getInvoices } from './api';
import { invoiceIdSchema, invoicesInputSchema, type InvoicesInput } from './schemas';

export const invoicesKeys = {
  all: ['invoices'] as const,
  lists: ['invoices', 'list'] as const,
  list: (input: InvoicesInput) => ['invoices', 'list', invoicesInputSchema.parse(input)] as const,
  detail: (id: string) => ['invoices', 'detail', invoiceIdSchema.parse(id)] as const,
};
export function invoicesQueryOptions(input: InvoicesInput = {}) {
  return queryOptions({ queryKey: invoicesKeys.list(input), queryFn: ({ signal }) => getInvoices(input, signal), staleTime: 30_000 });
}
export function invoiceQueryOptions(id: string) {
  return queryOptions({ queryKey: invoicesKeys.detail(id), queryFn: ({ signal }) => getInvoice(id, signal), staleTime: 30_000 });
}
