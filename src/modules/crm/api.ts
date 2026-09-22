import { z } from 'zod';
import { ApiError, apiRequest } from '@/lib/api-client';
import { activityInputSchema, activityResponseSchema, contactIdSchema, contactResponseSchema, contactsInputSchema, contactsResponseSchema, createContactSchema, deleteContactResponseSchema, updateContactResponseSchema, updateContactSchema, type ActivityInput, type ContactsInput, type CreateContact, type UpdateContact } from './schemas';

function parse<T>(schema: z.ZodType<T>, response: unknown): T {
  const result = schema.safeParse(response);
  if (!result.success) throw new ApiError('response', 'The contacts response could not be read. Refresh before trying again.');
  return result.data;
}
function parameters(input: Record<string, unknown>) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(input)) if (value !== undefined && value !== '') params.set(key, typeof value === 'object' ? JSON.stringify(value) : String(value));
  return params;
}
function path(id: string) { return `contacts/${encodeURIComponent(contactIdSchema.parse(id))}`; }
function matchId(actual: string, expected: string) {
  if (actual !== expected) throw new ApiError('response', 'The contacts response did not match the requested contact. Refresh before trying again.');
}
export async function getContacts(input: ContactsInput = {}, signal?: AbortSignal) {
  return parse(contactsResponseSchema, await apiRequest(`contacts/?${parameters(contactsInputSchema.parse(input))}`, { signal }));
}
export async function createContact(input: CreateContact) {
  return parse(contactResponseSchema, await apiRequest('contacts/', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(createContactSchema.parse(input)) })).data;
}
export async function getContact(id: string, signal?: AbortSignal) {
  const contact = parse(contactResponseSchema, await apiRequest(path(id), { signal })).data;
  matchId(contact.id, id);
  return contact;
}
export async function updateContact(id: string, input: UpdateContact) {
  const contact = parse(updateContactResponseSchema, await apiRequest(path(id), { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updateContactSchema.parse(input)) })).data;
  matchId(contact._id, id);
  return contact;
}
export async function deleteContact(id: string) {
  const contact = parse(deleteContactResponseSchema, await apiRequest(path(id), { method: 'DELETE' })).data;
  matchId(contact.id, id);
  return contact;
}
export async function getContactActivity(id: string, input: ActivityInput = {}, signal?: AbortSignal) {
  const result = parse(activityResponseSchema, await apiRequest(`${path(id)}/activity?${parameters(activityInputSchema.parse(input))}`, { signal }));
  for (const item of result.data) if (item.contact_id !== undefined) matchId(item.contact_id, id);
  return result;
}
