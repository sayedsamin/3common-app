import { queryOptions } from '@tanstack/react-query';
import { getCheckoutDetails, getOrders } from './api';
import { ordersInputSchema, productSetIdSchema, type OrdersInput } from './schemas';

export const ordersKeys = {
  all: ['orders'] as const,
  list: (input: OrdersInput) => ['orders', 'list', ordersInputSchema.parse(input)] as const,
  checkout: (id: string) => ['orders', 'checkout', productSetIdSchema.parse(id)] as const,
};
export function ordersQueryOptions(input: OrdersInput = {}) {
  return queryOptions({ queryKey: ordersKeys.list(input), queryFn: ({ signal }) => getOrders(input, signal), staleTime: 30_000 });
}
export function checkoutQueryOptions(id: string) {
  return queryOptions({ queryKey: ordersKeys.checkout(id), queryFn: ({ signal }) => getCheckoutDetails(id, signal), staleTime: 30_000 });
}
