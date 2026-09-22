import { ApiError, apiRequest } from '@/lib/api-client';
import { checkoutResponseSchema, ordersInputSchema, ordersResponseSchema, productSetIdSchema, type OrdersInput } from './schemas';

export async function getOrders(input: OrdersInput = {}, signal?: AbortSignal) {
  const values = ordersInputSchema.parse(input);
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) if (value !== undefined) params.set(key, String(value));
  const result = ordersResponseSchema.safeParse(await apiRequest(`orders/?${params}`, { signal }));
  if (!result.success) throw new ApiError('response', 'The orders response could not be read. Please refresh.');
  return result.data;
}
export async function getCheckoutDetails(productSetId: string, signal?: AbortSignal) {
  const id = productSetIdSchema.parse(productSetId);
  const result = checkoutResponseSchema.safeParse(await apiRequest(`orders/checkout/${encodeURIComponent(id)}/details`, { signal }));
  if (!result.success) throw new ApiError('response', 'The checkout details could not be read. Please refresh.');
  return result.data.data;
}
