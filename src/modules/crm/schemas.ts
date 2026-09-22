import { z } from 'zod';

export const contactIdSchema = z.string().min(1).regex(/^[^\s/\\?#]+$/).refine(value => value !== '.' && value !== '..');
export const contactRouteSchema = z.object({ contactId: contactIdSchema });
export const contactStatusSchema = z.enum(['unsubscribed', 'opted-in', 'unknown', 'imported']);
const lifecycleSchema = z.enum(['deleted', ...contactStatusSchema.options]);
const timestamp = z.iso.datetime({ offset: true });
export const contactSchema = z.object({
  id: contactIdSchema, firstName: z.string(), lastName: z.string(), fullName: z.string(), email: z.string(),
  billingEmail: z.string().optional(), phone: z.string().optional(), vendorId: z.string(),
  orderSum: z.number(), grossSum: z.number(), firstOrder: z.number().optional(), lastOrder: z.number().optional(),
  createdAt: timestamp.optional(), status: contactStatusSchema,
  eventsAttended_IDS: z.array(z.string()), itemsPurchased_IDS: z.array(z.string()), productsPurchased_IDS: z.array(z.string()),
}).catchall(z.unknown());
export const updatedContactSchema = z.object({
  _id: contactIdSchema, email: z.string(), billingEmail: z.string().optional(), vendorId: z.string(),
  firstName: z.string(), lastName: z.string(), fullName: z.string(), phone: z.string().nullable().optional(),
  status: lifecycleSchema, grossSum: z.number(), orderSum: z.number(),
  leastRecentOrder: timestamp.optional(), mostRecentOrder: timestamp.optional(),
  events_attended: z.array(z.string()), items_purchased: z.array(z.string()), products_purchased: z.array(z.string()),
  properties: z.array(z.object({ property_id: z.string(), value: z.union([z.string(), z.array(z.string()), z.boolean(), z.number()]) })).optional(),
  createdAt: timestamp.optional(), updatedAt: timestamp.optional(),
});
export const contactSortSchema = z.enum(['mostRecentOrder', 'leastRecentOrder', 'orderSum', 'grossSum', 'email', 'firstName', 'lastName', 'fullName', 'phone', 'status', 'createdAt', 'updatedAt', 'events_attended', 'items_purchased', 'products_purchased']);
const conditionSchema = z.object({
  field: z.string().min(1),
  operator: z.enum(['is_equal_to_any_of', 'is_not_equal_to_any_of', 'contains', 'contains_exactly', 'is_before', 'is_after', 'is_between', 'is_equal_to', 'is_not_equal_to', 'is_greater_than', 'is_greater_than_or_equal_to', 'is_less_than', 'is_less_than_or_equal_to', 'is_any_of', 'is_none_of', 'is_empty', 'is_not_empty']),
  value: z.json().optional(),
});
export const contactFilterGroupSchema = z.object({
  logic: z.enum(['and', 'or']),
  get conditions() { return z.array(z.union([conditionSchema, contactFilterGroupSchema])); },
});
export const contactsInputSchema = z.object({
  pageNumber: z.number().int().min(0).default(0), pageSize: z.number().int().min(1).max(500).default(20),
  sortField: z.union([contactSortSchema, z.string().regex(/^[0-9a-fA-F]{24}$/)]).default('mostRecentOrder'),
  sortDirection: z.enum(['asc', 'desc']).default('desc'), filter: z.enum(['all', ...contactStatusSchema.options]).optional(),
  filters: z.array(contactFilterGroupSchema).optional(), search: z.string().trim().optional(),
});
export const createContactSchema = z.object({
  email: z.email(), billingEmail: z.email().optional(), firstName: z.string().optional(), lastName: z.string().optional(), phone: z.string().optional(),
});
export const updateContactSchema = z.object({
  contact: z.object({ firstName: z.string(), lastName: z.string(), email: z.email(), status: lifecycleSchema,
    billingEmail: z.union([z.email(), z.literal(''), z.null()]).optional(), phone: z.string().nullable().optional() }),
  mergeWith: contactIdSchema.optional(), resolution: z.enum(['safe-merge', 'overwrite-merge']).optional(),
}).refine(value => !value.mergeWith || Boolean(value.resolution), { path: ['resolution'], message: 'Choose a merge resolution.' });
export const activityTypeSchema = z.enum(['checkout_session_completed', 'product_set_checkout_session_completed', 'order_refunded', 'ticket_scanned', 'email_sent', 'invoice_paid', 'invoice_sent', 'invoice_send_failed', 'email_delivered', 'email_bounced']);
export const activityInputSchema = z.object({
  pageNumber: z.number().int().min(0).default(0), pageSize: z.number().int().min(1).max(100).default(20),
  filter: activityTypeSchema.optional(), sort: z.literal('oldest').optional(),
});
export const activitySchema = z.object({
  _id: z.string(), vendor_id: z.string(), email: z.string(), contact_id: z.string().optional(),
  type: activityTypeSchema, data: z.record(z.string(), z.unknown()), createdAt: timestamp, updatedAt: timestamp,
});
const pagination = { hasMore: z.boolean(), pageNumber: z.number().int().min(0), pageSize: z.number().int().min(1) };
export const contactsResponseSchema = z.object({ data: z.array(contactSchema), ...pagination });
export const contactResponseSchema = z.object({ data: contactSchema });
export const updateContactResponseSchema = z.object({ data: updatedContactSchema });
export const deleteContactResponseSchema = z.object({ data: z.object({ id: contactIdSchema }) });
export const activityResponseSchema = z.object({ data: z.array(activitySchema), ...pagination });
export const contactFormSchema = z.object({
  email: z.email('Enter a valid email address.').trim(), billingEmail: z.union([z.email('Enter a valid billing email.'), z.literal('')]),
  firstName: z.string().trim(), lastName: z.string().trim(), phone: z.string().trim(), status: contactStatusSchema,
});
export type Contact = z.infer<typeof contactSchema>;
export type ContactsInput = z.input<typeof contactsInputSchema>;
export type ActivityInput = z.input<typeof activityInputSchema>;
export type ContactActivity = z.infer<typeof activitySchema>;
export type CreateContact = z.infer<typeof createContactSchema>;
export type UpdateContact = z.infer<typeof updateContactSchema>;
export type ContactFormValues = z.infer<typeof contactFormSchema>;
