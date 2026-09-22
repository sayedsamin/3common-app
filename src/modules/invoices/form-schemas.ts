import { z } from 'zod';
import type { FieldPath } from 'react-hook-form';
import { createInvoiceSchema, updateInvoiceSchema, type Invoice } from './schemas';
import { centsToDecimal, decimalToCents } from './utils';

const amount = z.string().refine(value => decimalToCents(value) !== undefined, 'Enter a non-negative amount with at most two decimal places.');
const optionalDate = z.union([z.literal(''), z.iso.datetime({ offset: true })]);
export const invoiceFormSchema = z.object({
  customerId: z.string().trim().min(1, 'Select a customer.'),
  customerEmail: z.union([z.literal(''), z.email()]),
  customerFirstName: z.string(), customerLastName: z.string(), customerPhone: z.string(),
  currency: z.enum(['USD', 'CAD']), notes: z.string(), dueAt: optionalDate,
  subscriptionId: z.string(), quoteId: z.string(), autoCharge: z.boolean(),
  lineItems: z.array(z.object({
    sourceIndex: z.number().int().nonnegative().optional(),
    description: z.string().trim().min(1, 'Description is required.'),
    quantity: z.string().regex(/^\d+$/, 'Enter a positive whole quantity.').refine(value => Number.isSafeInteger(Number(value)) && Number(value) > 0, 'Enter a positive whole quantity.'),
    unitAmount: amount, taxAmount: z.union([z.literal(''), amount]),
  })).min(1, 'Add at least one line item.'),
  taxIds: z.array(z.object({ type: z.string().trim().min(1, 'Tax ID type is required.'), value: z.string().trim().min(1, 'Tax ID value is required.') })),
});
export type InvoiceFormValues = z.infer<typeof invoiceFormSchema>;
export function invoiceFormField(path: string): FieldPath<InvoiceFormValues> | undefined {
  const top = invoiceFormSchema.keyof().safeParse(path);
  if (top.success) return top.data;
  const match = /^(lineItems|taxIds)\.(\d+)\.(\w+)$/.exec(path);
  if (!match) return undefined;
  const index = Number(match[2]);
  if (!Number.isSafeInteger(index)) return undefined;
  if (match[1] === 'lineItems') {
    const field = z.enum(['description', 'quantity', 'unitAmount', 'taxAmount']).safeParse(match[3]);
    if (field.success) return `lineItems.${index}.${field.data}`;
  } else {
    const field = z.enum(['type', 'value']).safeParse(match[3]);
    if (field.success) return `taxIds.${index}.${field.data}`;
  }
  return undefined;
}
export const paymentFormSchema = z.object({
  amount: amount.refine(value => (decimalToCents(value) ?? 0) > 0, 'Payment must be greater than zero.'),
  note: z.string(),
});
export function invoiceFormValues(invoice?: Invoice): InvoiceFormValues {
  return {
    customerId: invoice?.customerId ?? '', customerEmail: invoice?.customerEmail ?? '',
    customerFirstName: invoice?.customerFirstName ?? '', customerLastName: invoice?.customerLastName ?? '', customerPhone: invoice?.customerPhone ?? '',
    currency: invoice?.currency ?? 'USD', notes: invoice?.notes ?? '', dueAt: invoice?.dueAt ?? '',
    subscriptionId: invoice?.subscriptionId ?? '', quoteId: invoice?.quoteId ?? '', autoCharge: invoice?.autoCharge ?? false,
    lineItems: invoice?.lineItems?.map((line, sourceIndex) => ({ sourceIndex, description: line.description, quantity: String(line.quantity), unitAmount: centsToDecimal(line.unitAmount), taxAmount: centsToDecimal(line.taxAmount) })) ?? [{ description: '', quantity: '1', unitAmount: '', taxAmount: '' }],
    taxIds: invoice?.taxIds ?? [],
  };
}
export function invoiceFormPayload(raw: InvoiceFormValues, invoice?: Invoice) {
  const values = invoiceFormSchema.parse(raw);
  const initial = invoiceFormValues(invoice);
  if (invoice?.dueAt && !values.dueAt) throw new Error('The API does not support clearing a due date. Enter a date.');
  const lineItems = values.lineItems.map(line => {
    const original = line.sourceIndex === undefined ? undefined : invoice?.lineItems?.[line.sourceIndex];
    if (original?.taxAmount !== undefined && !line.taxAmount) throw new Error('Enter 0 to clear a line tax amount.');
    return { ...original, description: line.description, quantity: Number(line.quantity), unitAmount: decimalToCents(line.unitAmount), ...(line.taxAmount ? { taxAmount: decimalToCents(line.taxAmount) } : {}) };
  });
  const fields = {
    customerId: values.customerId,
    customerEmail: values.customerEmail, customerFirstName: values.customerFirstName,
    customerLastName: values.customerLastName, customerPhone: values.customerPhone,
    notes: values.notes, dueAt: values.dueAt ? new Date(values.dueAt).toISOString() : undefined,
    lineItems, taxIds: values.taxIds,
  };
  if (!invoice) return createInvoiceSchema.parse({
    ...fields, currency: values.currency, autoCharge: values.autoCharge,
    subscriptionId: values.subscriptionId.trim() || undefined, quoteId: values.quoteId.trim() || undefined,
  });
  const changes: Record<string, unknown> = {};
  for (const key of ['customerId', 'customerEmail', 'customerFirstName', 'customerLastName', 'customerPhone', 'notes', 'dueAt', 'lineItems', 'taxIds'] as const) {
    if (JSON.stringify(values[key]) !== JSON.stringify(initial[key])) changes[key] = fields[key];
  }
  return updateInvoiceSchema.parse(changes);
}
