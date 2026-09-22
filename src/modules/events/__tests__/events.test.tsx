import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react-native';
import { onlineManager } from '@tanstack/react-query';
import * as SecureStore from 'expo-secure-store';
import { renderWithProviders } from '@/test/render';
import { setApiKey } from '@/lib/api-session';
import { getEvent, getEvents } from '../api';
import { eventRouteSchema, type Event, type EventsInput } from '../schemas';
import { eventsKeys } from '../queries';
import { EventDetails } from '../components/EventDetails';
import { MyEventsScreen } from '../screens/MyEventsScreen';
import { EventDetailsScreen } from '../screens/EventDetailsScreen';
import { eventDetailsLayout, eventMoney, eventText, safeEventUrl } from '../utils';

const fetchMock = jest.spyOn(globalThis, 'fetch');
const input: EventsInput = { page: 0, pageSize: 20, search: '', sortField: 'start', sortDirection: 'desc' };
const event: Event = { id: 'evt-1', name: 'Community night', status: 'open', start: '2026-10-01T18:00:00Z', timeZone: 'America/Winnipeg' };
beforeEach(() => {
  setApiKey('test-key');
  jest.mocked(SecureStore.getItemAsync).mockResolvedValue('test-key');
  fetchMock.mockReset().mockImplementation(async () => new Response(JSON.stringify({ data: [event], hasMore: false })));
});
afterEach(async () => { await cleanup(); onlineManager.setOnline(true); setApiKey(null); });

test('encodes list inputs and requests all detail fields', async () => {
  await getEvents({ ...input, page: 2, search: 'music & food', status: 'draft' });
  const url = new URL(String(fetchMock.mock.calls[0]?.[0]));
  expect(url.searchParams.get('page')).toBe('2');
  expect(url.searchParams.get('pageSize')).toBe('20');
  expect(url.searchParams.get('search')).toBe('music & food');
  expect(url.searchParams.get('status')).toBe('draft');
  fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ data: event })));
  await expect(getEvent(event.id)).resolves.toEqual(event);
  expect(fetchMock.mock.calls[1]?.[0]).toBe('https://api.3common.com/v1/events/evt-1');
});

test('rejects malformed responses and mismatched detail IDs', async () => {
  fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ data: [{}], hasMore: true })));
  await expect(getEvents(input)).rejects.toMatchObject({ code: 'response' });
  fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ data: { ...event, id: 'wrong-id' } })));
  await expect(getEvent(event.id)).rejects.toMatchObject({ code: 'response' });
});

test.each([undefined, ['evt-1', 'evt-2'], '', '..', 'bad/id', 'bad\\id', 'bad?query'])('rejects invalid route ID %j', eventId => {
  expect(eventRouteSchema.safeParse({ eventId }).success).toBe(false);
});

test('separates cache keys for every list input and detail', () => {
  const base = JSON.stringify(eventsKeys.list(input));
  for (const changes of [{ page: 1 }, { pageSize: 50 }, { search: 'concert' }, { status: 'draft' as const }, { sortField: 'name' as const }, { sortDirection: 'asc' as const }]) {
    expect(JSON.stringify(eventsKeys.list({ ...input, ...changes }))).not.toBe(base);
  }
  expect(eventsKeys.detail('evt-1')).not.toEqual(eventsKeys.detail('evt-2'));
});

test('paginates using hasMore and resets to the first page when status changes', async () => {
  fetchMock.mockImplementation(async value => {
    const url = new URL(String(value));
    return new Response(JSON.stringify({ data: [{ ...event, name: url.searchParams.get('page') === '1' ? 'Second page event' : event.name }], hasMore: url.searchParams.get('page') === '0' }));
  });
  await renderWithProviders(<MyEventsScreen />);
  await screen.findByRole('button', { name: 'View event: Community night' });
  expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled();
  await fireEvent.press(screen.getByRole('button', { name: 'Next' }));
  await screen.findByRole('button', { name: 'View event: Second page event' });
  expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
  await fireEvent.press(screen.getByRole('button', { name: 'Filters' }));
  await fireEvent.press(screen.getByRole('radio', { name: 'Primary filter: Draft' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Apply filters' }));
  await screen.findByRole('button', { name: 'View event: Community night' });
  const last = new URL(String(fetchMock.mock.calls.at(-1)?.[0]));
  expect(last.searchParams.get('page')).toBe('0');
  expect(last.searchParams.get('status')).toBe('draft');
});

test('searches and sorts remotely without carrying stale search results', async () => {
  await renderWithProviders(<MyEventsScreen />);
  await screen.findByRole('button', { name: 'View event: Community night' });
  await fireEvent.changeText(screen.getByLabelText('Search'), 'music & food');
  expect(screen.queryByRole('button', { name: 'View event: Community night' })).toBeNull();
  await waitFor(() => expect(new URL(String(fetchMock.mock.calls.at(-1)?.[0])).searchParams.get('search')).toBe('music & food'));
  await screen.findByRole('button', { name: 'View event: Community night' });
  await fireEvent.press(screen.getByRole('button', { name: 'Sort: Start date' }));
  await fireEvent.press(screen.getByRole('radio', { name: 'Sort by Name' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Apply sort' }));
  await waitFor(() => expect(new URL(String(fetchMock.mock.calls.at(-1)?.[0])).searchParams.get('sortField')).toBe('name'));
});

test('renders empty results and retries recoverable failures', async () => {
  fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ error: { code: 'FORBIDDEN', message: 'private backend detail' } }), { status: 403 }));
  await renderWithProviders(<MyEventsScreen />);
  await screen.findByText('You do not have permission to perform this action.');
  expect(screen.queryByText('private backend detail')).toBeNull();
  fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ data: [], hasMore: false })));
  await fireEvent.press(screen.getByRole('button', { name: 'Try again' }));
  await screen.findByText('No events found');
  expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
});

test('shows an offline notice instead of an endless loading indicator', async () => {
  onlineManager.setOnline(false);
  await renderWithProviders(<MyEventsScreen />);
  expect(await screen.findByText('You are offline. Events will load when you reconnect.')).toBeOnTheScreen();
  expect(fetchMock).not.toHaveBeenCalled();
});

test('loads details independently and displays a not-found error', async () => {
  fetchMock.mockResolvedValueOnce(new Response('', { status: 404 }));
  await renderWithProviders(<EventDetailsScreen eventId="missing" />);
  await screen.findByText('This item could not be found or is unavailable to you.');
  expect(screen.getByRole('button', { name: 'Back to My Events' })).toBeOnTheScreen();
});

test('prefers description blocks and displays all groups of event details', async () => {
  await renderWithProviders(<EventDetails event={{ ...event,
    description: 'Hidden legacy description', descriptionBlocks: [{ id: 1, type: 'text', content: '<p>Bring friends &amp; family.</p>' }],
    schedule: 'Multiple dates', multiDayStartTimes: ['2026-10-01T18:00:00Z'], multiDayEndTimes: ['2026-10-01T20:00:00Z'],
    itemsSold: 0, revenueCents: 0, minPriceCents: null, maxPriceCents: 2500, currency: 'CAD',
    location: { address: '123 Main Street', lat: 0, lng: 0 }, tags: ['Community'], customTags: ['Featured'],
    contentBlocks: [{ question: 'Can children attend?', answer: 'Everyone is welcome.' }],
    customTerms: { hasCustomTerms: true, type: 'text', content: '<p>No refunds.</p>' },
  }} />);
  expect(screen.queryByText('Hidden legacy description')).toBeNull();
  expect(screen.queryByText('No refunds.')).toBeNull();
  expect(screen.queryByText('evt-1')).toBeNull();
  await fireEvent.press(screen.getByRole('button', { name: 'Checkout', expanded: false }));
  await fireEvent.press(screen.getByRole('button', { name: 'Record information', expanded: false }));
  expect(screen.getAllByText('123 Main Street').length).toBeGreaterThan(0);
  for (const value of ['Bring friends & family.', 'Session 1', 'Community', 'Featured', 'Everyone is welcome.', 'No refunds.', 'evt-1']) {
    expect(screen.getByText(value)).toBeOnTheScreen();
  }
});

test('formats missing and zero prices correctly and keeps unsafe URLs inert', () => {
  expect(eventMoney(null, 'CAD')).toBe('Not provided');
  expect(eventMoney(0, 'CAD')).toContain('0.00');
  expect(eventMoney(2500)).toBe('25 (currency not provided)');
  expect(safeEventUrl('javascript:alert(1)')).toBeUndefined();
  expect(safeEventUrl('https://example.com/video')).toBe('https://example.com/video');
  expect(eventText('<p>Hello &amp; welcome</p><script>alert(1)</script><p>Next</p>')).toBe('Hello & welcome\nNext');
});

test.each(['', ' ', 'not a URL', 'https://', 'https://[', '/relative-image.jpg', 'https://user:password@example.com/image.jpg'])('rejects invalid external URLs without throwing: %j', value => {
  expect(safeEventUrl(value)).toBeUndefined();
});

test('renders unavailable-image fallbacks for empty and malformed gallery URLs', async () => {
  await renderWithProviders(<EventDetails event={{ ...event, images: ['', 'not a URL', 'https://['] }} />);
  for (const index of [1, 2, 3]) {
    expect(screen.getByText(`Gallery image ${index}: image unavailable.`)).toBeOnTheScreen();
  }
  expect(screen.getByRole('header', { name: 'Community night' })).toBeOnTheScreen();
});

test.each([288, 328, 358, 720])('keeps details within a narrow content width of %s', width => {
  const layout = eventDetailsLayout(width, 1);
  expect(layout.hasColumns).toBe(false);
  expect(layout.columnWidth).toBe(width);
  expect(layout.statWidth).toBeLessThanOrEqual(width);
});

test('uses measured column widths on desktop and stacks for large native text', () => {
  const wide = eventDetailsLayout(1072, 1);
  expect(wide.hasColumns).toBe(true);
  expect(wide.columnWidth * 2 + 20).toBe(1072);
  const largeText = eventDetailsLayout(1072, 1.5);
  expect(largeText.hasColumns).toBe(false);
  expect(largeText.columnWidth).toBe(1072);
  expect(largeText.statWidth).toBe(1072);
});

test('keeps long links, terms, and metadata available in expanded details', async () => {
  const url = `https://example.com/events/${'a'.repeat(180)}`;
  const terms = 'Long checkout conditions. '.repeat(30);
  await renderWithProviders(<EventDetails event={{ ...event, virtualEventLink: url, customTerms: { hasCustomTerms: true, type: 'text', content: terms } }} />);
  expect(screen.getByText(url)).toBeOnTheScreen();
  await fireEvent.press(screen.getByRole('button', { name: 'Checkout' }));
  expect(screen.getByText(terms.trim())).toBeOnTheScreen();
  await fireEvent.press(screen.getByRole('button', { name: 'Record information' }));
  expect(screen.getByText(event.id)).toBeOnTheScreen();
});
