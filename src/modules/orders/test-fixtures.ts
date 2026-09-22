import type { CheckoutDetails, Order } from './schemas';

export const order: Order = { id: 'order-1', customerName: 'Alex River', firstName: 'Alex', lastName: 'River', email: 'alex@example.com',
  date: '2026-10-01T18:00:00Z', type: 'ticket', amount: 5250, quantity: 2, status: true, orderStatus: 'completed',
  currency: 'CAD', discount: 0, fees: 250, eventId: 'event-1', product_set_id: 'set-1', refunded: false, isBoxOffice: true,
  promos: ['WELCOME'], paymentMethod: 'card', walletLink: 'javascript:alert(1)' };
export const checkout: CheckoutDetails = {
  products: { mode: 'product-set', data: [{ productSetId: 'set-1', productsByType: { ticket: [{ name: 'Admission', custom: { seating: ['A1', 'A2'] } }] } }], inventoryByProductId: { 'product-1': { remaining: 12, reserved: 0, customFlag: false } } },
  orders: [{ _id: 'raw-order-1', arbitraryAmount: 5250, metadata: null }], tickets: [{ _id: 'ticket-1', holder: 'Alex River', extra: '<b>Untrusted markup</b>' }],
};
export const response = (value: unknown, status = 200) => new Response(JSON.stringify(value), { status });
