import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react-native';
import { onlineManager } from '@tanstack/react-query';
import * as SecureStore from 'expo-secure-store';
import { renderWithProviders } from '@/test/render';
import { setApiKey } from '@/lib/api-session';
import { ContactSelectInput } from '../components/ContactSelectInput';
import { contact, page, response } from '../test-fixtures';

const fetchMock = jest.spyOn(globalThis, 'fetch');
beforeEach(() => { setApiKey('test-key'); jest.mocked(SecureStore.getItemAsync).mockResolvedValue('test-key'); fetchMock.mockReset().mockImplementation(async () => response(page([contact]))); });
afterEach(async () => { await cleanup(); onlineManager.setOnline(true); setApiKey(null); });

test('loads only when opened, debounces remote search, hides obsolete matches, and selects a result', async () => {
  const onSelect = jest.fn();
  await renderWithProviders(<ContactSelectInput value="" onSelect={onSelect} />);
  expect(fetchMock).not.toHaveBeenCalled();
  await fireEvent.press(screen.getByRole('button', { name: 'Choose customer' }));
  await screen.findByRole('radio', { name: /Select contact Alex River/ });
  await fireEvent.changeText(screen.getByLabelText('Search contacts'), 'al');
  await fireEvent.changeText(screen.getByLabelText('Search contacts'), 'alex@example.com');
  expect(screen.queryByRole('radio', { name: /Select contact Alex River/ })).toBeNull();
  await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
  const url = new URL(String(fetchMock.mock.calls[1]?.[0]));
  expect(url.pathname).toBe('/v1/contacts/'); expect(url.searchParams.get('search')).toBe('alex@example.com');
  expect(url.searchParams.get('pageNumber')).toBe('0'); expect(url.searchParams.get('pageSize')).toBe('5');
  await fireEvent.press(await screen.findByRole('radio', { name: /Select contact Alex River/ }));
  expect(onSelect).toHaveBeenCalledWith(contact);
  expect(screen.queryByLabelText('Search contacts')).toBeNull();
});

test('pages contacts and resets pagination for a new search', async () => {
  fetchMock.mockImplementation(async value => { const url = new URL(String(value)); const number = Number(url.searchParams.get('pageNumber')); return response(page([{ ...contact, fullName: number ? 'Second Contact' : 'Alex River' }], number, !number)); });
  await renderWithProviders(<ContactSelectInput value="" onSelect={jest.fn()} />);
  await fireEvent.press(screen.getByRole('button', { name: 'Choose customer' }));
  await screen.findByRole('radio', { name: /Select contact Alex River/ });
  await fireEvent.press(screen.getByRole('button', { name: 'Next contacts' }));
  await screen.findByRole('radio', { name: /Select contact Second Contact/ });
  expect(screen.getByRole('button', { name: 'Next contacts' })).toBeDisabled();
  await fireEvent.changeText(screen.getByLabelText('Search contacts'), 'Alex');
  await screen.findByRole('radio', { name: /Select contact Alex River/ });
  expect(new URL(String(fetchMock.mock.calls.at(-1)?.[0])).searchParams.get('pageNumber')).toBe('0');
});

test('shows recoverable errors and empty results without changing the current customer', async () => {
  const onSelect = jest.fn();
  fetchMock.mockResolvedValueOnce(response({ error: { code: 'FORBIDDEN', message: 'Private' } }, 403));
  await renderWithProviders(<ContactSelectInput value={contact.id} selectedLabel="Existing customer" onSelect={onSelect} />);
  await fireEvent.press(screen.getByRole('button', { name: 'Choose customer' }));
  await screen.findByText('You do not have permission to perform this action.');
  fetchMock.mockResolvedValueOnce(response(page([])));
  await fireEvent.press(screen.getByRole('button', { name: 'Try again' }));
  await screen.findByText('No contacts found. Try another name or email.');
  expect(onSelect).not.toHaveBeenCalled();
  expect(screen.getByText('Existing customer')).toBeOnTheScreen();
});

test('shows offline state without requests', async () => {
  onlineManager.setOnline(false);
  await renderWithProviders(<ContactSelectInput value="" onSelect={jest.fn()} />);
  await fireEvent.press(screen.getByRole('button', { name: 'Choose customer' }));
  await screen.findByText('You are offline. Connect to search contacts.');
  expect(fetchMock).not.toHaveBeenCalled();
});
