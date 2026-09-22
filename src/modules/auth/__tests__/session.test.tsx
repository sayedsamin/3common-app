import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import * as SecureStore from 'expo-secure-store';
import { QueryClientProvider } from '@tanstack/react-query';
import { Button, Text } from '@/components/ui';
import { getApiKey } from '@/lib/api-session';
import { createQueryClient } from '@/lib/query-client';
import { SessionProvider, useSession } from '@/providers/SessionProvider';
import { renderWithProviders } from '@/test/render';
import { SignInScreen } from '../screens/SignInScreen';
import { SettingsScreen } from '@/modules/settings';

function SessionView() {
  const { status, retryRestore } = useSession();
  if (status === 'signedOut') return <SignInScreen />;
  if (status === 'signedIn') return <SettingsScreen />;
  return <><Text>{status}</Text><Button label="Retry restore" onPress={retryRestore} /></>;
}
beforeEach(() => {
  jest.mocked(SecureStore.getItemAsync).mockReset().mockResolvedValue(null);
  jest.mocked(SecureStore.setItemAsync).mockReset().mockResolvedValue();
  jest.mocked(SecureStore.deleteItemAsync).mockReset().mockResolvedValue();
});
test('first launch prompts, saves a normalized key, and opens the app', async () => {
  await renderWithProviders(<SessionView />);
  const input = await screen.findByLabelText('API key');
  expect(input.props.secureTextEntry).toBe(true);
  await fireEvent.changeText(input, '  test-key  ');
  await fireEvent.press(screen.getByRole('button', { name: 'Continue' }));
  await screen.findByText('API access');
  expect(SecureStore.setItemAsync).toHaveBeenCalledWith('threecommon.api-key', 'test-key', expect.any(Object));
  expect(getApiKey()).toBe('test-key');
});
test('restores a saved key without prompting and clears storage and cache on sign-out', async () => {
  jest.mocked(SecureStore.getItemAsync).mockResolvedValue('saved-key');
  const client = createQueryClient({ defaultOptions: { queries: { retry: false } } });
  await render(<QueryClientProvider client={client}><SessionProvider><SessionView /></SessionProvider></QueryClientProvider>);
  await screen.findByText('API access');
  client.setQueryData(['private-events'], [{ id: 1 }]);
  expect(getApiKey()).toBe('saved-key');
  await fireEvent.press(screen.getByRole('button', { name: 'Sign out and remove API key' }));
  await screen.findByLabelText('API key');
  expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('threecommon.api-key');
  expect(getApiKey()).toBeNull();
  expect(client.getQueryCache().getAll()).toHaveLength(0);
});
test('rejects blank input and preserves input when saving fails', async () => {
  await renderWithProviders(<SessionView />);
  await screen.findByLabelText('API key');
  await fireEvent.press(screen.getByRole('button', { name: 'Continue' }));
  await screen.findByText('Enter your API key.');
  expect(SecureStore.setItemAsync).not.toHaveBeenCalled();
  jest.mocked(SecureStore.setItemAsync).mockRejectedValueOnce(new Error('storage unavailable'));
  await fireEvent.changeText(screen.getByLabelText('API key'), 'test-key');
  await fireEvent.press(screen.getByRole('button', { name: 'Continue' }));
  await screen.findByText('Unable to save your API key. Please try again.');
  expect(screen.getByLabelText('API key').props.value).toBe('test-key');
  expect(getApiKey()).toBeNull();
});
test('offers retry after a storage read failure', async () => {
  jest.mocked(SecureStore.getItemAsync).mockRejectedValueOnce(new Error('locked'));
  await renderWithProviders(<SessionView />);
  await screen.findByText('error');
  await fireEvent.press(screen.getByRole('button', { name: 'Retry restore' }));
  await screen.findByLabelText('API key');
});
test('discards malformed persisted keys', async () => {
  jest.mocked(SecureStore.getItemAsync).mockResolvedValue('bad\nkey');
  await renderWithProviders(<SessionView />);
  await screen.findByLabelText('API key');
  expect(SecureStore.deleteItemAsync).toHaveBeenCalled();
  await waitFor(() => expect(getApiKey()).toBeNull());
});
test('keeps the active session if key deletion fails', async () => {
  jest.mocked(SecureStore.getItemAsync).mockResolvedValue('saved-key');
  jest.mocked(SecureStore.deleteItemAsync).mockRejectedValueOnce(new Error('locked'));
  await renderWithProviders(<SessionView />);
  await screen.findByText('API access');
  await fireEvent.press(screen.getByRole('button', { name: 'Sign out and remove API key' }));
  await screen.findByText('Unable to remove your saved key. Please try again.');
  expect(getApiKey()).toBe('saved-key');
});
