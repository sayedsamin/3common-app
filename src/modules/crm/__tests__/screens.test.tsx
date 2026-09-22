import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react-native';
import { onlineManager } from '@tanstack/react-query';
import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';
import { renderWithProviders } from '@/test/render';
import { setApiKey } from '@/lib/api-session';
import { ContactsScreen } from '../screens/ContactsScreen';
import { ContactDetailsScreen, InvalidContactScreen } from '../screens/ContactDetailsScreen';
import { ContactActivityScreen } from '../screens/ContactActivityScreen';
import { ContactForm } from '../components/ContactForm';
import { activity, contact, page, response, updatedContact } from '../test-fixtures';

jest.mock('expo-router', () => ({ useNavigation: () => ({ dispatch: jest.fn() }), router: { replace: jest.fn(), push: jest.fn() } }));
jest.mock('expo-router/react-navigation', () => ({ usePreventRemove: jest.fn() }));
const fetchMock = jest.spyOn(globalThis, 'fetch');
beforeEach(() => {
  setApiKey('test-key'); jest.mocked(SecureStore.getItemAsync).mockResolvedValue('test-key');
  jest.mocked(router.replace).mockClear(); fetchMock.mockReset().mockResolvedValue(response(page([contact])));
});
afterEach(async () => { await cleanup(); onlineManager.setOnline(true); setApiKey(null); });

test('paginates contacts and resets the page when applying a status filter', async () => {
  fetchMock.mockImplementation(async value => {
    const p = Number(new URL(String(value)).searchParams.get('pageNumber'));
    return response(page([{ ...contact, fullName: p ? 'Second contact' : contact.fullName }], p, p === 0));
  });
  await renderWithProviders(<ContactsScreen />);
  await screen.findByRole('button', { name: 'View contact: Alex River' });
  expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled();
  await fireEvent.press(screen.getByRole('button', { name: 'Next' }));
  await screen.findByRole('button', { name: 'View contact: Second contact' });
  expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
  await fireEvent.press(screen.getByRole('button', { name: 'Filters' }));
  await fireEvent.press(screen.getByRole('radio', { name: 'Primary filter: Imported' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Apply filters' }));
  await screen.findByRole('button', { name: 'View contact: Alex River' });
  const url = new URL(String(fetchMock.mock.calls.at(-1)?.[0]));
  expect(url.searchParams.get('pageNumber')).toBe('0'); expect(url.searchParams.get('filter')).toBe('imported');
  expect(screen.getByRole('button', { name: 'Refresh contacts' })).toBeOnTheScreen();
});
test('debounces search, hides old results, and applies sorting remotely', async () => {
  await renderWithProviders(<ContactsScreen />);
  await screen.findByRole('button', { name: 'View contact: Alex River' });
  await fireEvent.changeText(screen.getByLabelText('Search'), 'Alex & River');
  expect(screen.queryByRole('button', { name: 'View contact: Alex River' })).toBeNull();
  await waitFor(() => expect(new URL(String(fetchMock.mock.calls.at(-1)?.[0])).searchParams.get('search')).toBe('Alex & River'));
  await fireEvent.press(screen.getByRole('button', { name: 'Sort: Most Recent Order' }));
  await fireEvent.press(screen.getByRole('radio', { name: 'Sort by Email' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Apply sort' }));
  await waitFor(() => expect(new URL(String(fetchMock.mock.calls.at(-1)?.[0])).searchParams.get('sortField')).toBe('email'));
});
test('shows permission errors safely and can retry to an empty list', async () => {
  fetchMock.mockResolvedValueOnce(response({ error: { code: 'forbidden', message: 'sensitive server text' } }, 403));
  await renderWithProviders(<ContactsScreen />);
  await screen.findByText('You do not have permission to perform this action.');
  expect(screen.queryByText('sensitive server text')).toBeNull();
  fetchMock.mockResolvedValueOnce(response(page([])));
  await fireEvent.press(screen.getByRole('button', { name: 'Try again' }));
  await screen.findByText('No contacts found');
});
test('shows an honest offline state without fetching', async () => {
  onlineManager.setOnline(false);
  await renderWithProviders(<ContactsScreen />);
  await screen.findByText('You are offline. Data will load when you reconnect.');
  expect(fetchMock).not.toHaveBeenCalled();
});
test('validates creation and sends only populated optional fields', async () => {
  fetchMock.mockResolvedValueOnce(response({ data: contact }));
  await renderWithProviders(<ContactForm />);
  await fireEvent.press(screen.getByRole('button', { name: 'Create contact' }));
  await screen.findByText('Enter a valid email address.'); expect(fetchMock).not.toHaveBeenCalled();
  await fireEvent.changeText(screen.getByLabelText('Email'), ' alex@example.com ');
  await fireEvent.press(screen.getByRole('button', { name: 'Create contact' }));
  await waitFor(() => expect(router.replace).toHaveBeenCalledWith({ pathname: '/crm/contacts/[contactId]', params: { contactId: contact.id } }));
  expect(JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body))).toEqual({ email: contact.email });
});
test('edit sends required fields and preserves explicit clearing intent', async () => {
  fetchMock.mockResolvedValueOnce(response({ data: updatedContact }));
  await renderWithProviders(<ContactForm contact={contact} />);
  expect(screen.getByRole('button', { name: 'Save changes' })).toBeDisabled();
  await fireEvent.changeText(screen.getByLabelText('Phone'), '');
  await fireEvent.changeText(screen.getByLabelText('Billing email'), '');
  await fireEvent.press(screen.getByRole('button', { name: 'Save changes' }));
  await waitFor(() => expect(router.replace).toHaveBeenCalled());
  expect(JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body))).toEqual({ contact: { firstName: 'Alex', lastName: 'River', email: contact.email, status: 'unknown', phone: null, billingEmail: '' } });
});
test('retains form values on a conflict and never automatically merges or retries', async () => {
  fetchMock.mockResolvedValueOnce(response({ error: { code: 'conflict', message: 'duplicate' } }, 409));
  await renderWithProviders(<ContactForm />);
  await fireEvent.changeText(screen.getByLabelText('Email'), contact.email);
  await fireEvent.press(screen.getByRole('button', { name: 'Create contact' }));
  await screen.findAllByText('A contact with this email already exists. Use a different email or open the existing contact.');
  expect(screen.getByLabelText('Email')).toHaveDisplayValue(contact.email);
  expect(fetchMock).toHaveBeenCalledTimes(1); expect(router.replace).not.toHaveBeenCalled();
});
test('maps validated backend field errors and preserves drafts', async () => {
  fetchMock.mockResolvedValueOnce(response({ error: { code: 'validation', message: 'invalid', details: { fieldErrors: { 'contact.firstName': ['Choose another name.'] } } } }, 422));
  await renderWithProviders(<ContactForm contact={contact} />);
  await fireEvent.changeText(screen.getByLabelText('First name'), 'Draft');
  await fireEvent.press(screen.getByRole('button', { name: 'Save changes' }));
  await screen.findByText('Choose another name.');
  expect(screen.getByLabelText('First name')).toHaveDisplayValue('Draft');
});
test('prevents duplicate submissions while creating', async () => {
  let complete: ((value: Response) => void) | undefined;
  fetchMock.mockImplementationOnce(() => new Promise(resolve => { complete = resolve; }));
  await renderWithProviders(<ContactForm />);
  await fireEvent.changeText(screen.getByLabelText('Email'), contact.email);
  await fireEvent.press(screen.getByRole('button', { name: 'Create contact' }));
  await waitFor(() => expect(screen.getByRole('button', { name: 'Create contact' })).toBeDisabled());
  await fireEvent.press(screen.getByRole('button', { name: 'Create contact' }));
  expect(fetchMock).toHaveBeenCalledTimes(1);
  complete?.(response({ data: contact }));
  await waitFor(() => expect(router.replace).toHaveBeenCalled());
});
test('requires delete confirmation, retains failed deletions, and navigates only after success', async () => {
  fetchMock.mockResolvedValueOnce(response({ data: contact }));
  await renderWithProviders(<ContactDetailsScreen contactId={contact.id} />);
  await fireEvent.press(await screen.findByRole('button', { name: 'Delete contact' }));
  expect(fetchMock).toHaveBeenCalledTimes(1);
  expect(screen.getByText('Delete Alex River (alex@example.com)? This action cannot be undone.')).toBeOnTheScreen();
  fetchMock.mockResolvedValueOnce(response({}, 403));
  await fireEvent.press(screen.getByRole('button', { name: 'Confirm delete' }));
  await screen.findByText('You do not have permission to perform this action.');
  expect(router.replace).not.toHaveBeenCalled();
  fetchMock.mockResolvedValueOnce(response({ data: { id: contact.id } }));
  await fireEvent.press(screen.getByRole('button', { name: 'Confirm delete' }));
  await waitFor(() => expect(router.replace).toHaveBeenCalledWith('/crm/contacts'));
});
test('filters activity and reverses chronological order', async () => {
  fetchMock.mockResolvedValue(response(page([activity])));
  await renderWithProviders(<ContactActivityScreen contactId={contact.id} />);
  await screen.findByText('Email sent');
  await fireEvent.press(screen.getByRole('button', { name: 'Newest first' }));
  await waitFor(() => expect(new URL(String(fetchMock.mock.calls.at(-1)?.[0])).searchParams.get('sort')).toBe('oldest'));
  await fireEvent.press(screen.getByRole('button', { name: 'Activity type: All' }));
  await fireEvent.press(screen.getByRole('radio', { name: 'Email sent' }));
  await waitFor(() => expect(new URL(String(fetchMock.mock.calls.at(-1)?.[0])).searchParams.get('filter')).toBe('email_sent'));
});
test('invalid links never fetch', async () => {
  await renderWithProviders(<InvalidContactScreen />);
  expect(screen.getByText('This contact link is invalid.')).toBeOnTheScreen(); expect(fetchMock).not.toHaveBeenCalled();
});
test('missing contacts show a recoverable error', async () => {
  fetchMock.mockResolvedValueOnce(response({}, 404));
  await renderWithProviders(<ContactDetailsScreen contactId="missing" />);
  await screen.findByText('This contact could not be found or is no longer available.');
});
