import { renderRouter, screen, fireEvent } from 'expo-router/testing-library';
import * as SecureStore from 'expo-secure-store';
import Root from '@/app/_layout';
import { SignInScreen } from '@/modules/auth';
import EventRoute from '@/app/events/[eventId]';
import { queryClient } from '@/lib/query-client';

import DrawerLayout from '@/app/(app)/_layout';
import TabLayout from '@/app/(app)/(tabs)/_layout';
import { HomeScreen } from '@/modules/home';
import { ProfileScreen } from '@/modules/profile';
import { AIScreen } from '@/modules/ai';
import { SettingsScreen } from '@/modules/settings';
import { HelpScreen } from '@/modules/help';
import { AboutScreen } from '@/modules/about';
import { navigationSections } from '@/constants/navigation';
import { MyEventsScreen, CollectionsScreen, SeatingChartsScreen, WaitlistsScreen, AffiliateSellersScreen } from '@/modules/events';
import { EmailsScreen, FormsScreen, SocialMediaScreen, QRCodeGeneratorScreen } from '@/modules/marketing';
import { ContactsScreen, PropertiesScreen, SegmentsScreen } from '@/modules/crm';
import { ProductsScreen, PromoCodesScreen, CheckoutsScreen, InvoicesScreen } from '@/modules/commerce';
import { DashboardScreen } from '@/modules/analytics';
import { BankingScreen, OrdersScreen, RefundsScreen, TopUpsScreen, DisputesScreen } from '@/modules/finance';

jest.mock('react-native-reanimated', () => jest.requireActual('react-native-reanimated/mock'));
jest.mock('react-native-drawer-layout', () => jest.requireActual('@/test/mocks/drawer-layout'));
jest.mock('@/hooks/useReducedMotion', () => ({ useReducedMotion: () => true }));
jest.mock('@/global.css', () => ({}));
jest.mock('@/hooks/useAppFonts', () => ({ useAppFonts: () => [true, null] }));
jest.mock('@/lib/sentry', () => ({ initializeSentry: jest.fn(), withSentry: (component: unknown) => component }));

const fetchMock = jest.spyOn(globalThis, 'fetch');
beforeEach(() => {
  queryClient.clear();
  jest.mocked(SecureStore.getItemAsync).mockResolvedValue('saved-key');
  fetchMock.mockReset().mockImplementation(async () => new Response(JSON.stringify({ data: [], hasMore: false })));
});
afterEach(() => queryClient.clear());
const routes = {
  'events/[eventId]': EventRoute,
  '(app)/events/my-events': MyEventsScreen,
  '(app)/events/collections': CollectionsScreen,
  '(app)/events/seating-charts': SeatingChartsScreen,
  '(app)/events/waitlists': WaitlistsScreen,
  '(app)/events/affiliate-sellers': AffiliateSellersScreen,
  '(app)/marketing/emails': EmailsScreen,
  '(app)/marketing/forms': FormsScreen,
  '(app)/marketing/social-media': SocialMediaScreen,
  '(app)/marketing/qr-code-generator': QRCodeGeneratorScreen,
  '(app)/crm/contacts': ContactsScreen,
  '(app)/crm/properties': PropertiesScreen,
  '(app)/crm/segments': SegmentsScreen,
  '(app)/commerce/products': ProductsScreen,
  '(app)/commerce/promo-codes': PromoCodesScreen,
  '(app)/commerce/checkouts': CheckoutsScreen,
  '(app)/commerce/invoices': InvoicesScreen,
  '(app)/analytics/dashboard': DashboardScreen,
  '(app)/finance/banking': BankingScreen,
  '(app)/finance/orders': OrdersScreen,
  '(app)/finance/refunds': RefundsScreen,
  '(app)/finance/top-ups': TopUpsScreen,
  '(app)/finance/disputes': DisputesScreen,
  '(auth)/sign-in': SignInScreen,
  _layout: Root, '(app)/_layout': DrawerLayout, '(app)/(tabs)/_layout': TabLayout,
  '(app)/(tabs)/index': HomeScreen, '(app)/(tabs)/profile': ProfileScreen, '(app)/(tabs)/ai': AIScreen,
  settings: SettingsScreen, help: HelpScreen, about: AboutScreen,
};

test('switches tabs and returns from a utility page to the selected tab', async () => {
  await renderRouter(routes);
  expect(await screen.findByRole('tab', { name: 'Home', selected: true })).toBeOnTheScreen();
  for (const name of ['AI', 'Profile']) {
    await fireEvent.press(screen.getByRole('tab', { name }));
    expect(screen.getByRole('tab', { name, selected: true })).toBeOnTheScreen();
  }
  await fireEvent.press(screen.getByRole('button', { name: 'Open menu' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Settings' }));
  expect(screen.getByRole('header', { name: 'API access' })).toBeOnTheScreen();
  expect(screen.queryByRole('tab')).toBeNull();
  await fireEvent.press(screen.getByRole('button', { name: 'Back' }));
  expect(screen.getByRole('tab', { name: 'Profile', selected: true })).toBeOnTheScreen();
});

test.each(['settings', 'help', 'about'])('direct /%s links return Home when there is no history', async (route) => {
  await renderRouter(routes, { initialUrl: `/${route}` });
  await fireEvent.press(await screen.findByRole('button', { name: 'Back' }));
  expect(screen.getByRole('tab', { name: 'Home', selected: true })).toBeOnTheScreen();
});

test('gates a deep link on first launch and opens the app after saving a key', async () => {
  jest.mocked(SecureStore.getItemAsync).mockResolvedValue(null);
  await renderRouter(routes, { initialUrl: '/settings' });
  const input = await screen.findByLabelText('API key');
  expect(screen.queryByText('API access')).toBeNull();
  await fireEvent.changeText(input, 'new-key');
  await fireEvent.press(screen.getByRole('button', { name: 'Continue' }));
  expect(await screen.findByRole('tab', { name: 'Home', selected: true })).toBeOnTheScreen();
  await fireEvent.press(screen.getByRole('button', { name: 'Open menu' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Settings' }));
  await fireEvent.press(await screen.findByRole('button', { name: 'Sign out and remove API key' }));
  expect(await screen.findByLabelText('API key')).toBeOnTheScreen();
  expect(screen.queryByRole('tab')).toBeNull();
});

test.each(navigationSections)('opens every $title sidebar page and keeps the menu available', async (section) => {
  await renderRouter(routes);
  await screen.findByRole('tab', { name: 'Home', selected: true });
  for (const item of section.items) {
      await fireEvent.press(screen.getByRole('button', { name: 'Open menu' }));
      expect(screen.getByRole('header', { name: section.title })).toBeOnTheScreen();
      await fireEvent.press(screen.getByRole('button', { name: item.title }));
      expect(await screen.findByRole('header', { name: item.title })).toBeOnTheScreen();
      if (item.title === 'My Events') expect(await screen.findByText('No events found')).toBeOnTheScreen();
      else expect(screen.getByText('In progress')).toBeOnTheScreen();
  }
  await fireEvent.press(screen.getByRole('button', { name: 'Open menu' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Home' }));
  expect(await screen.findByRole('tab', { name: 'Home', selected: true })).toBeOnTheScreen();
});

test('opens event details from the list and returns to My Events', async () => {
  const event = { id: 'event-1', name: 'Community night', status: 'open', description: '<p>Meet your neighbours.</p>', itemsSold: 12, revenueCents: 24000, currency: 'CAD' };
  fetchMock.mockImplementation(async url => new Response(JSON.stringify(String(url).includes('/events/event-1') ? { data: event } : { data: [event], hasMore: false })));
  await renderRouter(routes, { initialUrl: '/events/my-events' });
  await fireEvent.press(await screen.findByRole('button', { name: 'View event: Community night' }));
  expect(await screen.findByRole('header', { name: 'Community night' })).toBeOnTheScreen();
  expect(screen.getByText('Meet your neighbours.')).toBeOnTheScreen();
  await fireEvent.press(screen.getByRole('button', { name: 'Record information' }));
  expect(screen.getByText('event-1')).toBeOnTheScreen();
  await fireEvent.press(screen.getByRole('button', { name: 'Back' }));
  expect(await screen.findByRole('header', { name: 'My Events' })).toBeOnTheScreen();
});

test('an event detail deep link returns to My Events without history', async () => {
  fetchMock.mockImplementation(async url => new Response(JSON.stringify(String(url).includes('/events/event-1') ? { data: { id: 'event-1', name: 'Direct event' } } : { data: [], hasMore: false })));
  await renderRouter(routes, { initialUrl: '/events/event-1' });
  expect(await screen.findByRole('header', { name: 'Direct event' })).toBeOnTheScreen();
  await fireEvent.press(screen.getByRole('button', { name: 'Back' }));
  expect(await screen.findByRole('header', { name: 'My Events' })).toBeOnTheScreen();
});
