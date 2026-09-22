import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react-native';
import { onlineManager } from '@tanstack/react-query';
import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';
import { renderWithProviders } from '@/test/render';
import { setApiKey } from '@/lib/api-session';
import { SegmentsScreen } from '../screens/SegmentsScreen';
import { SegmentDetailsScreen, InvalidSegmentScreen } from '../screens/SegmentDetailsScreen';
import { CreateSegmentScreen, EditSegmentScreen } from '../screens/SegmentEditorScreen';
import { SegmentMembersScreen } from '../screens/SegmentMembersScreen';
import { contact } from '../../test-fixtures';
import { id, member, memberId, page, response, segment } from '../test-fixtures';

jest.mock('expo-router', () => ({ router: { replace: jest.fn(), push: jest.fn() } }));
const fetchMock = jest.spyOn(globalThis, 'fetch');
beforeEach(() => { setApiKey('test-key'); jest.mocked(SecureStore.getItemAsync).mockResolvedValue('test-key'); jest.mocked(router.replace).mockClear(); jest.mocked(router.push).mockClear(); fetchMock.mockReset(); });
afterEach(async () => { await cleanup(); onlineManager.setOnline(true); setApiKey(null); });

test('paginates, resets on target changes, and debounces search without stale results', async () => {
  fetchMock.mockImplementation(async value => { const n = Number(new URL(String(value)).searchParams.get('pageNumber')); return response(page([{ ...segment, name: n ? 'Page two' : segment.name }], n, !n)); });
  await renderWithProviders(<SegmentsScreen />);
  await screen.findByRole('button', { name: `View segment: ${segment.name}` });
  await fireEvent.press(screen.getByRole('button', { name: 'Next' }));
  await screen.findByRole('button', { name: 'View segment: Page two' });
  await fireEvent.press(screen.getByRole('button', { name: 'Filters' }));
  await fireEvent.press(screen.getByRole('radio', { name: 'Target type: Orders' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Apply filters' }));
  await screen.findByRole('button', { name: `View segment: ${segment.name}` });
  expect(new URL(String(fetchMock.mock.calls.at(-1)?.[0])).searchParams.get('pageNumber')).toBe('0');
  await fireEvent.changeText(screen.getByLabelText('Search'), 'New & old');
  expect(screen.queryByRole('button', { name: `View segment: ${segment.name}` })).toBeNull();
  await waitFor(() => expect(new URL(String(fetchMock.mock.calls.at(-1)?.[0])).searchParams.get('search')).toBe('New & old'));
});
test('recovers from errors to empty state and shows offline state without requests', async () => {
  fetchMock.mockResolvedValueOnce(response({}, 403));
  await renderWithProviders(<SegmentsScreen />);
  await screen.findByText('You do not have permission to perform this action.');
  fetchMock.mockResolvedValueOnce(response(page([])));
  await fireEvent.press(screen.getByRole('button', { name: 'Try again' }));
  await screen.findByText('No segments found');
  await cleanup(); fetchMock.mockClear(); onlineManager.setOnline(false);
  await renderWithProviders(<SegmentsScreen />);
  await screen.findByText('You are offline. Connect to load data.');
  expect(fetchMock).not.toHaveBeenCalled();
});
test('shared toolbar stages filters, validates folders, shows removable chips and applies sort', async () => {
  fetchMock.mockResolvedValue(response(page([segment])));
  await renderWithProviders(<SegmentsScreen />);
  await screen.findByRole('button', { name: `View segment: ${segment.name}` });
  expect(screen.queryByLabelText('Folder')).toBeNull();
  await fireEvent.press(screen.getByRole('button', { name: 'Filters' }));
  await fireEvent.press(screen.getByRole('radio', { name: 'Target type: Tickets' }));
  await fireEvent.changeText(screen.getByLabelText('Folder'), 'bad');
  expect(screen.getByRole('button', { name: 'Apply filters' })).toBeDisabled();
  expect(fetchMock).toHaveBeenCalledTimes(1);
  await fireEvent.press(screen.getByRole('button', { name: 'Close options' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Filters' }));
  expect(screen.getByLabelText('Folder')).toHaveDisplayValue('');
  await fireEvent.changeText(screen.getByLabelText('Folder'), 'unfiled');
  await fireEvent.press(screen.getByRole('button', { name: 'Apply filters' }));
  await waitFor(() => expect(new URL(String(fetchMock.mock.calls.at(-1)?.[0])).searchParams.get('folderId')).toBe('unfiled'));
  await fireEvent.press(screen.getByRole('button', { name: 'Remove unfiled filter' }));
  expect(screen.queryByRole('button', { name: 'Remove unfiled filter' })).toBeNull();
  await fireEvent.press(screen.getByRole('button', { name: 'Sort: Created date' }));
  await fireEvent.press(screen.getByRole('radio', { name: 'Sort by Member count' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Apply sort' }));
  await waitFor(() => expect(new URL(String(fetchMock.mock.calls.at(-1)?.[0])).searchParams.get('sortField')).toBe('memberCount'));
});
async function fillCreateForm() {
  await fireEvent.changeText(screen.getByLabelText('Name'), 'New segment');
  await fireEvent.press(screen.getByRole('button', { name: 'Add filter group' }));
  await fireEvent.changeText(screen.getByLabelText('Group 1 1 value'), '@example.com');
}
test('validates creation, renders a visual builder, and retains drafts on duplicate names', async () => {
  await renderWithProviders(<CreateSegmentScreen />);
  await fireEvent.press(screen.getByRole('button', { name: 'Create segment' }));
  await screen.findByText('Enter a segment name.'); expect(fetchMock).not.toHaveBeenCalled();
  await fillCreateForm();
  fetchMock.mockResolvedValueOnce(response({}, 409));
  await fireEvent.press(screen.getByRole('button', { name: 'Create segment' }));
  await screen.findByText('A segment with this name already exists for this target type. Choose another name.');
  expect(screen.getByLabelText('Name')).toHaveDisplayValue('New segment');
  expect(screen.getByLabelText('Group 1 1 value')).toHaveDisplayValue('@example.com');
  expect(router.replace).not.toHaveBeenCalled();
  fetchMock.mockResolvedValueOnce(response({ segment }));
  await fireEvent.changeText(screen.getByLabelText('Name'), 'Unique segment');
  await fireEvent.press(screen.getByRole('button', { name: 'Create segment' }));
  await waitFor(() => expect(router.replace).toHaveBeenCalled());
  expect(JSON.parse(String(fetchMock.mock.calls.at(-1)?.[1]?.body))).toMatchObject({ input: { name: 'Unique segment', filters: [{ logic: 'and', conditions: [{ field: 'email', operator: 'is_equal_to_any_of', value: ['@example.com'] }] }] } });
});
test('metadata-only editing preserves unsupported saved filters and excludes immutable fields', async () => {
  const saved = { ...segment, filters: [{ logic: 'and', conditions: [{ futureCondition: true }], extension: 'keep' }] };
  fetchMock.mockResolvedValueOnce(response({ segment: saved })).mockResolvedValue(response({ segment: { ...saved, name: 'Renamed' } }));
  await renderWithProviders(<EditSegmentScreen segmentId={id} />);
  await screen.findByText('These saved filters contain conditions this editor cannot represent. They will be preserved when you save other changes.');
  await fireEvent.changeText(screen.getByLabelText('Name'), 'Renamed');
  await fireEvent.press(screen.getByRole('button', { name: 'Save segment' }));
  await waitFor(() => expect(router.replace).toHaveBeenCalled());
  const patch = fetchMock.mock.calls.find(([, options]) => options?.method === 'PATCH');
  expect(JSON.parse(String(patch?.[1]?.body))).toEqual({ update: { name: 'Renamed' } });
});
test('prevents duplicate create submissions', async () => {
  let complete: ((value: Response) => void) | undefined;
  fetchMock.mockImplementationOnce(() => new Promise(resolve => { complete = resolve; }));
  await renderWithProviders(<CreateSegmentScreen />); await fillCreateForm();
  await fireEvent.press(screen.getByRole('button', { name: 'Create segment' }));
  await waitFor(() => expect(screen.getByRole('button', { name: 'Create segment' })).toBeDisabled());
  await fireEvent.press(screen.getByRole('button', { name: 'Create segment' }));
  expect(fetchMock).toHaveBeenCalledTimes(1);
  complete?.(response({ segment })); await waitFor(() => expect(router.replace).toHaveBeenCalled());
});
test('maps backend field errors without losing entered values', async () => {
  fetchMock.mockResolvedValueOnce(response({ error: { code: 'validation', message: 'invalid', details: { fieldErrors: { 'input.description': ['Enter a shorter description.'] } } } }, 422));
  await renderWithProviders(<CreateSegmentScreen />); await fillCreateForm();
  await fireEvent.changeText(screen.getByLabelText('Description'), 'Keep this draft');
  await fireEvent.press(screen.getByRole('button', { name: 'Create segment' }));
  await screen.findByText('Enter a shorter description.');
  expect(screen.getByLabelText('Description')).toHaveDisplayValue('Keep this draft');
  expect(router.replace).not.toHaveBeenCalled();
});
test('builds custom order filters with multiple groups and rejects empty filters', async () => {
  await renderWithProviders(<CreateSegmentScreen />);
  await fireEvent.changeText(screen.getByLabelText('Name'), 'Order segment');
  await fireEvent.press(screen.getByRole('button', { name: 'Target type: contact' }));
  await fireEvent.press(screen.getByRole('radio', { name: 'Target type: order' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Create segment' }));
  await screen.findByText('Check the form and add at least one valid filter group.');
  expect(fetchMock).not.toHaveBeenCalled();
  await fireEvent.press(screen.getByRole('button', { name: 'Add filter group' }));
  await fireEvent.changeText(screen.getByLabelText('Group 1 1 field name'), 'orderNumber');
  await fireEvent.changeText(screen.getByLabelText('Group 1 1 value'), 'ABC');
  await fireEvent.press(screen.getByRole('button', { name: 'Add filter group' }));
  await fireEvent.changeText(screen.getByLabelText('Group 2 1 field name'), 'status');
  await fireEvent.changeText(screen.getByLabelText('Group 2 1 value'), 'paid');
  fetchMock.mockResolvedValueOnce(response({ segment: { ...segment, targetType: 'order' } }));
  await fireEvent.press(screen.getByRole('button', { name: 'Create segment' }));
  await waitFor(() => expect(router.replace).toHaveBeenCalled());
  expect(JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body))).toMatchObject({ input: { targetType: 'order', filters: [
    { logic: 'and', conditions: [{ field: 'orderNumber', operator: 'is_equal_to_any_of', value: ['ABC'] }] },
    { logic: 'and', conditions: [{ field: 'status', operator: 'is_equal_to_any_of', value: ['paid'] }] },
  ] } });
});
test('conversion and deletion require confirmation and navigate only after success', async () => {
  let current = segment;
  fetchMock.mockImplementation(async (_, options) => {
    if (options?.method === 'POST') current = { ...segment, kind: 'static' };
    return response(options?.method === 'DELETE' ? { id, deleted: true } : { segment: current });
  });
  await renderWithProviders(<SegmentDetailsScreen segmentId={id} />);
  await fireEvent.press(await screen.findByRole('button', { name: 'Convert to static' }));
  expect(fetchMock.mock.calls.filter(([, options]) => options?.method === 'POST')).toHaveLength(0);
  await fireEvent.press(screen.getByRole('button', { name: 'Confirm conversion' }));
  await screen.findByText('Segment converted to static. Membership is now managed manually.');
  expect(screen.queryByRole('button', { name: 'Convert to static' })).toBeNull();
  await fireEvent.press(screen.getByRole('button', { name: 'Delete segment' }));
  expect(router.replace).not.toHaveBeenCalled();
  await fireEvent.press(screen.getByRole('button', { name: 'Confirm delete' }));
  await waitFor(() => expect(router.replace).toHaveBeenCalledWith('/crm/segments'));
});
test('active segments do not allow manual membership changes', async () => {
  fetchMock.mockImplementation(async url => response(String(url).includes('/members') ? page([member]) : { segment }));
  await renderWithProviders(<SegmentMembersScreen segmentId={id} />);
  await screen.findByText(memberId);
  expect(screen.queryByRole('button', { name: 'Add member' })).toBeNull();
  expect(screen.queryByRole('button', { name: `Remove member ${memberId}` })).toBeNull();
});
test('static order membership accepts IDs and reports no-op additions/removals', async () => {
  fetchMock.mockImplementation(async (url, options) => {
    if (options?.method === 'POST') return response({ inserted: false, memberCount: 1 });
    if (options?.method === 'DELETE') return response({ removed: false, memberCount: 1 });
    return response(String(url).includes('/members') ? page([member]) : { segment: { ...segment, kind: 'static', targetType: 'order', memberCount: 1 } });
  });
  await renderWithProviders(<SegmentMembersScreen segmentId={id} />);
  await screen.findByLabelText('Member ID');
  await fireEvent.changeText(screen.getByLabelText('Member ID'), memberId);
  await fireEvent.press(screen.getByRole('button', { name: 'Add member' }));
  await screen.findByText('This member already belongs to the segment.');
  await fireEvent.press(screen.getByRole('button', { name: `Remove member ${memberId}` }));
  await screen.findByText('This member was already absent.');
});
test('contact membership uses the existing searchable contact picker', async () => {
  fetchMock.mockImplementation(async url => {
    if (String(url).includes('/contacts/')) return response(page([{ ...contact, id: memberId }]));
    return response(String(url).includes('/members') ? page([]) : { segment: { ...segment, kind: 'static' } });
  });
  await renderWithProviders(<SegmentMembersScreen segmentId={id} />);
  await fireEvent.press(await screen.findByRole('button', { name: 'Choose member' }));
  const choice = await screen.findByRole('radio', { name: /Select contact Alex River/ });
  await fireEvent.press(choice);
  expect(screen.getByRole('button', { name: 'Choose member' })).toHaveTextContent(/Alex River/);
});
test('member lookup calls the endpoint only after valid submission', async () => {
  fetchMock.mockImplementation(async url => response(String(url).includes('/by-member/') ? { segments: [segment] } : page([])));
  await renderWithProviders(<SegmentsScreen />);
  await screen.findByText('No segments found');
  await fireEvent.press(screen.getByRole('button', { name: 'Find segments by member' }));
  await fireEvent.changeText(screen.getByLabelText('Member ID'), memberId);
  await fireEvent.press(screen.getByRole('button', { name: 'Find segments' }));
  await screen.findByRole('button', { name: `View segment: ${segment.name}` });
  expect(fetchMock.mock.calls.some(([url]) => String(url).includes(`/by-member/${memberId}`))).toBe(true);
});
test('invalid links never fetch', async () => {
  await renderWithProviders(<InvalidSegmentScreen />);
  expect(screen.getByText('This segment link is invalid.')).toBeOnTheScreen(); expect(fetchMock).not.toHaveBeenCalled();
});
