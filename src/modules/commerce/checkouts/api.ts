import { ApiError, apiRequest } from '@/lib/api-client';
import { checkoutIdSchema, checkoutResponseSchema, checkoutsInputSchema, checkoutsResponseSchema, type CheckoutsInput } from './schemas';

export async function getCheckouts(input: CheckoutsInput = {}, signal?: AbortSignal) {
  const values = checkoutsInputSchema.parse(input);
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) {
    if (value !== undefined && value !== '') params.set(key, key === 'filters' ? JSON.stringify(value) : String(value));
  }
  const result = checkoutsResponseSchema.safeParse(await apiRequest(`checkouts/?${params}`, { signal }));
  if (!result.success) throw new ApiError('response', 'The checkouts response could not be read. Please refresh.');
  return result.data;
}
export async function getCheckout(checkoutId: string, signal?: AbortSignal) {
  const id = checkoutIdSchema.parse(checkoutId);
  const result = checkoutResponseSchema.safeParse(await apiRequest(`checkouts/${id}`, { signal }));
  if (!result.success || result.data.checkout.id !== id) throw new ApiError('response', 'The checkout details could not be read. Please refresh.');
  return result.data.checkout;
}
