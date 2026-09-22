import { z } from 'zod';
import { ApiError } from '@/lib/api-client';
import { buildFilterGroup, groupDraftSchema } from '@/lib/filter-builder';
import type { ListState, FilterField } from '@/components/ui';
import { checkoutsInputSchema } from './schemas';

export const checkoutSortLabels = { name: 'Name', description: 'Description', createdAt: 'Created date', updatedAt: 'Updated date', status: 'Status', visibility: 'Visibility', productsCount: 'Product count', _id: 'Checkout ID', event: 'Event', form: 'Form' };
export const checkoutFilterFields: FilterField[] = [
  { value: 'name', label: 'Name', type: 'text' }, { value: 'description', label: 'Description', type: 'text' },
  { value: 'status', label: 'Status', type: 'select' }, { value: 'visibility', label: 'Visibility', type: 'select' },
  { value: 'createdAt', label: 'Created date', type: 'date' }, { value: 'updatedAt', label: 'Updated date', type: 'date' },
  { value: 'availableFrom', label: 'Available from', type: 'date' }, { value: 'availableTo', label: 'Available until', type: 'date' },
  { value: 'maxTicketsPerOrder', label: 'Tickets per order', type: 'number' }, { value: 'maxTicketsPerSet', label: 'Tickets per checkout', type: 'number' },
];
export function checkoutFilterDrafts(value?: string) { return value ? z.array(groupDraftSchema).parse(JSON.parse(value)) : []; }
export function checkoutListInput(controls: ListState) {
  const groups = checkoutFilterDrafts(controls.filters.advanced);
  return checkoutsInputSchema.parse({ pageNumber: controls.page - 1, pageSize: controls.pageSize, search: controls.search,
    status: controls.primaryFilter === 'all' ? undefined : controls.primaryFilter, eventId: controls.filters.eventId || undefined,
    timeslotId: controls.filters.timeslotId?.trim() || undefined, sortField: controls.sortField, sortDirection: controls.sortDirection,
    filters: groups.length ? groups.map(buildFilterGroup) : undefined });
}
export function checkoutFilterError(controls: ListState) {
  try { checkoutListInput(controls); return undefined; }
  catch (error) { return error instanceof z.ZodError ? 'Check your filter values.' : error instanceof Error ? error.message : 'Check your filter values.'; }
}
export function checkoutErrorMessage(error: unknown) {
  if (error instanceof ApiError) return error.code === 'not_found' ? 'This checkout could not be found or is no longer available.' : error.message;
  return 'Unable to load checkouts. Please try again.';
}
export function checkoutDate(value?: string, timeZone?: string) {
  if (!value) return undefined;
  try { return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short', timeZone: timeZone || 'UTC' }).format(new Date(value)); }
  catch { return value; }
}
