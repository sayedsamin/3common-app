import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react-native';
import * as SecureStore from 'expo-secure-store';
import { renderWithProviders } from '@/test/render';
import { setApiKey } from '@/lib/api-session';
import { getEvents } from '../api';
import { eventsKeys } from '../queries';
import { buildFilterGroup, eventFilterInput, eventFilterError, newCondition, type ConditionDraft } from '../filter-schemas';
import { MyEventsScreen } from '../screens/MyEventsScreen';

const fetchMock = jest.spyOn(globalThis, 'fetch');
const input = { page: 0, pageSize: 20, search: '', sortField: 'start' as const, sortDirection: 'desc' as const };
beforeEach(() => {
  setApiKey('test-key');
  jest.mocked(SecureStore.getItemAsync).mockResolvedValue('test-key');
  fetchMock.mockReset().mockImplementation(async () => new Response(JSON.stringify({ data: [{ id: 'event-1', name: 'Community night' }], hasMore: true })));
});
afterEach(async () => { await cleanup(); setApiKey(null); });

test('sends inclusive UTC date bounds and nested filters, with distinct query keys', async () => {
  const filters = [{ logic: 'and' as const, conditions: [
    { field: 'status', operator: 'is_any_of' as const, value: ['open', 'closed'] },
    { logic: 'or' as const, conditions: [{ field: 'ticketSum', operator: 'is_greater_than' as const, value: 10 }] },
  ] }];
  const dates = eventFilterInput({ startAfter: '2026-10-01', startBefore: '2026-10-31' });
  await getEvents({ ...input, ...dates, filters });
  const params = new URL(String(fetchMock.mock.calls[0]?.[0])).searchParams;
  expect(params.get('startAfter')).toBe('2026-10-01T00:00:00.000Z');
  expect(params.get('startBefore')).toBe('2026-10-31T23:59:59.999Z');
  expect(JSON.parse(params.get('filters') ?? '')).toEqual(filters);
  for (const change of [{ startAfter: dates.startAfter }, { startBefore: dates.startBefore }, { filters }]) {
    expect(eventsKeys.list({ ...input, ...change })).not.toEqual(eventsKeys.list(input));
  }
});

test.each<Record<string, string>>([
  { startAfter: '2026-02-30' }, { startAfter: '2026-10-31', startBefore: '2026-10-01' },
  { startBefore: '2026-10-01T12:00:00' },
])('rejects invalid or reversed dates %j', filters => expect(eventFilterError(filters)).toBeDefined());

test('normalizes offset timestamps and leaves absent filters out', () => {
  expect(eventFilterInput({ startAfter: '2026-10-01T12:00:00-05:00' }).startAfter).toBe('2026-10-01T17:00:00.000Z');
  expect(eventFilterInput({})).toEqual({ startAfter: undefined, startBefore: undefined, filters: undefined });
});

test.each<{ changes: Partial<ConditionDraft>; expected: unknown }>([
  { changes: { type: 'select', operator: 'is_any_of', value: 'open, closed' }, expected: ['open', 'closed'] },
  { changes: { type: 'text', operator: 'is_equal_to_any_of', value: 'Music, Food' }, expected: ['Music', 'Food'] },
  { changes: { type: 'number', operator: 'is_greater_than', value: '0' }, expected: 0 },
  { changes: { type: 'number', operator: 'is_between', value: '0', end: '10' }, expected: { start: 0, end: 10 } },
  { changes: { type: 'date', operator: 'is_between', value: '2026-10-01', end: '2026-10-02' }, expected: { start: '2026-10-01T00:00:00.000Z', end: '2026-10-02T23:59:59.999Z' } },
  { changes: { operator: 'is_empty' }, expected: undefined },
])('converts condition values to API types: $changes', ({ changes, expected }) => {
  const group = buildFilterGroup({ kind: 'group', logic: 'and', conditions: [{ ...newCondition(), ...changes }] });
  expect(group.conditions[0]).toEqual({ field: 'name', operator: changes.operator, ...(expected === undefined ? {} : { value: expected }) });
});

test.each<Partial<ConditionDraft>>([
  { value: '' }, { field: '', value: 'a' }, { type: 'number', operator: 'is_equal_to', value: 'abc' },
  { type: 'number', operator: 'is_between', value: '5', end: '2' }, { type: 'select', operator: 'is_any_of', value: ', ,' },
])('rejects incomplete advanced conditions %j', changes => {
  expect(() => buildFilterGroup({ kind: 'group', logic: 'and', conditions: [{ ...newCondition(), ...changes }] })).toThrow();
});

test('stages dates, validates, cancels, applies with pagination reset, and removes filters', async () => {
  await renderWithProviders(<MyEventsScreen />);
  await screen.findByRole('button', { name: 'View event: Community night' });
  await fireEvent.press(screen.getByRole('button', { name: 'Next' }));
  await waitFor(() => expect(new URL(String(fetchMock.mock.calls.at(-1)?.[0])).searchParams.get('page')).toBe('1'));
  await waitFor(() => expect(screen.queryByText('Loading events...')).toBeNull());
  await fireEvent.press(screen.getByRole('button', { name: 'Filters' }));
  const count = fetchMock.mock.calls.length;
  await fireEvent.changeText(screen.getByLabelText('Starts on or after'), '2026-02-30');
  expect(screen.getByRole('button', { name: 'Apply filters' })).toBeDisabled();
  await fireEvent.changeText(screen.getByLabelText('Starts on or after'), '2026-10-01');
  expect(fetchMock).toHaveBeenCalledTimes(count);
  await fireEvent.press(screen.getByRole('button', { name: 'Close options' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Filters' }));
  expect(screen.getByLabelText('Starts on or after')).toHaveDisplayValue('');
  await fireEvent.changeText(screen.getByLabelText('Starts on or after'), '2026-10-01');
  await fireEvent.press(screen.getByRole('button', { name: 'Apply filters' }));
  await waitFor(() => expect(new URL(String(fetchMock.mock.calls.at(-1)?.[0])).searchParams.get('startAfter')).toBe('2026-10-01T00:00:00.000Z'));
  expect(new URL(String(fetchMock.mock.calls.at(-1)?.[0])).searchParams.get('page')).toBe('0');
  await fireEvent.press(screen.getByRole('button', { name: 'Remove from 2026-10-01 filter' }));
  expect(screen.getByRole('button', { name: 'Filters' })).toBeOnTheScreen();
  await waitFor(() => expect(screen.queryByText('Refreshing events...')).toBeNull());
});

test('builds and applies advanced conditions and resets the complete filter draft', async () => {
  await renderWithProviders(<MyEventsScreen />);
  await screen.findByRole('button', { name: 'View event: Community night' });
  await fireEvent.press(screen.getByRole('button', { name: 'Filters' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Add advanced conditions' }));
  expect(screen.getByRole('button', { name: 'Apply filters' })).toBeDisabled();
  await fireEvent.press(screen.getByRole('button', { name: 'Group match: All conditions (AND)' }));
  await fireEvent.press(screen.getByRole('radio', { name: 'Group match: Any condition (OR)' }));
  await fireEvent.changeText(screen.getByLabelText('Group 1 value'), 'music & food');
  await fireEvent.press(screen.getByRole('button', { name: 'Apply filters' }));
  await waitFor(() => expect(new URL(String(fetchMock.mock.calls.at(-1)?.[0])).searchParams.has('filters')).toBe(true));
  await waitFor(() => expect(screen.queryByText('Loading events...')).toBeNull());
  expect(JSON.parse(new URL(String(fetchMock.mock.calls.at(-1)?.[0])).searchParams.get('filters') ?? '')).toEqual([{ logic: 'or', conditions: [{ field: 'name', operator: 'contains', value: 'music & food' }] }]);
  await fireEvent.press(screen.getByRole('button', { name: 'Filters (1)' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Reset' }));
  expect(screen.getByRole('button', { name: 'Add advanced conditions' })).toBeOnTheScreen();
  await fireEvent.press(screen.getByRole('button', { name: 'Apply filters' }));
  expect(screen.getByRole('button', { name: 'Filters' })).toBeOnTheScreen();
  await waitFor(() => expect(screen.queryByText('Refreshing events...')).toBeNull());
});
