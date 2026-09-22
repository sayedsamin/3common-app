import { ApiError } from '@/lib/api-client';
import type { Email, EmailFormValues, UpdateEmail } from './schemas';
export function emailError(error: unknown) { return error instanceof ApiError ? error.message : 'Unable to complete this operation. Check your input and try again.'; }
export function emailStatus(email: Pick<Email, 'sent' | 'date_sent'>, now = Date.now()) { return !email.sent ? 'Draft' : email.date_sent && Date.parse(email.date_sent) > now ? 'Scheduled' : 'Sent'; }
export function formValues(email?: Email): EmailFormValues { return { subject: email?.subject ?? '', display_name: email?.display_name ?? '', reply_to_email: email?.reply_to_email ?? '', recipients: email?.recipient_emails?.join('\n') ?? '', event_refs: email?.event_refs ?? [], sync_event_recipients: email?.sync_event_recipients ?? false, page_id: email?.page_id ?? '' }; }
export function formChanges(values: EmailFormValues, original?: Email): UpdateEmail {
  const before = formValues(original); const changes: UpdateEmail = {};
  for (const key of ['subject', 'display_name', 'reply_to_email', 'page_id'] as const) if ((!original && values[key]) || (original && values[key] !== before[key])) changes[key] = values[key];
  if (!original || values.recipients !== before.recipients) changes.recipient_emails = [...new Set(values.recipients.split(/[\s,;]+/).filter(Boolean))];
  if (!original || JSON.stringify(values.event_refs) !== JSON.stringify(before.event_refs)) changes.event_refs = values.event_refs;
  if (!original || values.sync_event_recipients !== before.sync_event_recipients) changes.sync_event_recipients = values.sync_event_recipients;
  return changes;
}
export function localScheduleToISO(value: string, now = Date.now()) { if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) throw new Error('Enter a date and time as YYYY-MM-DDTHH:mm.'); const date = new Date(value); const [year, month, day, hour, minute] = value.split(/[-T:]/).map(Number); if (!Number.isFinite(date.getTime()) || date.getFullYear() !== year || date.getMonth() + 1 !== month || date.getDate() !== day || date.getHours() !== hour || date.getMinutes() !== minute || date.getTime() <= now) throw new Error('Choose a valid local time in the future.'); return date.toISOString(); }
