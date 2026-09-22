import { queryOptions } from '@tanstack/react-query';
import { getCheckout, getCheckouts } from './api';
import { checkoutIdSchema, checkoutsInputSchema, type CheckoutsInput } from './schemas';

export const checkoutsKeys = {
  all: ['commerce-checkouts'] as const,
  list: (input: CheckoutsInput) => ['commerce-checkouts', 'list', checkoutsInputSchema.parse(input)] as const,
  detail: (id: string) => ['commerce-checkouts', 'detail', checkoutIdSchema.parse(id)] as const,
};
export function checkoutsQueryOptions(input: CheckoutsInput = {}) { return queryOptions({ queryKey: checkoutsKeys.list(input), queryFn: ({ signal }) => getCheckouts(input, signal), staleTime: 30_000 }); }
export function checkoutQueryOptions(id: string) { return queryOptions({ queryKey: checkoutsKeys.detail(id), queryFn: ({ signal }) => getCheckout(id, signal), staleTime: 30_000 }); }
