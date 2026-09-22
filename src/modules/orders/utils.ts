import { ApiError } from '@/lib/api-client';
import type { JsonRecord } from './schemas';

export function orderMoney(amount: number, currency?: string) {
  if (!currency || !/^[a-z]{3}$/i.test(currency)) return `${amount} cents (currency unavailable)`;
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: currency.toUpperCase(), currencyDisplay: 'code' }).format(amount / 100);
}
export function fieldLabel(key: string) {
  const label = key.replace(/[_-]+/g, ' ').replace(/([a-z0-9])([A-Z])/g, '$1 $2').trim();
  return label ? label.charAt(0).toUpperCase() + label.slice(1) : 'Unnamed field';
}
export function recordLabel(record: JsonRecord, fallback: string) {
  for (const key of ['name', 'productName', 'customerName', 'orderNumber', 'email', 'productSetId', 'id', '_id']) {
    const value = record[key];
    if (typeof value === 'string' && value.trim()) return value;
  }
  return fallback;
}
export function orderErrorMessage(error: unknown) {
  return error instanceof ApiError ? error.message : 'Unable to load orders. Please try again.';
}
