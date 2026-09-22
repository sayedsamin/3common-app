import CommerceCheckoutRoute from '@/app/commerce/checkouts/[checkoutId]';
import { checkout as commerceCheckout, checkoutId as commerceCheckoutId, checkoutListItem, page as checkoutPage } from '@/modules/commerce/checkouts/test-fixtures';
import SegmentRoute from '@/app/crm/segments/[segmentId]';
import EditSegmentRoute from '@/app/crm/segments/[segmentId]/edit';
import SegmentMembersRoute from '@/app/crm/segments/[segmentId]/members';
import NewSegmentRoute from '@/app/crm/segments/new';
import { segment, id as segmentId, page as segmentPage } from '@/modules/crm/segments/test-fixtures';
import { renderRouter, screen, fireEvent } from 'expo-router/testing-library';
import { within } from '@testing-library/react-native';
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
import InvoiceRoute from '@/app/commerce/invoices/[invoiceId]';
import EditInvoiceRoute from '@/app/commerce/invoices/[invoiceId]/edit';
import NewInvoiceRoute from '@/app/commerce/invoices/new';
import { invoice } from '@/modules/invoices/test-fixtures';
import { contact, updatedContact, activity, page, response } from '@/modules/crm/test-fixtures';
import { queryClient } from '@/lib/query-client';

import DrawerLayout from '@/app/(app)/_layout';
import TabLayout from '@/app/(app)/(tabs)/_layout';
import IndexRoute from '@/app/(app)/(tabs)/index';
import { ProfileScreen } from '@/modules/profile';
import { AIScreen } from '@/modules/ai';
import { SettingsScreen } from '@/modules/settings';
import { HelpScreen } from '@/modules/help';
import { AboutScreen } from '@/modules/about';
import { navigationSections } from '@/constants/navigation';
import { MyEventsScreen, CollectionsScreen, SeatingChartsScreen, WaitlistsScreen, AffiliateSellersScreen } from '@/modules/events';
import { EmailsScreen, FormsScreen, SocialMediaScreen, QRCodeGeneratorScreen } from '@/modules/marketing';
import { ContactsScreen, PropertiesScreen, SegmentsScreen } from '@/modules/crm';
import { ProductsScreen, PromoCodesScreen, CheckoutsScreen } from '@/modules/commerce';
import { InvoicesScreen } from '@/modules/invoices';
import { DashboardScreen } from '@/modules/analytics';
import { BankingScreen, RefundsScreen, TopUpsScreen, DisputesScreen } from '@/modules/finance';
import { OrdersScreen } from '@/modules/orders';
import CheckoutRoute from '@/app/finance/orders/checkout/[productSetId]';
import { order, checkout } from '@/modules/orders/test-fixtures';

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
  'commerce/checkouts/[checkoutId]': CommerceCheckoutRoute,
  'crm/segments/[segmentId]': SegmentRoute,
  'crm/segments/[segmentId]/edit': EditSegmentRoute,
  'crm/segments/[segmentId]/members': SegmentMembersRoute,
  'crm/segments/new': NewSegmentRoute,
  'finance/orders/checkout/[productSetId]': CheckoutRoute,
  'commerce/invoices/[invoiceId]': InvoiceRoute,
  'commerce/invoices/[invoiceId]/edit': EditInvoiceRoute,
  'commerce/invoices/new': NewInvoiceRoute,
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
  '(app)/(tabs)/index': IndexRoute, '(app)/(tabs)/profile': ProfileScreen, '(app)/(tabs)/ai': AIScreen,
  settings: SettingsScreen, help: HelpScreen, about: AboutScreen,
};

test.each(['/commerce/invoices/new', '/commerce/invoices/invoice-1', '/commerce/invoices/invoice-1/edit'])('protects invoice deep link %s', async initialUrl => {
  jest.mocked(SecureStore.getItemAsync).mockResolvedValue(null);
  await renderRouter(routes, { initialUrl });
  expect(await screen.findByLabelText('API key')).toBeOnTheScreen();
  expect(fetchMock).not.toHaveBeenCalled();
});

test('opens invoices, edits a draft and displays the saved details', async () => {
  let current = invoice;
  fetchMock.mockImplementation(async (url, options) => {
    if (options?.method === 'PATCH') { current = { ...current, notes: 'Updated note' }; return response({ data: current }); }
    return response(String(url).includes('/invoices/invoice-1') ? { data: current } : { data: [current], hasMore: false });
  });
  await renderRouter(routes, { initialUrl: '/commerce/invoices' });
  await fireEvent.press(await screen.findByRole('button', { name: 'View invoice invoice-1' }));
  await fireEvent.press(await screen.findByRole('button', { name: 'Edit draft' }));
  await fireEvent.changeText(await screen.findByLabelText('Notes'), 'Updated note');
  await fireEvent.press(screen.getByRole('button', { name: 'Save changes' }));
  expect(await screen.findByText('Notes: Updated note')).toBeOnTheScreen();
  expect(fetchMock.mock.calls.find(([, options]) => options?.method === 'PATCH')?.[1]?.body).toBe('{"notes":"Updated note"}');
});

test('invoice detail deep links provide a back path to the list', async () => {
  fetchMock.mockImplementation(async url => response(String(url).includes('/invoices/invoice-1') ? { data: invoice } : { data: [invoice], hasMore: false }));
  await renderRouter(routes, { initialUrl: '/commerce/invoices/invoice-1' });
  await screen.findByText('Invoice invoice-1');
  await fireEvent.press(screen.getByRole('button', { name: 'Back' }));
  expect(await screen.findByRole('button', { name: 'View invoice invoice-1' })).toBeOnTheScreen();
});

test('opens destinations directly from Home and returns from workspace settings', async () => {
  await renderRouter(routes);
  await screen.findByRole('header', { name: 'Your workspace' });
  for (const section of navigationSections) {
    for (const item of section.items) expect(screen.getByRole('link', { name: item.title })).toBeOnTheScreen();
  }
  await fireEvent.press(screen.getByRole('link', { name: 'Settings' }));
  expect(await screen.findByRole('header', { name: 'API access' })).toBeOnTheScreen();
  await fireEvent.press(screen.getByRole('button', { name: 'Back' }));
  await fireEvent.press(await screen.findByRole('link', { name: 'Contacts' }));
  expect(await screen.findByRole('header', { name: 'Contacts' })).toBeOnTheScreen();
  expect(await screen.findByText('No contacts found')).toBeOnTheScreen();
});

test('retains bottom tabs, hides unfinished sidebar destinations, and returns from Settings', async () => {
  await renderRouter(routes);
  expect(await screen.findByRole('tab', { name: 'Home', selected: true })).toBeOnTheScreen();
  for (const name of ['Profile', 'AI', 'Home']) {
    await fireEvent.press(screen.getByRole('tab', { name }));
    expect(screen.getByRole('tab', { name, selected: true })).toBeOnTheScreen();
  }
  await fireEvent.press(screen.getByRole('button', { name: 'Open menu' }));
  for (const name of ['Home', 'Profile', 'AI', 'Help', 'About', 'Collections', 'Seating Charts', 'Waitlists', 'Affiliate Sellers', 'Forms', 'Social Media', 'QR Code Generator', 'Properties', 'Products', 'Promo Codes', 'Dashboard', 'Banking', 'Refunds', 'Top ups', 'Disputes']) {
    expect(screen.queryByRole('button', { name })).toBeNull();
  }
  expect(screen.queryByRole('header', { name: 'Analytics' })).toBeNull();
  await fireEvent.press(screen.getByRole('button', { name: 'Settings' }));
  expect(await screen.findByRole('header', { name: 'API access' })).toBeOnTheScreen();
  await fireEvent.press(screen.getByRole('button', { name: 'Back' }));
  expect(await screen.findByRole('tab', { name: 'Home', selected: true })).toBeOnTheScreen();
});

test.each(['settings', 'help', 'about'])('direct /%s links return Home when there is no history', async (route) => {
  await renderRouter(routes, { initialUrl: `/${route}` });
  await fireEvent.press(await screen.findByRole('button', { name: 'Back' }));
  expect(await screen.findByRole('tab', { name: 'Home', selected: true })).toBeOnTheScreen();
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
      expect(within(screen.getByTestId('navigation-menu')).getByRole('header', { name: section.title })).toBeOnTheScreen();
      await fireEvent.press(screen.getByRole('button', { name: item.title }));
      expect(await screen.findByRole('header', { name: item.title })).toBeOnTheScreen();
      if (item.title === 'My Events') expect(await screen.findByText('No events found')).toBeOnTheScreen();
      else if (item.title === 'Segments') expect(await screen.findByText('No segments found')).toBeOnTheScreen();
      else if (item.title === 'Checkouts') expect(await screen.findByText('No checkouts found')).toBeOnTheScreen();
      else if (item.title === 'Contacts') expect(await screen.findByText('No contacts found')).toBeOnTheScreen();
      else if (item.title === 'Emails') expect(await screen.findByText('No emails found')).toBeOnTheScreen();
      else if (item.title === 'Invoices') expect(await screen.findByText('No invoices found')).toBeOnTheScreen();
      else if (item.title === 'Orders') expect(await screen.findByText('No orders found')).toBeOnTheScreen();
      else expect(screen.getByText('In progress')).toBeOnTheScreen();
  }
  await fireEvent.press(screen.getByRole('button', { name: 'Open menu' }));
  await fireEvent.press(screen.getByRole('button', { name: 'My Events' }));
  expect(await screen.findByRole('header', { name: 'My Events' })).toBeOnTheScreen();
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

 test('opens checkout details by product set and returns to Orders', async () => {
  fetchMock.mockImplementation(async url => response(String(url).includes('/checkout/') ? { data: checkout } : { data: [order], hasMore: false }));
  await renderRouter(routes, { initialUrl: '/finance/orders' });
  await fireEvent.press(await screen.findByRole('button', { name: 'View checkout details for order-1' }));
  expect(await screen.findByText('Product set: set-1')).toBeOnTheScreen();
  expect(fetchMock.mock.calls.some(([url]) => String(url).endsWith('/orders/checkout/set-1/details'))).toBe(true);
  await fireEvent.press(screen.getByRole('button', { name: 'Back' }));
  expect(await screen.findByRole('button', { name: 'View checkout details for order-1' })).toBeOnTheScreen();
});

test('checkout deep links are protected', async () => {
  jest.mocked(SecureStore.getItemAsync).mockResolvedValue(null);
  await renderRouter(routes, { initialUrl: '/finance/orders/checkout/set-1' });
  expect(await screen.findByLabelText('API key')).toBeOnTheScreen();
  expect(fetchMock).not.toHaveBeenCalled();
});

test('checkout deep links return to Orders without history', async () => {
  fetchMock.mockImplementation(async url => response(String(url).includes('/checkout/') ? { data: checkout } : { data: [order], hasMore: false }));
  await renderRouter(routes, { initialUrl: '/finance/orders/checkout/set-1' });
  await screen.findByText('Product set: set-1');
  await fireEvent.press(screen.getByRole('button', { name: 'Back' }));
  expect(await screen.findByRole('button', { name: 'View checkout details for order-1' })).toBeOnTheScreen();
});


test.each(['/crm/segments/new', '/crm/segments/' + segmentId, '/crm/segments/' + segmentId + '/edit', '/crm/segments/' + segmentId + '/members'])('protects segment deep link %s', async initialUrl => {
  jest.mocked(SecureStore.getItemAsync).mockResolvedValue(null);
  await renderRouter(routes, { initialUrl });
  expect(await screen.findByLabelText('API key')).toBeOnTheScreen();
  expect(fetchMock).not.toHaveBeenCalled();
});
test.each(['/crm/segments/bad', '/crm/segments/bad/edit', '/crm/segments/bad/members'])('rejects invalid segment link %s without fetching', async initialUrl => {
  await renderRouter(routes, { initialUrl });
  expect(await screen.findByText('This segment link is invalid.')).toBeOnTheScreen();
  expect(fetchMock).not.toHaveBeenCalled();
});
test('opens segment details, edits metadata, and browses members', async () => {
  let current = segment;
  fetchMock.mockImplementation(async (url, options) => {
    if (options?.method === 'PATCH') { current = { ...current, name: 'Renamed segment' }; return response({ segment: current }); }
    if (String(url).includes('/members')) return response(segmentPage([]));
    return response(String(url).includes('/segments/' + segmentId) ? { segment: current } : segmentPage([current]));
  });
  await renderRouter(routes, { initialUrl: '/crm/segments' });
  await fireEvent.press(await screen.findByRole('button', { name: 'View segment: ' + segment.name }));
  await fireEvent.press(await screen.findByRole('button', { name: 'Edit segment' }));
  await fireEvent.changeText(await screen.findByLabelText('Name'), 'Renamed segment');
  await fireEvent.press(screen.getByRole('button', { name: 'Save segment' }));
  await screen.findByRole('header', { name: 'Renamed segment' });
  await fireEvent.press(await screen.findByRole('button', { name: 'View members' }));
  expect(await screen.findByText('No members found')).toBeOnTheScreen();
});


test('protects the commerce checkout detail deep link', async () => {
  jest.mocked(SecureStore.getItemAsync).mockResolvedValue(null);
  await renderRouter(routes, { initialUrl: '/commerce/checkouts/' + commerceCheckoutId });
  expect(await screen.findByLabelText('API key')).toBeOnTheScreen();
  expect(fetchMock).not.toHaveBeenCalled();
});
test('invalid commerce checkout links never fetch', async () => {
  await renderRouter(routes, { initialUrl: '/commerce/checkouts/invalid' });
  expect(await screen.findByText('This checkout link is invalid.')).toBeOnTheScreen();
  expect(fetchMock).not.toHaveBeenCalled();
});
test('opens commerce checkout details and returns to its list', async () => {
  fetchMock.mockImplementation(async url => response(String(url).includes('/checkouts/' + commerceCheckoutId) ? { checkout: commerceCheckout } : checkoutPage([checkoutListItem])));
  await renderRouter(routes, { initialUrl: '/commerce/checkouts' });
  await fireEvent.press(await screen.findByRole('button', { name: 'View checkout: ' + commerceCheckout.name }));
  expect(await screen.findByRole('header', { name: commerceCheckout.name })).toBeOnTheScreen();
  await fireEvent.press(screen.getByRole('button', { name: 'Back' }));
  expect(await screen.findByRole('button', { name: 'View checkout: ' + commerceCheckout.name })).toBeOnTheScreen();
});
test('commerce checkout direct detail links have a back path', async () => {
  fetchMock.mockImplementation(async url => response(String(url).includes('/checkouts/' + commerceCheckoutId) ? { checkout: commerceCheckout } : checkoutPage([checkoutListItem])));
  await renderRouter(routes, { initialUrl: '/commerce/checkouts/' + commerceCheckoutId });
  await screen.findByRole('header', { name: commerceCheckout.name });
  await fireEvent.press(screen.getByRole('button', { name: 'Back' }));
  expect(await screen.findByRole('button', { name: 'View checkout: ' + commerceCheckout.name })).toBeOnTheScreen();
});
