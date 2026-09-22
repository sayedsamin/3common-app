import type { Contact, ContactActivity, UpdateContact } from './schemas';
export const contact: Contact = { id: 'contact-1', firstName: 'Alex', lastName: 'River', fullName: 'Alex River', email: 'alex@example.com',
  billingEmail: 'billing@example.com', phone: '5551234567', vendorId: 'vendor-1', orderSum: 3, grossSum: 120,
  status: 'unknown', eventsAttended_IDS: ['event-1'], itemsPurchased_IDS: [], productsPurchased_IDS: [] };
export const updatedContact = { _id: contact.id, firstName: contact.firstName, lastName: contact.lastName, fullName: contact.fullName,
  email: contact.email, vendorId: contact.vendorId, orderSum: contact.orderSum, grossSum: contact.grossSum, status: contact.status,
  phone: null, mostRecentOrder: '2026-09-01T12:00:00Z', events_attended: ['event-1'], items_purchased: [], products_purchased: [] };
export const patch: UpdateContact = { contact: { firstName: 'Alex', lastName: 'River', email: contact.email, status: 'unknown' } };
export const activity: ContactActivity = { _id: 'activity-1', vendor_id: contact.vendorId, email: contact.email, contact_id: contact.id,
  type: 'email_sent', data: { arbitrary: { value: 7 } }, createdAt: '2026-09-01T12:00:00Z', updatedAt: '2026-09-01T12:00:00Z' };
export function response(data: unknown, status = 200) { return new Response(JSON.stringify(data), { status }); }
export function page<T>(data: T[], pageNumber = 0, hasMore = false) { return { data, pageNumber, pageSize: 20, hasMore }; }
