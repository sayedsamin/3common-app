import { z } from 'zod';
import { filterGroupSchema } from '@/lib/filter-builder';

export const checkoutIdSchema = z.string().regex(/^[a-f0-9]{24}$/);
export const checkoutRouteSchema = z.object({ checkoutId: checkoutIdSchema });
export const checkoutStatusSchema = z.enum(['open', 'closed']);
export const checkoutVisibilitySchema = z.enum(['private', 'public']);
export const checkoutSortSchema = z.enum(['name', 'description', 'createdAt', 'updatedAt', 'status', 'visibility', 'productsCount', '_id', 'event', 'form']);
const integer = z.number().int().min(Number.MIN_SAFE_INTEGER).max(Number.MAX_SAFE_INTEGER);
const timestamp = z.iso.datetime();
const customFeeSchema = z.object({
  id: z.string().optional(), name: z.string(), rate: z.number(), isCustomFee: z.boolean().optional(), isFixedValue: z.boolean().optional(),
  includeInServiceFee: z.boolean().optional(), defaultServiceFee: z.boolean().optional(), isOrgDefault: z.boolean().optional(),
});
const dependentSchema = z.object({
  productId: z.string(), minPerOrder: integer.optional(), maxPerOrder: integer.optional(), priceMode: z.enum(['free', 'paid', 'pwyc']).optional(),
  price: z.number().optional(), pwycMin: z.number().optional(), customFees: z.array(customFeeSchema).optional(), includeOrgTaxes: z.boolean().optional(),
});
export const checkoutProductSchema = z.object({
  productId: z.string(), quantity: integer.optional(), visibility: z.enum(['visible', 'conditional', 'hidden']), dependents: z.array(dependentSchema),
});
export const checkoutSchema = z.object({
  id: z.string(), ownerId: z.string(), name: z.string(), description: z.string().optional(), status: checkoutStatusSchema, visibility: checkoutVisibilitySchema,
  products: z.array(checkoutProductSchema), maxTicketsPerSet: z.number().optional(), maxTicketsPerOrder: z.number().optional(),
  eventId: z.string().optional(), timeslotId: z.string().optional(), orderFormId: z.string().optional(), redirectUrl: z.string().optional(),
  payByInvoice: z.object({ enabled: z.boolean(), memo: z.string().optional(), taxIds: z.array(z.object({ type: z.string(), value: z.string() })).optional(), dueInDays: integer.optional() }).optional(),
  paymentMethods: z.array(z.enum(['card', 'pay_by_invoice', 'pay_later'])).optional(), payButtonLabel: z.string().optional(), disableConfirmationEmail: z.boolean().optional(),
  availableFrom: timestamp.optional(), availableTo: timestamp.optional(), availabilityTimezone: z.string().optional(), createdAt: timestamp, updatedAt: timestamp,
});
export const checkoutListItemSchema = checkoutSchema.extend({
  productsCount: z.number(), eventName: z.string().optional(), eventImage: z.string().optional(), isEventSet: z.boolean(), formName: z.string().optional(),
});
export const checkoutsInputSchema = z.object({
  pageNumber: integer.min(0).default(0), pageSize: integer.min(1).max(200).default(50), search: z.string().trim().optional(),
  status: checkoutStatusSchema.optional(), eventId: z.string().trim().optional(), timeslotId: z.string().trim().optional(),
  sortField: checkoutSortSchema.default('createdAt'), sortDirection: z.enum(['asc', 'desc']).default('desc'), filters: z.array(filterGroupSchema).optional(),
});
export const checkoutsResponseSchema = z.object({ data: z.array(checkoutListItemSchema), hasMore: z.boolean(), pageNumber: integer.min(0), pageSize: integer.min(1) });
export const checkoutResponseSchema = z.object({ checkout: checkoutSchema });
export const checkoutImageUrlSchema = z.url().refine(value => { try { const url = new URL(value); return ['https:', 'http:'].includes(url.protocol) && !url.username && !url.password; } catch { return false; } });
export type Checkout = z.infer<typeof checkoutSchema>;
export type CheckoutListItem = z.infer<typeof checkoutListItemSchema>;
export type CheckoutProduct = z.infer<typeof checkoutProductSchema>;
export type CheckoutsInput = z.input<typeof checkoutsInputSchema>;
