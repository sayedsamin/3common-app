import { renderRouter, screen, fireEvent } from 'expo-router/testing-library';
import * as SecureStore from 'expo-secure-store';
import Root from '@/app/_layout';
import { SignInScreen } from '@/modules/auth';
import EventRoute from '@/app/events/[eventId]';
import EditEventRoute from '@/app/events/[eventId]/edit';
import ContactRoute from '@/app/crm/contacts/[contactId]';
import EditContactRoute from '@/app/crm/contacts/[contactId]/edit';
import ContactActivityRoute from '@/app/crm/contacts/[contactId]/activity';
import CreateContactRoute from '@/app/crm/contacts/new';
import EmailRoute from '@/app/marketing/emails/[emailId]';
import EditEmailRoute from '@/app/marketing/emails/[emailId]/edit';
import EmailEventsRoute from '@/app/marketing/emails/[emailId]/events';
import EmailActivityRoute from '@/app/marketing/emails/[emailId]/activity';
import NewEmailRoute from '@/app/marketing/emails/new';
import { contact, updatedContact, activity, page, response } from '@/modules/crm/test-fixtures';
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
  fetchMock.mockReset().mockImplementation(async () => new Response(JSON.stringify({ data: [], hasMore: false, pageNumber: 0, pageSize: 20 })));
});
afterEach(() => queryClient.clear());
const routes = {
  'marketing/emails/[emailId]': EmailRoute,
  'marketing/emails/[emailId]/edit': EditEmailRoute,
  'marketing/emails/[emailId]/events': EmailEventsRoute,
  'marketing/emails/[emailId]/activity': EmailActivityRoute,
  'marketing/emails/new': NewEmailRoute,
  'crm/contacts/[contactId]': ContactRoute,
  'crm/contacts/[contactId]/edit': EditContactRoute,
  'crm/contacts/[contactId]/activity': ContactActivityRoute,
  'crm/contacts/new': CreateContactRoute,
  'events/[eventId]/edit': EditEventRoute,
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
      else if (item.title === 'Contacts') expect(await screen.findByText('No contacts found')).toBeOnTheScreen();
      else if (item.title === 'Emails') expect(await screen.findByText('No emails found')).toBeOnTheScreen();
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

test('edits an event, protects unsaved changes, and refreshes details and list after save', async () => {
  let event = { id: 'event-1', name: 'Original name', status: 'open' };
  fetchMock.mockImplementation(async (url, options) => {
    if (options?.method === 'PATCH') {
      event = { ...event, name: 'Updated name' };
      return new Response(JSON.stringify({ data: event }));
    }
    return new Response(JSON.stringify(String(url).includes('/events/event-1') ? { data: event } : { data: [event], hasMore: false }));
  });
  await renderRouter(routes, { initialUrl: '/events/my-events' });
  await fireEvent.press(await screen.findByRole('button', { name: 'View event: Original name' }));
  await fireEvent.press(await screen.findByRole('button', { name: 'Edit event' }));
  await fireEvent.changeText(await screen.findByLabelText('Event name'), 'Updated name');
  await fireEvent.press(screen.getByRole('button', { name: 'Back' }));
  expect(await screen.findByRole('header', { name: 'Discard changes?' })).toBeOnTheScreen();
  await fireEvent.press(screen.getByRole('button', { name: 'Keep editing' }));
  expect(screen.getByLabelText('Event name')).toHaveDisplayValue('Updated name');
  await fireEvent.press(screen.getByRole('button', { name: 'Save changes' }));
  await screen.findByText('Event saved.');
  const write = fetchMock.mock.calls.find(([, options]) => options?.method === 'PATCH');
  expect(write?.[1]?.body).toBe('{"name":"Updated name"}');
  await fireEvent.press(screen.getByRole('button', { name: 'View event' }));
  expect(await screen.findByRole('header', { name: 'Updated name' })).toBeOnTheScreen();
  await fireEvent.press(screen.getByRole('button', { name: 'Back to My Events' }));
  expect(await screen.findByRole('button', { name: 'View event: Updated name' })).toBeOnTheScreen();
});

test('discards an edit opened by deep link and returns to its event', async () => {
  fetchMock.mockResolvedValue(new Response(JSON.stringify({ data: { id: 'event-1', name: 'Original name' } })));
  await renderRouter(routes, { initialUrl: '/events/event-1/edit' });
  await fireEvent.changeText(await screen.findByLabelText('Event name'), 'Unsaved name');
  await fireEvent.press(screen.getByRole('button', { name: 'Cancel' }));
  await fireEvent.press(await screen.findByRole('button', { name: 'Discard changes' }));
  expect(await screen.findByRole('header', { name: 'Original name' })).toBeOnTheScreen();
  expect(fetchMock.mock.calls.some(([, options]) => options?.method === 'PATCH')).toBe(false);
});


test('opens contact details, protects edits, refetches after PATCH and opens activity', async () => {
  let current = contact;
  fetchMock.mockImplementation(async (url, options) => {
    if (options?.method === 'PATCH') {
      current = { ...contact, firstName: 'Updated', fullName: 'Updated River' };
      return response({ data: { ...updatedContact, firstName: 'Updated', fullName: 'Updated River' } });
    }
    if (String(url).includes('/activity')) return response(page([activity]));
    return response(String(url).includes('/contacts/contact-1') ? { data: current } : page([current]));
  });
  await renderRouter(routes, { initialUrl: '/crm/contacts' });
  await fireEvent.press(await screen.findByRole('button', { name: 'View contact: Alex River' }));
  await fireEvent.press(await screen.findByRole('button', { name: 'Edit contact' }));
  await fireEvent.changeText(await screen.findByLabelText('First name'), 'Updated');
  await fireEvent.press(screen.getByRole('button', { name: 'Back' }));
  await fireEvent.press(await screen.findByRole('button', { name: 'Keep editing' }));
  expect(screen.getByLabelText('First name')).toHaveDisplayValue('Updated');
  await fireEvent.press(screen.getByRole('button', { name: 'Save changes' }));
  expect(await screen.findByRole('header', { name: 'Updated River' })).toBeOnTheScreen();
  await fireEvent.press(screen.getByRole('button', { name: 'View activity' }));
  expect(await screen.findByText('Email sent')).toBeOnTheScreen();
  await fireEvent.press(screen.getByRole('button', { name: 'Back' }));
  await fireEvent.press(await screen.findByRole('button', { name: 'Back to Contacts' }));
  expect(await screen.findByRole('button', { name: 'View contact: Updated River' })).toBeOnTheScreen();
});

test('contact creation deep links require authentication', async () => {
  jest.mocked(SecureStore.getItemAsync).mockResolvedValue(null);
  await renderRouter(routes, { initialUrl: '/crm/contacts/new' });
  expect(await screen.findByLabelText('API key')).toBeOnTheScreen();
  expect(screen.queryByLabelText('Email')).toBeNull();
  expect(fetchMock).not.toHaveBeenCalled();
});

test('direct contact detail links return to Contacts without history', async () => {
  fetchMock.mockImplementation(async url => response(String(url).includes('/contacts/contact-1') ? { data: contact } : page([contact])));
  await renderRouter(routes, { initialUrl: '/crm/contacts/contact-1' });
  expect(await screen.findByRole('header', { name: 'Alex River' })).toBeOnTheScreen();
  await fireEvent.press(screen.getByRole('button', { name: 'Back' }));
  expect(await screen.findByRole('button', { name: 'View contact: Alex River' })).toBeOnTheScreen();
});


test('email creation and report deep links require authentication', async () => {
  jest.mocked(SecureStore.getItemAsync).mockResolvedValue(null);
  await renderRouter(routes, { initialUrl: '/marketing/emails/new' });
  expect(await screen.findByLabelText('API key')).toBeOnTheScreen();
  expect(screen.queryByLabelText('Subject')).toBeNull();
  expect(fetchMock).not.toHaveBeenCalled();
});

test('email editor protects unsaved settings and preserves embedded content on save', async () => {
  let current = { id: 'email-1', subject: 'Original campaign', sent: false, data_version: 1, recipient_emails: ['person@example.com'], segment_refs: ['segment-1'] };
  fetchMock.mockImplementation(async (url, options) => {
    if (options?.method === 'PATCH') { current = { ...current, subject: 'Updated campaign' }; return response({ data: current }); }
    return response(String(url).includes('/email/email-1') ? { data: current } : page([current]));
  });
  await renderRouter(routes, { initialUrl: '/marketing/emails/email-1/edit' });
  await fireEvent.changeText(await screen.findByLabelText('Subject'), 'Updated campaign');
  await fireEvent.press(screen.getByRole('button', { name: 'Back' }));
  await fireEvent.press(await screen.findByRole('button', { name: 'Keep editing' }));
  expect(screen.getByLabelText('Subject')).toHaveDisplayValue('Updated campaign');
  await fireEvent.press(screen.getByRole('button', { name: 'Save campaign settings' }));
  expect(await screen.findByRole('header', { name: 'Email details' })).toBeOnTheScreen();
  expect(await screen.findByText('Updated campaign')).toBeOnTheScreen();
  expect(fetchMock.mock.calls.find(([, options]) => options?.method === 'PATCH')?.[1]?.body).toBe('{"subject":"Updated campaign"}');
});

test('email create validates recipients, selects a saved page and opens the created draft', async () => {
  const draft = { id: 'email-new', subject: 'New campaign', data_version: 2, page_id: 'page-1', sent: false };
  const content = { id: 'page-1', hostId: 'host-1', name: 'Existing page', medium: 'email', sections: [{ id: 's1', rows: { default: 1 }, elements: [] }], background: { type: 'color', color: '#ffffff' }, schemaVersion: 1, revisionCount: 0 };
  fetchMock.mockImplementation(async (url, options) => {
    const path = new URL(String(url)).pathname;
    if (path.endsWith('/pages/')) return response({ data: [{ id: content.id, name: content.name, medium: content.medium }], hasMore: false });
    if (path.endsWith('/pages/page-1')) return response({ data: content });
    if (options?.method === 'POST' || path.endsWith('/email/email-new')) return response({ data: draft });
    return response(page([]));
  });
  await renderRouter(routes, { initialUrl: '/marketing/emails/new' });
  await fireEvent.changeText(await screen.findByLabelText('Subject'), 'New campaign');
  await fireEvent.changeText(screen.getByLabelText('Recipient email addresses'), 'invalid');
  await fireEvent.press(screen.getByRole('button', { name: 'Create draft' }));
  expect(await screen.findByText('Enter valid email addresses separated by commas or new lines.')).toBeOnTheScreen();
  await fireEvent.changeText(screen.getByLabelText('Recipient email addresses'), 'person@example.com');
  await fireEvent.press(await screen.findByRole('button', { name: 'Existing page' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Create draft' }));
  expect(await screen.findByRole('header', { name: 'Email details' })).toBeOnTheScreen();
  const write = fetchMock.mock.calls.find(([, options]) => options?.method === 'POST');
  expect(JSON.parse(String(write?.[1]?.body))).toMatchObject({ subject: 'New campaign', page_id: 'page-1', recipient_emails: ['person@example.com'] });
});
