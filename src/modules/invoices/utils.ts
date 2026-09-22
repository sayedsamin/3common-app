import { ApiError } from '@/lib/api-client';
import type { Invoice } from './schemas';

export function decimalToCents(value: string): number | undefined {
  const normalized = value.trim();
  if (!/^\d+(?:\.\d{1,2})?$/.test(normalized)) return undefined;
  const [whole, fraction = ''] = normalized.split('.');
  const cents = BigInt(whole) * 100n + BigInt(fraction.padEnd(2, '0'));
  return cents <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(cents) : undefined;
}
export function centsToDecimal(value: number | undefined): string {
  if (value === undefined) return '';
  const cents = BigInt(value);
  return `${cents / 100n}.${String(cents % 100n).padStart(2, '0')}`;
}
export function invoiceMoney(value: number | undefined, currency: Invoice['currency']) {
  if (value === undefined || currency === undefined) return 'Unavailable';
  return new Intl.NumberFormat(undefined, { style: 'currency', currency, currencyDisplay: 'code' }).format(value / 100);
}
export function invoiceErrorMessage(error: unknown) {
  return error instanceof ApiError ? error.message : 'Check your information and try again.';
}
export function invoiceActions(invoice: Invoice) {
  return {
    canEdit: invoice.status === 'draft',
    canDelete: invoice.status === 'draft',
    canFinalize: invoice.status === 'draft',
    canVoid: invoice.status === 'draft' || invoice.status === 'open',
    canSend: Boolean(invoice.customerEmail?.trim()) && (invoice.status === 'open' || invoice.status === 'payment_failed' || invoice.status === 'paid'),
    canPay: invoice.status === 'open',
  };
}
