import { z } from 'zod';

export const productSetIdSchema = z.string().min(1).regex(/^[^\s/\\?#]+$/).refine(value => value !== '.' && value !== '..');
export const checkoutRouteSchema = z.object({ productSetId: productSetIdSchema });
export const orderSchema = z.object({
  id: productSetIdSchema,
  customerName: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string(),
  date: z.iso.datetime().optional(),
  type: z.enum(['booking','ticket','product']).optional(),
  amount: z.number(),
  quantity: z.number(),
  status: z.boolean(),
  orderStatus: z.enum(['pending','paid','processing','completed','cancelled','refunded']).optional(),
  paymentMethod: z.string().optional(),
  currency: z.string().optional(),
  discount: z.number(),
  fees: z.number(),
  promos: z.array(z.string()).optional(),
  refundedAmount: z.number().optional(),
  refLabel: z.string().optional(),
  walletLink: z.string().optional(),
  eventId: z.string(),
  refunded: z.boolean().optional(),
  cancelled: z.boolean().optional(),
  isBoxOffice: z.boolean().optional(),
  manuallyAdded: z.boolean().optional(),
  comped: z.boolean().optional(),
  latestCharge: z.string().optional(),
  disputeStatus: z.string().optional(),
  accessCodes: z.array(z.object({code: z.string(), benefitType: z.string().optional()})).optional(),
  product_set_id: z.string().optional(),
}).catchall(z.json().optional());
export const orderStatusSchema = orderSchema.shape.orderStatus.unwrap();
export const orderTypeSchema = orderSchema.shape.type.unwrap();
const optionalText = z.string().trim().transform(value => value || undefined).optional();
export const ordersInputSchema = z.object({
  page: z.number().int().min(0).default(0), pageSize: z.number().int().min(1).max(500).default(20),
  eventId: optionalText, productSetId: optionalText, timeslotId: optionalText, contactId: optionalText, purchaserId: optionalText, orderNumber: optionalText,
  orderStatus: orderStatusSchema.optional(), type: orderTypeSchema.optional(),
  status: z.boolean().optional(), refunded: z.boolean().optional(), isBoxOffice: z.boolean().optional(),
  sortDirection: z.enum(['asc', 'desc']).default('desc'),
}).strict();
export const ordersResponseSchema = z.object({ data: z.array(orderSchema), hasMore: z.boolean() });
export const jsonRecordSchema = z.record(z.string(), z.json());
export const checkoutDetailsSchema = z.object({
  products: z.object({ mode: z.literal('product-set'), data: z.array(jsonRecordSchema), inventoryByProductId: z.record(z.string(), jsonRecordSchema) }),
  tickets: z.array(jsonRecordSchema), orders: z.array(jsonRecordSchema),
});
export const checkoutResponseSchema = z.object({ data: checkoutDetailsSchema });
export type Order = z.infer<typeof orderSchema>;
export type OrdersInput = z.input<typeof ordersInputSchema>;
export type CheckoutDetails = z.infer<typeof checkoutDetailsSchema>;
export type JsonRecord = z.infer<typeof jsonRecordSchema>;
export type JsonValue = JsonRecord[string];
