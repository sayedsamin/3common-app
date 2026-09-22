import { z } from 'zod';

export const segmentIdSchema = z.string().regex(/^[a-f0-9]{24}$/, 'Enter a valid 24-character member or segment ID.');
export const segmentRouteSchema = z.object({ segmentId: segmentIdSchema });
export const targetTypeSchema = z.enum(['contact', 'order', 'ticket']);
export const segmentKindSchema = z.enum(['active', 'static']);
export const segmentStatusSchema = z.enum(['active', 'archived']);
export const segmentSortSchema = z.enum(['name', 'createdAt', 'updatedAt', 'lastRefreshedAt', 'memberCount', 'targetType']);
// Conditions are deliberately open in the API contract. Do not strip extensions.
export const segmentFilterSchema = z.object({ logic: z.enum(['and', 'or']), conditions: z.array(z.unknown()) }).catchall(z.unknown());
const filters = z.array(segmentFilterSchema);
const timestamp = z.iso.datetime();
export const segmentSchema = z.object({
  id: z.string(), ownerId: z.string(), name: z.string(), description: z.string().optional(),
  targetType: targetTypeSchema, kind: segmentKindSchema, filters,
  formId: z.string().optional(), folderId: z.string().optional(), status: segmentStatusSchema,
  trackMembershipEvents: z.boolean(), refreshIntervalMs: z.number().optional(),
  lastRefreshedAt: timestamp.optional(), refreshingUntil: timestamp.optional(), memberCount: z.number().optional(),
  createdAt: timestamp, updatedAt: timestamp,
});
const paginationInput = {
  pageNumber: z.number().int().min(0).max(Number.MAX_SAFE_INTEGER).default(0),
  pageSize: z.number().int().min(1).max(200).default(20),
};
export const segmentsInputSchema = z.object({
  ...paginationInput, sortField: segmentSortSchema.default('createdAt'), sortDirection: z.enum(['asc', 'desc']).default('desc'),
  search: z.string().trim().optional(), targetType: targetTypeSchema.optional(),
  folderId: z.union([segmentIdSchema, z.literal('unfiled')]).optional(), status: segmentStatusSchema.optional(), filters: filters.optional(),
});
export const segmentMembersInputSchema = z.object({
  ...paginationInput, sortField: z.string().min(1).default('joinedAt'), sortDirection: z.enum(['asc', 'desc']).default('desc'), search: z.string().trim().optional(),
});
export const segmentsByMemberInputSchema = z.object({ memberId: segmentIdSchema, targetType: targetTypeSchema.optional() });
const writable = {
  name: z.string().trim().min(1, 'Enter a segment name.'), description: z.string(), filters: filters.min(1, 'Add at least one filter group.'),
  folderId: segmentIdSchema, trackMembershipEvents: z.boolean(), refreshIntervalMs: z.number().int().min(60_000).max(Number.MAX_SAFE_INTEGER),
};
export const createSegmentSchema = z.strictObject({
  ...writable, description: writable.description.optional(), folderId: writable.folderId.optional(), refreshIntervalMs: writable.refreshIntervalMs.optional(),
  trackMembershipEvents: writable.trackMembershipEvents.default(true), status: segmentStatusSchema.default('active'),
  targetType: targetTypeSchema, kind: segmentKindSchema, formId: segmentIdSchema.optional(),
});
export const updateSegmentSchema = z.strictObject(writable).partial();
const pagination = { hasMore: z.boolean(), pageNumber: z.number().int().nonnegative(), pageSize: z.number().int().positive() };
export const segmentsResponseSchema = z.object({ data: z.array(segmentSchema), ...pagination });
export const segmentResponseSchema = z.object({ segment: segmentSchema });
export const segmentsByMemberResponseSchema = z.object({ segments: z.array(segmentSchema) });
export const segmentMemberSchema = z.object({ segmentId: z.string(), memberId: z.string(), joinedAt: timestamp }).catchall(z.unknown());
export const segmentMembersResponseSchema = z.object({ data: z.array(segmentMemberSchema), ...pagination });
export const deleteSegmentResponseSchema = z.object({ id: segmentIdSchema, deleted: z.boolean() });
export const addMemberResponseSchema = z.object({ inserted: z.boolean(), memberCount: z.number() });
export const removeMemberResponseSchema = z.object({ removed: z.boolean(), memberCount: z.number() });
export type Segment = z.infer<typeof segmentSchema>;
export type SegmentMember = z.infer<typeof segmentMemberSchema>;
export type SegmentFilter = z.infer<typeof segmentFilterSchema>;
export type TargetType = z.infer<typeof targetTypeSchema>;
export type SegmentsInput = z.input<typeof segmentsInputSchema>;
export type SegmentMembersInput = z.input<typeof segmentMembersInputSchema>;
export type SegmentsByMemberInput = z.infer<typeof segmentsByMemberInputSchema>;
export type CreateSegment = z.input<typeof createSegmentSchema>;
export type UpdateSegment = z.infer<typeof updateSegmentSchema>;
export const segmentFormSchema = z.object({
  name: z.string().trim().min(1, 'Enter a segment name.'), description: z.string(),
  targetType: targetTypeSchema, kind: segmentKindSchema, status: segmentStatusSchema,
  formId: z.union([segmentIdSchema, z.literal('')]), folderId: z.union([segmentIdSchema, z.literal('')]),
  refreshIntervalMs: z.string().refine(value => value === '' || (Number.isSafeInteger(Number(value)) && Number(value) >= 60_000), 'Enter an interval of at least 60000 milliseconds.'),
  trackMembershipEvents: z.boolean(),
});
export type SegmentFormValues = z.infer<typeof segmentFormSchema>;
export const segmentFieldErrorsSchema = z.record(z.string(), z.union([z.string(), z.array(z.string())]));
