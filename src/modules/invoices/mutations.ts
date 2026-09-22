import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ApiError } from '@/lib/api-client';
import { getApiSessionVersion } from '@/lib/api-session';
import { createInvoice, deleteInvoice, finalizeInvoice, recordInvoicePayment, sendInvoice, updateInvoice, voidInvoice } from './api';
import { invoicesKeys } from './queries';
import type { CreateInvoice, InvoicePayment, UpdateInvoice } from './schemas';

export type InvoiceAction =
  | { type: 'create'; input: CreateInvoice }
  | { type: 'update'; id: string; input: UpdateInvoice }
  | { type: 'delete'; id: string }
  | { type: 'finalize'; id: string; sendEmail: boolean }
  | { type: 'send'; id: string }
  | { type: 'void'; id: string; reason?: string }
  | { type: 'payment'; id: string; input: InvoicePayment };

export function useInvoiceMutation() {
  const client = useQueryClient();
  return useMutation({
    retry: false,
    networkMode: 'always',
    mutationFn: async (action: InvoiceAction) => {
      switch (action.type) {
        case 'create': return createInvoice(action.input);
        case 'update': return updateInvoice(action.id, action.input);
        case 'delete': return deleteInvoice(action.id);
        case 'finalize': return finalizeInvoice(action.id, { sendEmail: action.sendEmail });
        case 'send': return sendInvoice(action.id);
        case 'void': return voidInvoice(action.id, { reason: action.reason });
        case 'payment': return recordInvoicePayment(action.id, action.input);
      }
    },
    onMutate: async () => {
      const sessionVersion = getApiSessionVersion();
      await client.cancelQueries({ queryKey: invoicesKeys.all });
      return { sessionVersion };
    },
    onSuccess: async (invoice, action, context) => {
      if (context?.sessionVersion !== getApiSessionVersion()) return;
      if (action.type === 'delete') client.removeQueries({ queryKey: invoicesKeys.detail(action.id), exact: true });
      else client.setQueryData(invoicesKeys.detail(invoice.id), invoice);
      await client.invalidateQueries({ queryKey: invoicesKeys.lists });
    },
    onError: async (error, _action, context) => {
      if (context?.sessionVersion !== getApiSessionVersion()) return;
      if (error instanceof ApiError && ['conflict', 'network', 'timeout', 'response', 'server', 'not_found'].includes(error.code)) {
        await client.invalidateQueries({ queryKey: invoicesKeys.all });
      }
    },
  });
}
