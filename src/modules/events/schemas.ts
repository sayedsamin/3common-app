import { z } from 'zod';
import { filterGroupSchema } from './filter-schemas';

export const eventStatusSchema = z.enum(['draft', 'open', 'closed', 'unpublished', 'cancelled', 'postponed', 'schedule']);
export const eventIdSchema = z.string().min(1).regex(/^[^\s/\\?#]+$/).refine(value => value !== '.' && value !== '..');
export const eventRouteSchema = z.object({ eventId: eventIdSchema });
const timestamp = z.iso.datetime({ offset: true });

// Full-field reads need an ID for stable rows and detail navigation. Other
// properties are optional in the published OpenAPI event schema.
export const eventSchema = z.object({
  id: eventIdSchema,
  name: z.string().optional(),
  type: z.string().optional(),
  description: z.string().optional(),
  descriptionBlocks: z.array(z.object({ type: z.enum(['text', 'image', 'video']), content: z.string(), id: z.number() })).optional(),
  schedule: z.enum(['Single date', 'Multiple dates']).optional(),
  start: timestamp.optional(),
  end: timestamp.optional(),
  multiDayStartTimes: z.array(z.string()).optional(),
  multiDayEndTimes: z.array(z.string()).optional(),
  status: eventStatusSchema.optional(),
  itemsSold: z.number().optional(),
  revenueCents: z.number().optional(),
  minPriceCents: z.number().nullable().optional(),
  maxPriceCents: z.number().nullable().optional(),
  currency: z.string().optional(),
  timeZone: z.string().optional(),
  isPublic: z.boolean().optional(),
  isVirtual: z.boolean().optional(),
  location: z.object({ address: z.string().optional(), lat: z.number().optional(), lng: z.number().optional() }).optional(),
  locationPlaceholder: z.string().optional(),
  virtualEventLink: z.string().optional(),
  venueName: z.string().optional(),
  image: z.string().optional(),
  images: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  customTags: z.array(z.string()).optional(),
  contentBlocks: z.array(z.record(z.string(), z.json())).optional(),
  language: z.string().optional(),
  isCancelled: z.boolean().optional(),
  redirectUrl: z.string().optional(),
  customTerms: z.object({ hasCustomTerms: z.boolean().optional(), type: z.enum(['url', 'text']).optional(), url: z.string().optional(), content: z.string().optional() }).optional(),
  createdAt: timestamp.optional(),
  updatedAt: timestamp.optional(),
});
export const eventsResponseSchema = z.object({ data: z.array(eventSchema), hasMore: z.boolean() });
export const eventResponseSchema = z.object({ data: eventSchema });
export const eventsInputSchema = z.object({
  page: z.number().int().min(0),
  pageSize: z.number().int().min(1).max(100),
  search: z.string().trim(),
  status: eventStatusSchema.optional(),
  sortField: z.enum(['start', 'end', 'name']),
  sortDirection: z.enum(['asc', 'desc']),
  startAfter: timestamp.optional(),
  startBefore: timestamp.optional(),
  filters: z.array(filterGroupSchema).optional(),
});
export type Event = z.infer<typeof eventSchema>;
export type EventsInput = z.infer<typeof eventsInputSchema>;

export const externalUrlSchema = z.url().refine(value => {
  // Refinements may run even when the preceding URL check fails.
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol) && !url.username && !url.password;
  } catch {
    return false;
  }
});
