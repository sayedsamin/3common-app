import type { Checkout, CheckoutListItem } from './schemas';
export const checkoutId = 'abcdef0123456789abcdef01';
export const checkout: Checkout = {
  id: checkoutId, ownerId: 'workspace-1', name: 'Community passes', description: 'Admission and extras for the community evening.', status: 'open', visibility: 'public',
  createdAt: '2026-09-01T12:00:00Z', updatedAt: '2026-09-02T12:00:00Z', eventId: 'event-1', timeslotId: 'slot-1', orderFormId: 'form-1',
  availableFrom: '2026-09-01T12:00:00Z', availableTo: '2026-10-01T12:00:00Z', availabilityTimezone: 'America/Winnipeg',
  maxTicketsPerOrder: 4, maxTicketsPerSet: 100, paymentMethods: ['card', 'pay_by_invoice'], disableConfirmationEmail: false, payButtonLabel: 'Reserve passes',
  payByInvoice: { enabled: true, memo: 'Thanks for joining us.', dueInDays: 14, taxIds: [{ type: 'Tax number', value: 'test-tax-id' }] },
  products: [{ productId: 'product-1', quantity: 0, visibility: 'visible', dependents: [{ productId: 'dependent-1', minPerOrder: 0, maxPerOrder: 2, priceMode: 'paid', price: 250,
    includeOrgTaxes: false, customFees: [{ name: 'Handling', rate: 5, isFixedValue: true, includeInServiceFee: false }] }] }],
};
export const checkoutListItem: CheckoutListItem = { ...checkout, productsCount: 1, isEventSet: false, eventName: 'Community night', formName: 'Guest information' };
export function response(value: unknown, status = 200) { return new Response(JSON.stringify(value), { status }); }
export function page<T>(data: T[], pageNumber = 0, hasMore = false) { return { data, hasMore, pageNumber, pageSize: 50 }; }
