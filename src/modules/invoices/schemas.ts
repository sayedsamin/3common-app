// Boundary schemas transcribed from api-docs/docs.invoices.json.
import { z } from 'zod';

export const invoiceIdSchema = z.string().min(1, 'Invoice ID is required.').regex(/^[^\s/\\?#]+$/, 'Invalid invoice ID.').refine(value => value !== '.' && value !== '..', 'Invalid invoice ID.');
export const invoiceRouteSchema = z.object({ invoiceId: invoiceIdSchema });
const seatingSchema = z.object({
  sectionId: z.string().optional(),
  rowId: z.string().optional(),
  seatId: z.string().optional(),
  seatReferenceId: z.string().optional(),
  sectionReferenceId: z.string().optional(),
  priceLevelId: z.string().optional(),
});

const bundleComponentSchema = z.object({
  productId: z.string(),
  productName: z.string(),
  productType: z.enum(['product','add-on','bundle','donation','event-ticket']).optional(),
  productImageUrl: z.string().optional(),
  eventId: z.string().optional(),
  eventImageUrl: z.string().optional(),
  eventName: z.string().optional(),
  eventStart: z.iso.datetime().optional(),
  eventEnd: z.iso.datetime().optional(),
  eventLocation: z.string().optional(),
  eventTimezone: z.string().optional(),
  seatingInformation: seatingSchema.optional(),
  disableQrCode: z.boolean().optional(),
  willCall: z.boolean().optional(),
});

const lineItemSchema = z.object({
  description: z.string(),
  quantity: z.number().int().min(1).max(9007199254740991),
  unitAmount: z.number().int().min(0).max(9007199254740991),
  productId: z.string().optional(),
  priceId: z.string().optional(),
  eventId: z.string().optional(),
  taxAmount: z.number().int().min(0).max(9007199254740991).optional(),
  productType: z.enum(['product','add-on','bundle','donation','event-ticket']).optional(),
  productName: z.string().optional(),
  components: z.array(bundleComponentSchema).optional(),
  disableQrCode: z.boolean().optional(),
  willCall: z.boolean().optional(),
  productImageUrl: z.string().optional(),
  eventName: z.string().optional(),
  eventImageUrl: z.string().optional(),
  eventStart: z.iso.datetime().optional(),
  eventEnd: z.iso.datetime().optional(),
  eventLocation: z.string().optional(),
  eventTimezone: z.string().optional(),
  seatingInformation: seatingSchema.optional(),
  inventoryConsumedAt: z.iso.datetime().optional(),
});

const taxIdSchema = z.object({
  type: z.string(),
  value: z.string(),
});

const refundSchema = z.object({
  id: z.string(),
  amount: z.number().int().min(0).max(9007199254740991),
  refundedAt: z.iso.datetime(),
  idempotencyKey: z.string().optional(),
  reason: z.string().optional(),
  note: z.string().optional(),
  externalRefundId: z.string().optional(),
  ledgerEntryId: z.string().optional(),
});

const invoicePaymentRecordSchema = z.object({
  id: z.string(),
  status: z.enum(['succeeded','failed']),
  amount: z.number().int().min(0).max(9007199254740991),
  paidAt: z.iso.datetime(),
  idempotencyKey: z.string().optional(),
  note: z.string().optional(),
  externalId: z.string().optional(),
  chargeId: z.string().optional(),
  failureCode: z.string().optional(),
  failureMessage: z.string().optional(),
  refunds: z.array(refundSchema).optional(),
});

export const invoiceSchema = z.object({
  id: z.string().optional(),
  hostId: z.string().optional(),
  customerId: z.string().optional(),
  customerEmail: z.string().optional(),
  customerFirstName: z.string().optional(),
  customerLastName: z.string().optional(),
  customerPhone: z.string().optional(),
  number: z.union([z.string(), z.null()]).optional(),
  currency: z.enum(['USD','CAD']).optional(),
  lineItems: z.array(lineItemSchema).optional(),
  payments: z.array(invoicePaymentRecordSchema).optional(),
  subtotal: z.number().int().min(-9007199254740991).max(9007199254740991).optional(),
  taxTotal: z.number().int().min(-9007199254740991).max(9007199254740991).optional(),
  total: z.number().int().min(-9007199254740991).max(9007199254740991).optional(),
  amountPaid: z.number().int().min(-9007199254740991).max(9007199254740991).optional(),
  amountDue: z.number().int().min(-9007199254740991).max(9007199254740991).optional(),
  status: z.enum(['draft','open','payment_failed','paid','void']).optional(),
  autoCharge: z.boolean().optional(),
  notes: z.string().optional(),
  taxIds: z.array(taxIdSchema).optional(),
  issuedAt: z.iso.datetime().optional(),
  dueAt: z.iso.datetime().optional(),
  paidAt: z.iso.datetime().optional(),
  voidedAt: z.iso.datetime().optional(),
  subscriptionId: z.string().optional(),
  quoteId: z.string().optional(),
  createdAt: z.iso.datetime().optional(),
  updatedAt: z.iso.datetime().optional(),
}).extend({ id: invoiceIdSchema });
export const createInvoiceSchema = z.object({
  customerId: z.string(),
  customerEmail: z.string().optional(),
  customerFirstName: z.string().optional(),
  customerLastName: z.string().optional(),
  customerPhone: z.string().optional(),
  currency: z.enum(['USD','CAD']),
  lineItems: z.array(lineItemSchema).min(1),
  notes: z.string().optional(),
  taxIds: z.array(taxIdSchema).optional(),
  dueAt: z.iso.datetime().optional(),
  subscriptionId: z.string().optional(),
  quoteId: z.string().optional(),
  autoCharge: z.boolean().optional(),
}).strict();
export const updateInvoiceSchema = z.object({
  customerId: z.string().optional(),
  customerEmail: z.string().optional(),
  customerFirstName: z.string().optional(),
  customerLastName: z.string().optional(),
  customerPhone: z.string().optional(),
  lineItems: z.array(lineItemSchema).min(1).optional(),
  notes: z.string().optional(),
  taxIds: z.array(taxIdSchema).optional(),
  dueAt: z.iso.datetime().optional(),
}).strict().refine(value => Object.values(value).some(field => field !== undefined), 'Change at least one field.');
export const invoiceStatusSchema = invoiceSchema.shape.status.unwrap();
export const invoiceResponseSchema = z.object({ data: invoiceSchema });
export const invoicesResponseSchema = z.object({ data: z.array(invoiceSchema), hasMore: z.boolean() });
export const deleteInvoiceResponseSchema = z.object({ data: z.object({ id: invoiceIdSchema }) });
export const voidInvoiceSchema = z.object({ reason: z.string().optional() }).strict();
export const paymentSchema = z.object({ payment: z.number().int().positive().max(Number.MAX_SAFE_INTEGER), idempotencyKey: z.string().optional(), note: z.string().optional() }).strict();
export const finalizeInvoiceSchema = z.object({ sendEmail: z.boolean().optional() }).strict();
const invoiceListFieldSchema = z.enum(['id', 'hostId', 'customerId', 'customerEmail', 'customerFirstName', 'customerLastName', 'customerPhone', 'number', 'currency', 'subtotal', 'taxTotal', 'total', 'amountPaid', 'amountDue', 'status', 'autoCharge', 'issuedAt', 'dueAt', 'paidAt', 'voidedAt', 'subscriptionId', 'quoteId', 'createdAt', 'updatedAt']);
const invoiceFieldsSchema = z.string().transform(value => value.split(',').map(field => field.trim()))
  .pipe(z.array(invoiceListFieldSchema).min(1))
  // Every returned record needs an identity for caching and navigation.
  .transform(fields => [...new Set(fields.includes('id') ? fields : ['id', ...fields])].join(','));
export const invoicesInputSchema = z.object({
  page: z.number().int().min(0).default(0), pageSize: z.number().int().min(1).max(100).default(20),
  status: invoiceStatusSchema.optional(), customerId: z.string().optional(), subscriptionId: z.string().optional(),
  issuedAfter: z.iso.datetime().optional(), issuedBefore: z.iso.datetime().optional(), fields: invoiceFieldsSchema.optional(),
}).strict().refine(value => !value.issuedAfter || !value.issuedBefore || Date.parse(value.issuedAfter) <= Date.parse(value.issuedBefore), 'The issue start date must be before the end date.');
export type Invoice = z.infer<typeof invoiceSchema>;
export type CreateInvoice = z.infer<typeof createInvoiceSchema>;
export type UpdateInvoice = z.infer<typeof updateInvoiceSchema>;
export type InvoicesInput = z.input<typeof invoicesInputSchema>;
export type InvoicePayment = z.infer<typeof paymentSchema>;
