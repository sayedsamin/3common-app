import { useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { ApiError } from '@/lib/api-client';
import type { Contact } from '@/modules/crm';
import { invoiceFormField, invoiceFormPayload, invoiceFormValues, type InvoiceFormValues } from './form-schemas';
import { useInvoiceMutation } from './mutations';
import { createInvoiceSchema, invoicesInputSchema, type Invoice, type InvoicesInput } from './schemas';
import { invoicesQueryOptions } from './queries';
import { invoiceErrorMessage } from './utils';

export function useInvoicesList() {
  const [input, setInput] = useState<InvoicesInput>({ page: 0, pageSize: 20 });
  const query = useQuery(invoicesQueryOptions(input));
  return { input: invoicesInputSchema.parse(input), setInput, query };
}
export function useInvoiceForm(invoice: Invoice | undefined, onSaved: (id: string) => void) {
  const form = useForm<InvoiceFormValues>({ defaultValues: invoiceFormValues(invoice) });
  const mutation = useInvoiceMutation();
  const [error, setError] = useState<string>();
  const lock = useRef(false);
  const submit = () => form.handleSubmit(async values => {
    if (lock.current) return;
    lock.current = true;
    setError(undefined);
    form.clearErrors();
    try {
      const payload = invoiceFormPayload(values, invoice);
      const saved = await mutation.mutateAsync(invoice
        ? { type: 'update', id: invoice.id, input: payload }
        : { type: 'create', input: createInvoiceSchema.parse(payload) });
      form.reset(values);
      onSaved(saved.id);
    } catch (failure) {
      if (failure instanceof z.ZodError) for (const issue of failure.issues) {
        const field = invoiceFormField(issue.path.join('.'));
        if (field) form.setError(field, { message: issue.message });
      }
      if (failure instanceof ApiError && failure.code === 'validation') {
        const fields = z.record(z.string(), z.union([z.string(), z.array(z.string())])).safeParse(failure.details?.fieldErrors ?? failure.details?.fields ?? failure.details);
        if (fields.success) for (const [path, message] of Object.entries(fields.data)) {
          const field = invoiceFormField(path);
          if (field) form.setError(field, { message: typeof message === 'string' ? message : message.join(' ') });
        }
      }
      setError(failure instanceof z.ZodError ? failure.issues.filter(issue => !invoiceFormField(issue.path.join('.'))).map(issue => issue.message).join('\n') || 'Check the highlighted fields.'
        : failure instanceof ApiError ? ['network', 'timeout', 'response', 'server'].includes(failure.code)
          ? 'The save could not be confirmed. Your entries are kept here. Check your invoices before trying again.' : invoiceErrorMessage(failure)
          : failure instanceof Error ? failure.message : invoiceErrorMessage(failure));
    } finally { lock.current = false; }
  })();
  function selectCustomer(contact: Contact) {
    const snapshot = { customerId: contact.id, customerEmail: contact.billingEmail?.trim() || contact.email,
      customerFirstName: contact.firstName, customerLastName: contact.lastName, customerPhone: contact.phone ?? '' };
    for (const key of ['customerId', 'customerEmail', 'customerFirstName', 'customerLastName', 'customerPhone'] as const) {
      form.setValue(key, snapshot[key], { shouldDirty: true, shouldTouch: true });
      form.clearErrors(key);
    }
  }
  return { form, submit, mutation, error, selectCustomer };
}
