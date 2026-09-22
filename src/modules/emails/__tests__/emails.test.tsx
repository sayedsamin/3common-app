import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react-native';
import * as SecureStore from 'expo-secure-store';
import { setApiKey } from '@/lib/api-session';
import { renderWithProviders } from '@/test/render';
import * as api from '../api';
import { emailRouteSchema } from '../schemas';
import { emailsKeys, emailEventsQueryOptions, emailActivityQueryOptions } from '../queries';
import { emailStatus, formChanges, formValues, localScheduleToISO } from '../utils';
import { EmailsScreen } from '../screens/EmailsScreen';
import { EmailDetailsScreen } from '../screens/EmailDetailsScreen';
import { EmailEventsScreen } from '../screens/EmailReportsScreen';

jest.mock('expo-router', () => ({ router: { push: jest.fn(), replace: jest.fn() } }));
const fetchMock = jest.spyOn(globalThis, 'fetch');
const email = { id: 'email-1', hostId: 'host-1', subject: 'Community news', body: '', sent: false, recipient_emails: ['person@example.com'], recipient_phonenumbers: [], event_refs: [], footer_image: '', sync_event_recipients: false, createdAt: 1, updatedAt: 1, page_id: 'page-1', data_version: 2 as const };
const response = (data: unknown) => new Response(JSON.stringify(data));
beforeEach(() => { setApiKey('test-key'); jest.mocked(SecureStore.getItemAsync).mockResolvedValue('test-key'); fetchMock.mockReset().mockImplementation(async () => response({ data: email })); });
afterEach(async () => { await cleanup(); setApiKey(null); });

test('lists with encoded search, filters, sorting, projection and zero-based pages', async () => {
  fetchMock.mockResolvedValueOnce(response({ data: [{ id: email.id, subject: email.subject }], hasMore: true, pageNumber: 2, pageSize: 20 }));
  const filters = JSON.stringify([{ logic: 'and', conditions: [{ field: 'subject', operator: 'contains', value: 'news' }] }]);
  await api.getEmails({ pageNumber: 2, search: 'news & friends', filters, sortField: 'subject', sortDirection: 'asc', view: 'draft', fields: 'id,subject' });
  const url = new URL(String(fetchMock.mock.calls[0]?.[0])); expect(url.pathname).toBe('/v1/email/'); expect(url.searchParams.get('pageNumber')).toBe('2'); expect(url.searchParams.get('search')).toBe('news & friends'); expect(url.searchParams.get('filters')).toBe(filters); expect(url.searchParams.get('fields')).toBe('id,subject');
});
test('creates, reads, patches and deletes with the documented envelopes', async () => {
  await expect(api.createEmail({ subject: email.subject, page_id: 'page-1' })).resolves.toEqual(email);
  expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({ method: 'POST', body: JSON.stringify({ subject: email.subject, page_id: 'page-1' }) });
  await expect(api.getEmail(email.id)).resolves.toEqual(email);
  await api.updateEmail(email.id, { subject: 'Updated' }); expect(fetchMock.mock.calls[2]?.[1]).toMatchObject({ method: 'PATCH', body: '{"subject":"Updated"}' });
  fetchMock.mockResolvedValueOnce(response({ data: { deleted: true } })); await expect(api.deleteEmail(email.id)).resolves.toEqual({ deleted: true }); expect(fetchMock.mock.calls[3]?.[1]).toMatchObject({ method: 'DELETE' });
});
test('sends saved content, schedules in UTC and cancels without fabricated overrides', async () => {
  await api.sendEmail(email.id); expect(fetchMock.mock.calls[0]?.[0]).toMatch(/\/email\/email-1\/send$/); expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({ method: 'POST', body: '{}' });
  const sendAt = new Date(Date.now() + 3600_000).toISOString(); await api.scheduleEmail(email.id, { sendAt }); expect(fetchMock.mock.calls[1]?.[1]).toMatchObject({ method: 'POST', body: JSON.stringify({ sendAt }) });
  await api.cancelEmailSchedule(email.id); expect(fetchMock.mock.calls[2]?.[0]).toMatch(/cancel-schedule$/);
  const count = fetchMock.mock.calls.length; await expect(api.scheduleEmail(email.id, { sendAt: '2000-01-01T00:00:00Z' })).rejects.toMatchObject({ code: 'validation' }); expect(fetchMock).toHaveBeenCalledTimes(count);
});
test('events keep cursor tokens and activity uses numbered pages', async () => {
  fetchMock.mockResolvedValueOnce(response({ data: [], hasMore: false, cursor: 'a+b', nextCursor: null, pageSize: 50 })); await api.getEmailEvents(email.id, { event: 'bounce', cursor: 'a+b' }); let url = new URL(String(fetchMock.mock.calls[0]?.[0])); expect(url.searchParams.get('cursor')).toBe('a+b'); expect(url.searchParams.get('pageSize')).toBe('50');
  fetchMock.mockResolvedValueOnce(response({ data: [], hasMore: false, pageNumber: 1, pageSize: 20 })); await api.getEmailActivity(email.id, { pageNumber: 1, search: 'person', sortField: 'recipient' }); url = new URL(String(fetchMock.mock.calls[1]?.[0])); expect(url.searchParams.get('pageNumber')).toBe('1'); expect(url.pathname).toMatch(/\/activity$/);
});
test('rejects malformed responses, wrong IDs and invalid filters', async () => {
  fetchMock.mockResolvedValueOnce(response({ data: { id: 'wrong' } })); await expect(api.getEmail(email.id)).rejects.toMatchObject({ code: 'response' });
  fetchMock.mockResolvedValueOnce(response({ data: [], hasMore: 'yes' })); await expect(api.getEmails()).rejects.toMatchObject({ code: 'response' });
  await expect(api.getEmails({ filters: '[{}]' })).rejects.toMatchObject({ code: 'validation' });
});
test.each([undefined, ['a', 'b'], '', '..', 'bad/id', 'bad\\id', 'bad?query'])('rejects malformed deep link %j', emailId => expect(emailRouteSchema.safeParse({ emailId }).success).toBe(false));
test('query keys isolate campaign, report type, filters and pagination', () => {
  expect(emailsKeys.list({ view: 'draft' })).not.toEqual(emailsKeys.list({ view: 'sent' }));
  expect(emailEventsQueryOptions('a', { event: 'open' }).queryKey).not.toEqual(emailEventsQueryOptions('a', { event: 'bounce' }).queryKey);
  expect(emailActivityQueryOptions('a', { pageNumber: 0 }).queryKey).not.toEqual(emailActivityQueryOptions('a', { pageNumber: 1 }).queryKey);
});
test('patches only changed fields and preserves hidden recipients, attachments and content', () => {
  const original = { ...email, segment_refs: ['segment'], timeslot_refs: ['slot'], attachments: [{ name: 'a', size: 1, type: 'text/plain', url: 'https://example.com/a' }] };
  expect(formChanges({ ...formValues(original), subject: 'New' }, original)).toEqual({ subject: 'New' });
  expect(formChanges({ ...formValues(original), recipients: '' }, original)).toEqual({ recipient_emails: [] });
});
test('distinguishes scheduled campaigns and rejects invalid local schedules', () => {
  expect(emailStatus({ sent: true, date_sent: '2030-01-01T00:00:00Z' }, 0)).toBe('Scheduled');
  expect(() => localScheduleToISO('2030-02-31T12:00', 0)).toThrow(); expect(() => localScheduleToISO('2000-01-01T12:00')).toThrow(); expect(localScheduleToISO('2030-01-01T12:00', 0)).toMatch(/Z$/);
});
test('list paginates and resets page when changing view', async () => {
  fetchMock.mockImplementation(async value => { const url = new URL(String(value)); const second = url.searchParams.get('pageNumber') === '1'; return response({ data: [{ ...email, subject: second ? 'Second page' : email.subject }], hasMore: !second, pageNumber: second ? 1 : 0, pageSize: 20 }); });
  await renderWithProviders(<EmailsScreen />); await screen.findByRole('button', { name: email.subject }); await fireEvent.press(screen.getByRole('button', { name: 'Next' })); await screen.findByRole('button', { name: 'Second page' }); await fireEvent.press(screen.getByRole('button', { name: 'Filters' })); await fireEvent.press(screen.getByRole('radio', { name: 'Primary filter: Draft' })); await fireEvent.press(screen.getByRole('button', { name: 'Apply filters' })); await screen.findByRole('button', { name: email.subject }); expect(new URL(String(fetchMock.mock.calls.at(-1)?.[0])).searchParams.get('pageNumber')).toBe('0');
});
test('send requires confirmation and successful send refreshes campaign state', async () => {
  fetchMock.mockImplementation(async (_, init) => response({ data: init?.method === 'POST' ? { ...email, sent: true } : email }));
  await renderWithProviders(<EmailDetailsScreen emailId={email.id} />); await screen.findByRole('button', { name: 'Send now' }); await fireEvent.press(screen.getByRole('button', { name: 'Send now' })); expect(fetchMock.mock.calls.filter(([, options]) => options?.method === 'POST')).toHaveLength(0); await fireEvent.press(screen.getByRole('button', { name: 'Confirm send' })); await screen.findByText('Send request completed.'); expect(fetchMock.mock.calls.filter(([, options]) => options?.method === 'POST')).toHaveLength(1); await waitFor(() => expect(fetchMock.mock.calls.filter(([, options]) => options?.method === 'GET').length).toBeGreaterThan(1));
});
test('event view follows nextCursor and resets cursor when switching type', async () => {
  fetchMock.mockImplementation(async value => { const url = new URL(String(value)); return response({ data: [], hasMore: !url.searchParams.has('cursor'), cursor: url.searchParams.get('cursor') ?? '', nextCursor: url.searchParams.has('cursor') ? null : 'opaque+token', pageSize: 50 }); });
  await renderWithProviders(<EmailEventsScreen emailId={email.id} />); await waitFor(() => expect(screen.getByRole('button', { name: 'Next events' })).toBeEnabled()); await fireEvent.press(screen.getByRole('button', { name: 'Next events' })); await waitFor(() => expect(new URL(String(fetchMock.mock.calls.at(-1)?.[0])).searchParams.get('cursor')).toBe('opaque+token')); await fireEvent.press(screen.getByRole('button', { name: 'Bounces' })); await waitFor(() => expect(new URL(String(fetchMock.mock.calls.at(-1)?.[0])).searchParams.get('event')).toBe('bounce')); expect(new URL(String(fetchMock.mock.calls.at(-1)?.[0])).searchParams.has('cursor')).toBe(false);
});
