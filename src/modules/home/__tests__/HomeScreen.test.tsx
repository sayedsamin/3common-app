import { screen, userEvent } from '@testing-library/react-native';
import { Uniwind } from 'uniwind';

import { renderWithProviders } from '@/test/render';

import { HomeScreen } from '../screens/HomeScreen';

test('renders the placeholder through the shared app providers', async () => {
  await renderWithProviders(<HomeScreen />);
  expect(screen.getByRole('header', { name: '3common' })).toBeOnTheScreen();
});

test('previews dark, light, and system themes', async () => {
  Uniwind.setTheme('system');
  await renderWithProviders(<HomeScreen />);
  const user = userEvent.setup();
  for (const mode of ['Dark', 'Light', 'System']) {
    await user.press(screen.getByRole('button', { name: `${mode} theme` }));
    expect(screen.getByRole('button', { name: `${mode} theme`, selected: true })).toBeOnTheScreen();
    expect(Uniwind.setTheme).toHaveBeenLastCalledWith(mode.toLowerCase());
  }
});
