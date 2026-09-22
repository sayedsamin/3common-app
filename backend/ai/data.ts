import { z } from 'zod';
import { querySchema, resultSchema, type Query, type Result } from '../../src/modules/ai/contracts';
import { fetchService, failure } from './errors';
import { validateQuery } from './filters';

const event = z.object({ id: z.string(), name: z.string().max(1000).optional(), start: z.string().optional(), end: z.string().optional(), status: z.string().optional(), venueName: z.string().optional(), location: z.object({ address: z.string().optional() }).optional(), itemsSold: z.number().optional(), revenueCents: z.number().optional(), currency: z.string().optional(), timeZone: z.string().optional(), isVirtual: z.boolean().optional(), tags: z.array(z.string()).optional(), description: z.string().transform(value => value.slice(0, 3000)).optional() });
const contact = z.object({ id: z.string(), fullName: z.string(), email: z.string(), phone: z.string().optional(), status: z.string(), grossSum: z.number(), orderSum: z.number(), firstOrder: z.number().optional(), lastOrder: z.number().optional(), eventsAttended_IDS: z.array(z.string()).optional(), createdAt: z.string().optional() });
const activity = z.object({ _id: z.string(), type: z.string(), createdAt: z.string(), contact_id: z.string().optional() });
const eventCard = (v: z.infer<typeof event>) => ({ id: v.id, kind: 'event' as const, title: v.name ?? 'Untitled event', subtitle: [v.start, v.venueName ?? v.location?.address].filter(Boolean).join(' · '), status: v.status });
const contactCard = (v: z.infer<typeof contact>) => ({ id: v.id, kind: 'contact' as const, title: v.fullName || v.email, subtitle: v.email, status: v.status });
export function createDataClient(key: string, signal: AbortSignal, fetcher: typeof fetch) {
  const get = (path: string) => fetchService(fetcher, `https://api.3common.com/v1/${path}`, { method: 'GET', headers: { Authorization: `Bearer ${key}`, Accept: 'application/json' }, signal }, '3common');
  const verify = async () => {
    const shape = z.object({ data: z.array(z.object({ id: z.string() })), hasMore: z.boolean() });
    try { shape.parse(await get('events/?page=0&pageSize=1&fields=id')); }
    catch (error) { if (error instanceof Error && 'status' in error && error.status === 403) shape.parse(await get('contacts/?pageNumber=0&pageSize=1')); else if (error instanceof z.ZodError) throw failure('3common', 'response', '3common returned an unreadable verification response.', 502); else throw error; }
  };
  async function execute(raw: unknown): Promise<{ result: Result; records: unknown }> {
    const query = querySchema.parse(raw); validateQuery(query);
    const params = new URLSearchParams();
    for (const [name, value] of Object.entries(query.input)) {
      if (name !== 'id' && value !== undefined && value !== '') params.set(name, typeof value === 'object' ? JSON.stringify(value) : String(value));
    }
    let cards: Result['cards']; let records: unknown; let hasMore = false; let nextQuery: Query | undefined;
    if (query.tool === 'list_events') {
      const response = z.object({ data: z.array(event), hasMore: z.boolean() }).parse(await get(`events/?${params}`));
      records = response.data; cards = response.data.map(eventCard); hasMore = response.hasMore;
      if (hasMore) nextQuery = { ...query, input: { ...query.input, page: query.input.page + 1 } };
    } else if (query.tool === 'list_contacts') {
      const response = z.object({ data: z.array(contact), hasMore: z.boolean() }).parse(await get(`contacts/?${params}`));
      records = response.data; cards = response.data.map(contactCard); hasMore = response.hasMore;
      if (hasMore) nextQuery = { ...query, input: { ...query.input, pageNumber: query.input.pageNumber + 1 } };
    } else if (query.tool === 'event_details') {
      const { data } = z.object({ data: event }).parse(await get(`events/${encodeURIComponent(query.input.id)}`));
      if (data.id !== query.input.id) throw failure('3common', 'response', 'The event response did not match the requested event.', 502);
      records = data; cards = [eventCard(data)];
    } else if (query.tool === 'contact_details') {
      const { data } = z.object({ data: contact }).parse(await get(`contacts/${encodeURIComponent(query.input.id)}`));
      if (data.id !== query.input.id) throw failure('3common', 'response', 'The contact response did not match the requested contact.', 502);
      records = data; cards = [contactCard(data)];
    } else {
      const response = z.object({ data: z.array(activity), hasMore: z.boolean() }).parse(await get(`contacts/${encodeURIComponent(query.input.id)}/activity?${params}`));
      if (response.data.some(row => row.contact_id && row.contact_id !== query.input.id)) throw failure('3common', 'response', 'Activity did not match the requested contact.', 502);
      records = response.data; cards = response.data.map(row => ({ id: row._id, kind: 'activity' as const, title: row.type.replaceAll('_', ' '), subtitle: row.createdAt, contactId: query.input.id })); hasMore = response.hasMore;
      if (hasMore) nextQuery = { ...query, input: { ...query.input, pageNumber: query.input.pageNumber + 1 } };
    }
    return { result: resultSchema.parse({ query, cards, hasMore, nextQuery }), records };
  }
  return { verify, execute: async (raw: unknown) => {
    // Distinguish invalid model input from invalid upstream data.
    const query = querySchema.parse(raw); validateQuery(query);
    try { return await execute(query); }
    catch (error) { if (error instanceof z.ZodError) throw failure('3common', 'response', '3common returned an invalid record response. Please retry.', 502); throw error; }
  } };
}
