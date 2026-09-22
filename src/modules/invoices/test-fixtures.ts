import type { Invoice } from './schemas';

export const invoice: Invoice = {
  id: 'invoice-1', customerId: 'customer-1', customerEmail: 'customer@example.com', customerFirstName: 'Jamie',
  currency: 'CAD', status: 'draft', number: null,
  lineItems: [{ description: 'Admission', quantity: 2, unitAmount: 1000, taxAmount: 100, productId: 'product-1', productType: 'bundle',
    components: [{ productId: 'ticket-1', productName: 'Admission ticket', seatingInformation: { sectionId: 'A', seatId: '12' }, willCall: true }], eventId: 'event-1' }],
  subtotal: 2000, taxTotal: 100, total: 2100, amountPaid: 0, amountDue: 2100, autoCharge: false, payments: [], taxIds: [],
};
export const response = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status });
