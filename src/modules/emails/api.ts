import { z } from 'zod';
import { apiRequest, ApiError } from '@/lib/api-client';
import * as c from './contracts';
import { emailIdSchema, filtersSchema } from './schemas';

function path(id: string) { return `email/${encodeURIComponent(emailIdSchema.parse(id))}`; }
function params(input: Record<string, string | number | undefined>) { const values = new URLSearchParams(); Object.entries(input).forEach(([key, value]) => { if (value !== undefined) { if (key === 'filters') { try { filtersSchema.parse(JSON.parse(String(value))); } catch { throw new ApiError('validation', 'The selected filters are invalid.'); } } values.set(key, String(value)); } }); return values.toString(); }
async function request<T>(url: string, schema: z.ZodType<T>, method = 'GET', body?: unknown, signal?: AbortSignal): Promise<T> {
  const result = schema.safeParse(await apiRequest(url, { method, signal, ...(body !== undefined ? { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : {}) }));
  if (!result.success) throw new ApiError('response', 'The email response could not be read. Refresh before trying again.');
  return result.data;
}
export async function getEmails(input: z.input<typeof c.emailsInputSchema> = {}, signal?: AbortSignal) { return request(`email/?${params(c.emailsInputSchema.parse({ pageNumber: 0, pageSize: 20, ...input }))}`, c.emailsResponseSchema, 'GET', undefined, signal); }
export async function getEmail(id: string, signal?: AbortSignal, input: z.input<typeof c.emailInputSchema> = {}) { const values = c.emailInputSchema.parse(input); const result = await request(path(id) + (values.fields ? `?${params(values)}` : ''), c.emailResponseSchema, 'GET', undefined, signal); if ((!values.fields || result.data.id !== undefined) && result.data.id !== id) throw new ApiError('response', 'The email details could not be read.'); return result.data; }
export async function createEmail(input: z.input<typeof c.createEmailBodySchema>) { const result = await request('email/', c.createEmailResponseSchema, 'POST', c.createEmailBodySchema.parse(input)); if (!emailIdSchema.safeParse(result.data.id).success) throw new ApiError('response', 'Refresh the email list before creating another draft.'); return result.data; }
export async function updateEmail(id: string, input: z.input<typeof c.updateEmailBodySchema>) { const result = await request(path(id), c.updateEmailResponseSchema, 'PATCH', c.updateEmailBodySchema.parse(input)); if (result.data.id !== id) throw new ApiError('response', 'Refresh the email before saving again.'); return result.data; }
export async function deleteEmail(id: string) { const result = await request(path(id), c.deleteEmailResponseSchema, 'DELETE'); if (!result.data.deleted) throw new ApiError('response', 'The email was not deleted. Refresh and try again.'); return result.data; }
export async function sendEmail(id: string, input: z.input<typeof c.sendEmailBodySchema> = {}) { return (await request(`${path(id)}/send`, c.sendEmailResponseSchema, 'POST', c.sendEmailBodySchema.parse(input))).data; }
export async function scheduleEmail(id: string, input: z.input<typeof c.scheduleEmailBodySchema>) { const values = c.scheduleEmailBodySchema.parse(input); if (Date.parse(values.sendAt) <= Date.now()) throw new ApiError('validation', 'Choose a delivery time in the future.'); return (await request(`${path(id)}/schedule`, c.scheduleEmailResponseSchema, 'POST', values)).data; }
export async function cancelEmailSchedule(id: string) { return (await request(`${path(id)}/cancel-schedule`, c.cancelScheduleResponseSchema, 'POST')).data; }
export async function getEmailEvents(id: string, input: z.input<typeof c.emailEventsInputSchema>, signal?: AbortSignal) { return request(`${path(id)}/events?${params(c.emailEventsInputSchema.parse({ pageSize: 50, ...input }))}`, c.emailEventsResponseSchema, 'GET', undefined, signal); }
export async function getEmailActivity(id: string, input: z.input<typeof c.emailActivityInputSchema> = {}, signal?: AbortSignal) { return request(`${path(id)}/activity?${params(c.emailActivityInputSchema.parse({ pageNumber: 0, pageSize: 20, ...input }))}`, c.emailActivityResponseSchema, 'GET', undefined, signal); }
