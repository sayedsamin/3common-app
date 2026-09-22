import { renderRouter, screen, fireEvent } from 'expo-router/testing-library';
import { Stack } from 'expo-router';

import DrawerLayout from '@/app/(app)/_layout';
import TabLayout from '@/app/(app)/(tabs)/_layout';
import { HomeScreen } from '@/modules/home';
import { ProfileScreen } from '@/modules/profile';
import { AIScreen } from '@/modules/ai';
import { SettingsScreen } from '@/modules/settings';
import { HelpScreen } from '@/modules/help';
import { AboutScreen } from '@/modules/about';
import { AppProviders } from '@/providers/AppProviders';
import { AppHeader } from '../AppHeader';

jest.mock('react-native-reanimated', () => jest.requireActual('react-native-reanimated/mock'));
jest.mock('react-native-drawer-layout', () => jest.requireActual('@/test/mocks/drawer-layout'));
jest.mock('@/hooks/useReducedMotion', () => ({ useReducedMotion: () => true }));

function Root() {
  return <AppProviders><Stack screenOptions={{ animation: 'none', headerShown: false }}>
    <Stack.Screen name="(app)" />
    {['settings', 'help', 'about'].map(name => <Stack.Screen key={name} name={name} options={{ headerShown: true, header: () => <AppHeader title={name} back /> }} />)}
  </Stack></AppProviders>;
}
const routes = {
  _layout: Root, '(app)/_layout': DrawerLayout, '(app)/(tabs)/_layout': TabLayout,
  '(app)/(tabs)/index': HomeScreen, '(app)/(tabs)/profile': ProfileScreen, '(app)/(tabs)/ai': AIScreen,
  settings: SettingsScreen, help: HelpScreen, about: AboutScreen,
};

test('switches tabs and returns from a utility page to the selected tab', async () => {
  await renderRouter(routes);
  expect(screen.getByRole('tab', { name: 'Home', selected: true })).toBeOnTheScreen();
  for (const name of ['AI', 'Profile']) {
    await fireEvent.press(screen.getByRole('tab', { name }));
    expect(screen.getByRole('tab', { name, selected: true })).toBeOnTheScreen();
  }
  await fireEvent.press(screen.getByRole('button', { name: 'Open menu' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Settings' }));
  expect(screen.getByRole('header', { name: 'Settings' })).toBeOnTheScreen();
  expect(screen.queryByRole('tab')).toBeNull();
  await fireEvent.press(screen.getByRole('button', { name: 'Back' }));
  expect(screen.getByRole('tab', { name: 'Profile', selected: true })).toBeOnTheScreen();
});

test.each(['settings', 'help', 'about'])('direct /%s links return Home when there is no history', async (route) => {
  await renderRouter(routes, { initialUrl: `/${route}` });
  await fireEvent.press(screen.getByRole('button', { name: 'Back' }));
  expect(screen.getByRole('tab', { name: 'Home', selected: true })).toBeOnTheScreen();
});
