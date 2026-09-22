import { z } from 'zod';
import { eventStatusSchema, externalUrlSchema, type Event } from './schemas';

const optionalLink = z.union([z.literal(''), externalUrlSchema]);
const utcTimestamp = z.string().transform((value, ctx) => {
  // The editor displays UTC, while explicit offsets pasted by the user are also accepted.
  const text = value.trim().replace(' ', 'T');
  const normalized = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(text) ? `${text}:00` : text;
  const candidate = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?$/.test(normalized) ? `${normalized}Z` : normalized;
  if (!z.iso.datetime({ offset: true }).safeParse(candidate).success) {
    ctx.addIssue({ code: 'custom', message: 'Enter a valid date and time, for example 2026-10-01 18:00 (UTC).' });
    return z.NEVER;
  }
  return new Date(candidate).toISOString();
});
const timeZoneSchema = z.string().trim().refine(value => {
  try { new Intl.DateTimeFormat('en', { timeZone: value }).format(); return Boolean(value); } catch { return false; }
}, 'Enter a valid time zone, for example America/Winnipeg.');
const descriptionBlockSchema = z.object({ type: z.enum(['text', 'image', 'video']), content: z.string(), id: z.number() });
const termsSchema = z.object({ hasCustomTerms: z.boolean(), type: z.enum(['url', 'text']), url: z.string(), content: z.string() });

export const updateEventSchema = z.strictObject({
  name: z.string().trim().min(1, 'Enter an event name.').optional(),
  description: z.string().optional(),
  descriptionBlocks: z.array(descriptionBlockSchema).optional(),
  status: eventStatusSchema.optional(), start: utcTimestamp.optional(), end: utcTimestamp.optional(), hasEndDate: z.boolean().optional(),
  privacy: z.enum(['public', 'private']).optional(), eventType: z.enum(['virtual', 'inperson']).optional(),
  virtualEventLink: optionalLink.optional(), address: z.string().optional(), locationPlaceholder: z.string().optional(),
  timeZone: timeZoneSchema.optional(), collectEmails: z.boolean().optional(), redirectUrl: optionalLink.optional(),
  customTerms: termsSchema.optional(), customTags: z.array(z.string()).optional(),
}).superRefine((value, ctx) => {
  if (!Object.keys(value).length) ctx.addIssue({ code: 'custom', message: 'Make a change before saving.' });
  if (value.start && value.end && value.hasEndDate !== false && value.start > value.end) ctx.addIssue({ code: 'custom', path: ['end'], message: 'The end must be after the start.' });
  if (value.customTerms?.hasCustomTerms) {
    if (value.customTerms.type === 'url' && !externalUrlSchema.safeParse(value.customTerms.url).success) ctx.addIssue({ code: 'custom', path: ['customTerms', 'url'], message: 'Enter an http or https terms URL.' });
    if (value.customTerms.type === 'text' && !value.customTerms.content.trim()) ctx.addIssue({ code: 'custom', path: ['customTerms', 'content'], message: 'Enter the terms and conditions.' });
  }
  value.descriptionBlocks?.forEach((block, index) => {
    if (block.type !== 'text' && !externalUrlSchema.safeParse(block.content).success) ctx.addIssue({ code: 'custom', path: ['descriptionBlocks', index, 'content'], message: 'Enter an http or https URL.' });
  });
});
export type UpdateEvent = z.output<typeof updateEventSchema>;

export const eventEditSchema = z.object({
  name: z.string(), description: z.string(), descriptionBlocks: z.array(descriptionBlockSchema),
  status: z.union([eventStatusSchema, z.literal('')]), start: z.string(), end: z.string(), hasEndDate: z.enum(['', 'true', 'false']),
  privacy: z.enum(['', 'public', 'private']), eventType: z.enum(['', 'virtual', 'inperson']),
  virtualEventLink: z.string(), address: z.string(), locationPlaceholder: z.string(), timeZone: z.string(),
  collectEmails: z.enum(['', 'true', 'false']), redirectUrl: z.string(), customTags: z.string(), customTerms: termsSchema,
});
export type EventEditValues = z.infer<typeof eventEditSchema>;

export function eventEditValues(event: Event, saved?: UpdateEvent): EventEditValues {
  return {
    name: event.name ?? '', description: event.description ?? '', descriptionBlocks: event.descriptionBlocks ?? [], status: event.status ?? '',
    start: event.start ?? '', end: event.end ?? '', hasEndDate: saved?.hasEndDate === false ? 'false' : event.end ? 'true' : '',
    privacy: event.isPublic === undefined ? '' : event.isPublic ? 'public' : 'private',
    eventType: event.isVirtual === undefined ? '' : event.isVirtual ? 'virtual' : 'inperson',
    virtualEventLink: event.virtualEventLink ?? '', address: event.location?.address ?? '', locationPlaceholder: event.locationPlaceholder ?? '',
    timeZone: event.timeZone ?? '', collectEmails: saved?.collectEmails === undefined ? '' : String(saved.collectEmails) === 'true' ? 'true' : 'false',
    redirectUrl: event.redirectUrl ?? '', customTags: (event.customTags ?? []).join('\n'),
    customTerms: { hasCustomTerms: event.customTerms?.hasCustomTerms ?? false, type: event.customTerms?.type ?? 'text', url: event.customTerms?.url ?? '', content: event.customTerms?.content ?? '' },
  };
}

export function eventEditPatch(values: EventEditValues, initial: EventEditValues) {
  const changes: Record<string, unknown> = {};
  for (const key of Object.keys(eventEditSchema.shape)) {
    const field = eventEditSchema.keyof().parse(key);
    if (JSON.stringify(values[field]) === JSON.stringify(initial[field])) continue;
    if (field === 'hasEndDate' || field === 'collectEmails') {
      if (values[field]) changes[field] = values[field] === 'true';
    } else if (field === 'status' || field === 'privacy' || field === 'eventType') {
      if (values[field]) changes[field] = values[field];
    } else if (field === 'customTags') changes[field] = values.customTags.split('\n').map(value => value.trim()).filter(Boolean);
    else if (field === 'end' && values.hasEndDate === 'false') continue;
    else changes[field] = values[field];
  }
  if (changes.hasEndDate === true) changes.end = values.end;
  const result = updateEventSchema.safeParse(changes);
  if (!result.success) return result;
  if ((changes.start || changes.end || changes.hasEndDate) && values.hasEndDate !== 'false' && values.start && values.end) {
    // Validate the resulting schedule even when only one bound is part of the patch.
    const range = updateEventSchema.safeParse({ start: values.start, end: values.end });
    if (!range.success) return range;
  }
  return result;
}
