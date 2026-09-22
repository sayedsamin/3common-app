import { screen } from '@testing-library/react-native';

import { renderWithProviders } from '@/test/render';

import { HomeScreen } from '../screens/HomeScreen';

test('renders the placeholder through the shared app providers', async () => {
  await renderWithProviders(<HomeScreen />);
  expect(screen.getByRole('header', { name: '3common' })).toBeOnTheScreen();
});
