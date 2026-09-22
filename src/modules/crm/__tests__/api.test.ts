import { setApiKey } from '@/lib/api-session';
import { createContact, deleteContact, getContact, getContactActivity, getContacts, updateContact } from '../api';
import { activityInputSchema, contactRouteSchema, contactsInputSchema, updateContactSchema } from '../schemas';
import { contactsKeys } from '../queries';
import { activity, contact, page, patch, response, updatedContact } from '../test-fixtures';

const fetchMock = jest.spyOn(globalThis, 'fetch');
beforeEach(() => { setApiKey('test-key'); fetchMock.mockReset(); });
afterEach(() => { setApiKey(null); });

test('serializes all list controls including nested filters and custom property sort', async () => {
  fetchMock.mockResolvedValueOnce(response(page([contact])));
  const filters = [{ logic: 'and' as const, conditions: [{ logic: 'or' as const, conditions: [{ field: 'grossSum', operator: 'is_greater_than' as const, value: 100 }] }] }];
  await expect(getContacts({ pageNumber: 2, pageSize: 500, search: ' Alex & River ', filter: 'opted-in', sortField: 'abcdef0123456789abcdef01', sortDirection: 'asc', filters })).resolves.toEqual(page([contact]));
  const url = new URL(String(fetchMock.mock.calls[0]?.[0]));
  expect(url.pathname).toBe('/v1/contacts/');
  expect(Object.fromEntries(url.searchParams)).toEqual({ pageNumber: '2', pageSize: '500', search: 'Alex & River', filter: 'opted-in', sortField: 'abcdef0123456789abcdef01', sortDirection: 'asc', filters: JSON.stringify(filters) });
});
test('creates, reads, patches and deletes through authenticated JSON requests', async () => {
  fetchMock.mockResolvedValueOnce(response({ data: contact })).mockResolvedValueOnce(response({ data: contact }))
    .mockResolvedValueOnce(response({ data: updatedContact })).mockResolvedValueOnce(response({ data: { id: contact.id } }));
  await expect(createContact({ email: contact.email })).resolves.toEqual(contact);
  await expect(getContact(contact.id)).resolves.toEqual(contact);
  await expect(updateContact(contact.id, { ...patch, mergeWith: 'other', resolution: 'safe-merge' })).resolves.toEqual(updatedContact);
  await expect(deleteContact(contact.id)).resolves.toEqual({ id: contact.id });
  expect(fetchMock.mock.calls.map(([, options]) => options?.method ?? 'GET')).toEqual(['POST', 'GET', 'PATCH', 'DELETE']);
  expect(fetchMock.mock.calls.map(([url]) => new URL(String(url)).pathname)).toEqual(['/v1/contacts/', '/v1/contacts/contact-1', '/v1/contacts/contact-1', '/v1/contacts/contact-1']);
  expect(JSON.parse(String(fetchMock.mock.calls[2]?.[1]?.body))).toEqual({ ...patch, mergeWith: 'other', resolution: 'safe-merge' });
  for (const [, options] of fetchMock.mock.calls) expect(new Headers(options?.headers).get('Authorization')).toBe('Bearer test-key');
  expect(new Headers(fetchMock.mock.calls[0]?.[1]?.headers).get('Content-Type')).toBe('application/json');
});
test('paginates activity and retains its unknown payload', async () => {
  fetchMock.mockResolvedValueOnce(response(page([activity])));
  await expect(getContactActivity(contact.id, { pageNumber: 3, pageSize: 100, filter: 'email_sent', sort: 'oldest' })).resolves.toEqual(page([activity]));
  const url = new URL(String(fetchMock.mock.calls[0]?.[0]));
  expect(url.pathname).toBe('/v1/contacts/contact-1/activity');
  expect(Object.fromEntries(url.searchParams)).toEqual({ pageNumber: '3', pageSize: '100', filter: 'email_sent', sort: 'oldest' });
});
test.each([undefined, [], ['one', 'two'], '', '..', 'bad/id', 'bad\\id', 'bad?query'])('rejects invalid route ID %j', contactId => {
  expect(contactRouteSchema.safeParse({ contactId }).success).toBe(false);
});
test('validates pagination, required patch fields, merges and clearing fields', () => {
  expect(contactsInputSchema.parse({}).pageNumber).toBe(0);
  expect(contactsInputSchema.safeParse({ pageSize: 501 }).success).toBe(false);
  expect(activityInputSchema.safeParse({ pageSize: 101 }).success).toBe(false);
  expect(activityInputSchema.safeParse({ pageNumber: -1 }).success).toBe(false);
  expect(updateContactSchema.safeParse({ contact: { email: contact.email } }).success).toBe(false);
  expect(updateContactSchema.safeParse({ ...patch, mergeWith: 'other' }).success).toBe(false);
  expect(updateContactSchema.safeParse({ contact: { ...patch.contact, phone: null, billingEmail: '' } }).success).toBe(true);
});
test('rejects malformed envelopes and mismatched detail, update, delete and activity identities', async () => {
  fetchMock.mockResolvedValueOnce(response({ data: [contact] }));
  await expect(getContacts()).rejects.toMatchObject({ code: 'response' });
  fetchMock.mockResolvedValueOnce(response({ data: { ...contact, id: 'other' } }));
  await expect(getContact(contact.id)).rejects.toMatchObject({ code: 'response' });
  fetchMock.mockResolvedValueOnce(response({ data: contact }));
  await expect(updateContact(contact.id, patch)).rejects.toMatchObject({ code: 'response' });
  fetchMock.mockResolvedValueOnce(response({ data: { ...updatedContact, _id: 'other' } }));
  await expect(updateContact(contact.id, patch)).rejects.toMatchObject({ code: 'response' });
  fetchMock.mockResolvedValueOnce(response({ data: { id: 'other' } }));
  await expect(deleteContact(contact.id)).rejects.toMatchObject({ code: 'response' });
  fetchMock.mockResolvedValueOnce(response(page([{ ...activity, contact_id: 'other' }])));
  await expect(getContactActivity(contact.id)).rejects.toMatchObject({ code: 'response' });
});
test('encodes IDs and forwards cancellation without issuing an aborted request', async () => {
  fetchMock.mockResolvedValueOnce(response({ data: { ...contact, id: 'contact+1' } }));
  await getContact('contact+1');
  expect(String(fetchMock.mock.calls[0]?.[0])).toContain('contact%2B1');
  const controller = new AbortController(); controller.abort();
  await expect(getContact(contact.id, controller.signal)).rejects.toMatchObject({ code: 'cancelled' });
  expect(fetchMock).toHaveBeenCalledTimes(1);
});
test('separates caches for all query inputs and normalizes defaults', () => {
  const base = contactsKeys.list({});
  expect(base).toEqual(contactsKeys.list({ pageNumber: 0, pageSize: 20, sortField: 'mostRecentOrder', sortDirection: 'desc' }));
  for (const input of [{ pageNumber: 1 }, { pageSize: 50 }, { search: 'alex' }, { filter: 'imported' as const }, { sortField: 'email' }, { sortDirection: 'asc' as const }, { filters: [{ logic: 'and' as const, conditions: [] }] }]) expect(contactsKeys.list(input)).not.toEqual(base);
  for (const input of [{ pageNumber: 1 }, { pageSize: 50 }, { filter: 'email_sent' as const }, { sort: 'oldest' as const }]) expect(contactsKeys.activity(contact.id, input)).not.toEqual(contactsKeys.activity(contact.id, {}));
  expect(contactsKeys.activity('other', {})).not.toEqual(contactsKeys.activity(contact.id, {}));
});
