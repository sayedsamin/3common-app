import { z } from 'zod';

// Public, platform-neutral wire contracts shared with the Lambda package.
const id = z.string().min(1).max(200).regex(/^[^\s/\\?#]+$/).refine(v => v !== '.' && v !== '..');
const text = z.string().max(4000);
const date = z.iso.datetime({ offset: true }).transform(value => new Date(value).toISOString());
export const operators = ['is_equal_to_any_of', 'is_not_equal_to_any_of', 'contains', 'contains_exactly', 'is_before', 'is_after', 'is_between', 'is_equal_to', 'is_not_equal_to', 'is_greater_than', 'is_greater_than_or_equal_to', 'is_less_than', 'is_less_than_or_equal_to', 'is_any_of', 'is_none_of', 'is_empty', 'is_not_empty'] as const;
const scalar = z.union([text, z.number().finite(), z.boolean()]);
export const conditionSchema = z.strictObject({ field: z.string().min(1).max(100), operator: z.enum(operators), value: z.union([scalar, z.array(scalar).max(100), z.strictObject({ start: scalar, end: scalar })]).optional() });
export const groupSchema = z.strictObject({ logic: z.enum(['and', 'or']), get conditions() { return z.array(z.union([conditionSchema, groupSchema])).min(1).max(50); } });
const filters = z.array(groupSchema).max(20).optional();
const paging = { page: z.number().int().min(0).max(100000).default(0), pageSize: z.number().int().min(1).max(100).default(20) };
export const eventQuerySchema = z.strictObject({ ...paging, search: text.default(''), status: z.enum(['draft', 'open', 'closed', 'unpublished', 'cancelled', 'postponed', 'schedule']).optional(), sortField: z.string().min(1).max(100).default('start'), sortDirection: z.enum(['asc', 'desc']).default('desc'), startAfter: date.optional(), startBefore: date.optional(), filters });
export const contactSortFields = ['mostRecentOrder', 'leastRecentOrder', 'orderSum', 'grossSum', 'email', 'firstName', 'lastName', 'fullName', 'phone', 'status', 'createdAt', 'updatedAt', 'events_attended', 'items_purchased', 'products_purchased'] as const;
export const contactQuerySchema = z.strictObject({ pageNumber: paging.page, pageSize: z.number().int().min(1).max(500).default(20), search: text.default(''), filter: z.enum(['all', 'opted-in', 'unknown', 'unsubscribed', 'imported']).optional(), sortField: z.union([z.enum(contactSortFields), z.string().regex(/^[a-fA-F0-9]{24}$/)]).default('mostRecentOrder'), sortDirection: z.enum(['asc', 'desc']).default('desc'), filters });
export const activityQuerySchema = z.strictObject({ id, pageNumber: paging.page, pageSize: paging.pageSize, filter: z.enum(['checkout_session_completed', 'product_set_checkout_session_completed', 'order_refunded', 'ticket_scanned', 'email_sent', 'invoice_paid', 'invoice_sent', 'invoice_send_failed', 'email_delivered', 'email_bounced']).optional(), sort: z.literal('oldest').optional() });
export const toolSchemas = { list_events: eventQuerySchema, event_details: z.strictObject({ id }), list_contacts: contactQuerySchema, contact_details: z.strictObject({ id }), contact_activity: activityQuerySchema };
export const querySchema = z.discriminatedUnion('tool', [
  z.strictObject({ tool: z.literal('list_events'), input: eventQuerySchema }),
  z.strictObject({ tool: z.literal('event_details'), input: toolSchemas.event_details }),
  z.strictObject({ tool: z.literal('list_contacts'), input: contactQuerySchema }),
  z.strictObject({ tool: z.literal('contact_details'), input: toolSchemas.contact_details }),
  z.strictObject({ tool: z.literal('contact_activity'), input: activityQuerySchema }),
]);
export type Query = z.infer<typeof querySchema>;
export const aiErrorSchema = z.object({ service: z.enum(['3common', 'OpenAI', 'chat']), code: z.enum(['credentials', 'quota', 'rate_limit', 'forbidden', 'validation', 'network', 'timeout', 'cancelled', 'response', 'server', 'configuration']), message: z.string().max(1000), retryAfterMs: z.number().min(0).max(86400000).optional() });
export type ChatError = z.infer<typeof aiErrorSchema>;
export const cardSchema = z.object({ id, kind: z.enum(['event', 'contact', 'activity']), title: z.string().max(1000), subtitle: z.string().max(2000), status: z.string().max(100).optional(), contactId: id.optional() });
export const resultSchema = z.object({ query: querySchema, cards: z.array(cardSchema).max(500), hasMore: z.boolean(), nextQuery: querySchema.optional() });
export type Result = z.infer<typeof resultSchema>;
export const chatRequestSchema = z.strictObject({ messages: z.array(z.strictObject({ role: z.enum(['user', 'assistant']), content: text })).min(1).max(12), timezone: z.string().max(100).refine(value => { try { new Intl.DateTimeFormat('en', { timeZone: value }); return true; } catch { return false; } }), context: z.array(querySchema).max(4).default([]) });
export const chatResponseSchema = z.object({ text: z.string().max(12000), results: z.array(resultSchema).max(4), error: aiErrorSchema.optional() });
export type ChatRequest = z.infer<typeof chatRequestSchema>;
export type ChatResponse = z.infer<typeof chatResponseSchema>;
