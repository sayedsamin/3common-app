import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react-native';
import * as SecureStore from 'expo-secure-store';
import { renderWithProviders } from '@/test/render';
import { setApiKey } from '@/lib/api-session';
import { eventEditPatch, eventEditValues, updateEventSchema } from '../edit-schemas';
import { updateEvent } from '../api';
import { EventEditForm } from '../components/EventEditForm';
import type { Event } from '../schemas';

jest.mock('expo-router', () => ({ useNavigation: () => ({ dispatch: jest.fn() }), router: { replace: jest.fn() } }));
jest.mock('expo-router/react-navigation', () => ({ usePreventRemove: jest.fn() }));

const fetchMock = jest.spyOn(globalThis, 'fetch');
const event: Event = { id: 'event-1', name: 'Community night', status: 'open', start: '2026-10-01T18:00:00Z', end: '2026-10-01T21:00:00Z', isPublic: true, isVirtual: false,
  descriptionBlocks: [{ id: 17, type: 'text', content: '<p>Keep this formatting.</p>' }], customTags: ['Food, drink', 'Music'], timeZone: 'America/Winnipeg' };
beforeEach(() => {
  setApiKey('test-key');
  jest.mocked(SecureStore.getItemAsync).mockResolvedValue('test-key');
  fetchMock.mockReset().mockResolvedValue(new Response(JSON.stringify({ data: event })));
});
afterEach(async () => { await cleanup(); setApiKey(null); });

test('maps read fields and leaves unreported settings unchanged', () => {
  const values = eventEditValues(event);
  expect(values.privacy).toBe('public'); expect(values.eventType).toBe('inperson'); expect(values.collectEmails).toBe('');
  expect(values.customTags).toBe('Food, drink\nMusic');
  const patch = eventEditPatch({ ...values, name: 'New name' }, values);
  expect(patch.success && patch.data).toEqual({ name: 'New name' });
  expect(eventEditPatch(values, values).success).toBe(false);
});

test('preserves rich block IDs, HTML, and order while updating content', () => {
  const values = eventEditValues(event);
  const descriptionBlocks = [...values.descriptionBlocks, { id: 18, type: 'image' as const, content: 'https://example.com/cover.jpg' }];
  const patch = eventEditPatch({ ...values, descriptionBlocks }, values);
  expect(patch.success && patch.data).toEqual({ descriptionBlocks });
});

test('sends explicit false and empty arrays rather than losing removal intent', () => {
  const values = eventEditValues(event);
  const patch = eventEditPatch({ ...values, collectEmails: 'false', hasEndDate: 'false', customTags: '', descriptionBlocks: [] }, values);
  expect(patch.success && patch.data).toEqual({ collectEmails: false, hasEndDate: false, customTags: [], descriptionBlocks: [] });
});

test('validates changed fields without rejecting missing legacy fields', () => {
  const values = eventEditValues({ id: 'minimal' });
  expect(eventEditPatch({ ...values, address: '123 Main Street' }, values).success).toBe(true);
  expect(updateEventSchema.safeParse({ name: ' ' }).success).toBe(false);
  expect(updateEventSchema.safeParse({ timeZone: 'Mars/Olympus' }).success).toBe(false);
  expect(updateEventSchema.safeParse({ redirectUrl: 'javascript:alert(1)' }).success).toBe(false);
  expect(updateEventSchema.safeParse({ revenueCents: 100 }).success).toBe(false);
});

test('normalizes schedule times to UTC and validates changed bounds against unchanged ones', () => {
  const values = eventEditValues(event);
  const patch = eventEditPatch({ ...values, start: '2026-10-01 17:00' }, values);
  expect(patch.success && patch.data).toEqual({ start: '2026-10-01T17:00:00.000Z' });
  expect(eventEditPatch({ ...values, start: '2026-10-02 17:00' }, values).success).toBe(false);
  expect(updateEventSchema.safeParse({ start: '2026-02-30 18:00' }).success).toBe(false);
  expect(updateEventSchema.parse({ start: '2026-10-01T12:00:00-05:00' }).start).toBe('2026-10-01T17:00:00.000Z');
});

test('validates enabled terms and sends all required nested terms fields', () => {
  const values = eventEditValues(event);
  expect(eventEditPatch({ ...values, customTerms: { ...values.customTerms, hasCustomTerms: true } }, values).success).toBe(false);
  const terms = { hasCustomTerms: true, type: 'url' as const, url: 'https://example.com/terms', content: '' };
  const patch = eventEditPatch({ ...values, customTerms: terms }, values);
  expect(patch.success && patch.data).toEqual({ customTerms: terms });
});

test('PATCHes JSON with bearer authentication and validates response identity', async () => {
  await updateEvent('event-1', { name: 'New name' });
  const [url, options] = fetchMock.mock.calls[0] ?? [];
  expect(url).toBe('https://api.3common.com/v1/events/event-1');
  expect(options?.method).toBe('PATCH'); expect(options?.body).toBe('{"name":"New name"}');
  expect(new Headers(options?.headers).get('Authorization')).toBe('Bearer test-key');
  expect(new Headers(options?.headers).get('Content-Type')).toBe('application/json');
  fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ data: { id: 'different-event' } })));
  await expect(updateEvent('event-1', { name: 'New name' })).rejects.toMatchObject({ code: 'response' });
});

test('saves only changed form values and acknowledges success', async () => {
  await renderWithProviders(<EventEditForm event={event} />);
  expect(screen.getByRole('button', { name: 'Save changes' })).toBeDisabled();
  await fireEvent.changeText(screen.getByLabelText('Event name'), 'Updated night');
  await fireEvent.press(screen.getByRole('button', { name: 'Save changes' }));
  await screen.findByText('Event saved.');
  expect(JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body))).toEqual({ name: 'Updated night' });
  expect(screen.getByRole('button', { name: 'Save changes' })).toBeDisabled();
});

test('retains drafts and maps server validation errors without retrying the write', async () => {
  fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ status: 422, error: 'validation', message: 'Invalid field', details: { fieldErrors: { name: ['Choose another name.'] } } }), { status: 422 }));
  await renderWithProviders(<EventEditForm event={event} />);
  await fireEvent.changeText(screen.getByLabelText('Event name'), 'Keep this draft');
  await fireEvent.press(screen.getByRole('button', { name: 'Save changes' }));
  await screen.findByText('Choose another name.');
  expect(screen.getByLabelText('Event name')).toHaveDisplayValue('Keep this draft');
  expect(fetchMock).toHaveBeenCalledTimes(1);
});

test('prevents duplicate submissions while a save is pending', async () => {
  let complete: ((response: Response) => void) | undefined;
  fetchMock.mockImplementationOnce(() => new Promise(resolve => { complete = resolve; }));
  await renderWithProviders(<EventEditForm event={event} />);
  await fireEvent.changeText(screen.getByLabelText('Event name'), 'Updated night');
  await fireEvent.press(screen.getByRole('button', { name: 'Save changes' }));
  await waitFor(() => expect(screen.getByRole('button', { name: 'Save changes' })).toBeDisabled());
  await fireEvent.press(screen.getByRole('button', { name: 'Save changes' }));
  expect(fetchMock).toHaveBeenCalledTimes(1);
  complete?.(new Response(JSON.stringify({ data: event })));
  await screen.findByText('Event saved.');
});
