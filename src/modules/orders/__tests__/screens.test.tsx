import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react-native';
import { onlineManager } from '@tanstack/react-query';
import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';
import { renderWithProviders } from '@/test/render';
import { setApiKey } from '@/lib/api-session';
import { contact, page } from '@/modules/crm/test-fixtures';
import { OrdersScreen } from '../screens/OrdersScreen';
import { CheckoutDetailsScreen } from '../screens/CheckoutDetailsScreen';
import { OrderRow } from '../components/OrderRow';
import { RecordFields } from '../components/RecordFields';
import { checkout, order, response } from '../test-fixtures';

jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));
jest.mock('@/hooks/useReducedMotion', () => ({ useReducedMotion: () => true }));
const fetchMock = jest.spyOn(globalThis, 'fetch');
beforeEach(() => {
  setApiKey('test-key'); jest.mocked(SecureStore.getItemAsync).mockResolvedValue('test-key'); jest.mocked(router.push).mockClear();
  fetchMock.mockReset().mockImplementation(async url => response(String(url).includes('/contacts/') ? page([contact]) : String(url).includes('/checkout/') ? { data: checkout } : { data: [order], hasMore: false }));
});
afterEach(async () => { await cleanup(); onlineManager.setOnline(true); setApiKey(null); });

test('opens checkout using the product set reference and shows expandable order fields', async () => {
  await renderWithProviders(<OrdersScreen />);
  await fireEvent.press(await screen.findByRole('button', { name: 'View checkout details for order-1' }));
  expect(router.push).toHaveBeenCalledWith({ pathname: '/finance/orders/checkout/[productSetId]', params: { productSetId: 'set-1' } });
  await fireEvent.press(screen.getByRole('button', { name: 'Order information for order-1' }));
  expect(screen.getByText('javascript:alert(1)')).toBeOnTheScreen();
  expect(screen.queryByRole('link')).toBeNull();
});
test.each([undefined, '', '../set'])('does not invent checkout links for invalid product set reference %j', async product_set_id => {
  await renderWithProviders(<OrderRow order={{ ...order, product_set_id }} />);
  expect(screen.queryByRole('button', { name: 'View checkout details for order-1' })).toBeNull();
  expect(screen.getByText('Checkout details unavailable for this order.')).toBeOnTheScreen();
});

test('paginates and resets pagination when sorting changes', async () => {
  fetchMock.mockImplementation(async url => { const second = new URL(String(url)).searchParams.get('page') === '1'; return response({ data: [{ ...order, id: second ? 'order-2' : order.id }], hasMore: !second }); });
  await renderWithProviders(<OrdersScreen />);
  await screen.findByRole('button', { name: 'View checkout details for order-1' });
  await fireEvent.press(screen.getByRole('button', { name: 'Next orders' }));
  await screen.findByRole('button', { name: 'View checkout details for order-2' });
  expect(screen.getByRole('button', { name: 'Next orders' })).toBeDisabled();
  await fireEvent.press(screen.getByRole('button', { name: 'Newest first' }));
  await screen.findByRole('button', { name: 'View checkout details for order-1' });
  const url = new URL(String(fetchMock.mock.calls.at(-1)?.[0]));
  expect(url.searchParams.get('page')).toBe('0'); expect(url.searchParams.get('sortDirection')).toBe('asc');
});

test('selects a contact, applies false refund and advanced filters, and resets them', async () => {
  await renderWithProviders(<OrdersScreen />);
  await screen.findByRole('button', { name: 'View checkout details for order-1' });
  await fireEvent.press(screen.getByRole('button', { name: 'Order filters' }));
  await fireEvent.press(screen.getByRole('radio', { name: 'Order status: completed' }));
  await fireEvent.press(screen.getByRole('radio', { name: 'Order type: ticket' }));
  await fireEvent.press(screen.getByRole('radio', { name: 'Non-refunded only' }));
  await fireEvent.changeText(screen.getByLabelText('Exact order number'), 'ORD-42');
  await fireEvent(screen.getByLabelText('Paid/completed only'), 'valueChange', true);
  await fireEvent(screen.getByLabelText('Box-office only'), 'valueChange', true);
  await fireEvent.press(screen.getByRole('button', { name: 'Choose customer' }));
  await fireEvent.press(await screen.findByRole('radio', { name: /Select contact Alex River/ }));
  await fireEvent.press(screen.getByRole('button', { name: 'Advanced filters' }));
  await fireEvent.changeText(screen.getByLabelText('Event ID'), 'event-1');
  await fireEvent.press(screen.getByRole('button', { name: 'Apply filters' }));
  await waitFor(() => expect(new URL(String(fetchMock.mock.calls.at(-1)?.[0])).searchParams.get('refunded')).toBe('false'));
  const url = new URL(String(fetchMock.mock.calls.at(-1)?.[0]));
  for (const [key, value] of Object.entries({ page: '0', orderStatus: 'completed', type: 'ticket', orderNumber: 'ORD-42', status: 'true', isBoxOffice: 'true', contactId: contact.id, eventId: 'event-1' })) expect(url.searchParams.get(key)).toBe(value);
  await fireEvent.press(screen.getByRole('button', { name: 'Order filters' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Reset filters' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Refresh orders' }));
  await waitFor(() => expect(new URL(String(fetchMock.mock.calls.at(-1)?.[0])).searchParams.has('refunded')).toBe(false));
});

test('shows errors, supports retry, and displays empty orders', async () => {
  fetchMock.mockResolvedValueOnce(response({ error: { code: 'FORBIDDEN', message: 'private' } }, 403));
  await renderWithProviders(<OrdersScreen />);
  await screen.findByText('You do not have permission to perform this action.');
  fetchMock.mockResolvedValueOnce(response({ data: [], hasMore: false }));
  await fireEvent.press(screen.getByRole('button', { name: 'Try again' }));
  await screen.findByText('No orders found');
});
test('shows offline state without indefinite loading or requests', async () => {
  onlineManager.setOnline(false);
  await renderWithProviders(<OrdersScreen />);
  await screen.findByText('You are offline. Orders will load when you reconnect.');
  expect(fetchMock).not.toHaveBeenCalled();
});

test('renders checkout sections and expands flexible records safely', async () => {
  await renderWithProviders(<CheckoutDetailsScreen productSetId="set-1" />);
  await fireEvent.press(await screen.findByRole('button', { name: 'Details: set-1' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Products By Type (1)' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Ticket (1)' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Item 1 (2)' }));
  expect(screen.getByText('Admission')).toBeOnTheScreen();
  await fireEvent.press(screen.getByRole('tab', { name: 'Inventory' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Details: product-1' }));
  expect(screen.getByText('12')).toBeOnTheScreen(); expect(screen.getByText('No')).toBeOnTheScreen();
  await fireEvent.press(screen.getByRole('tab', { name: 'Orders' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Details: raw-order-1' }));
  expect(screen.getByText('5250')).toBeOnTheScreen(); expect(screen.getByText('Unavailable')).toBeOnTheScreen();
  await fireEvent.press(screen.getByRole('tab', { name: 'Tickets' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Details: ticket-1' }));
  expect(screen.getByText('<b>Untrusted markup</b>')).toBeOnTheScreen();
});
test('shows an independent empty state for each checkout section', async () => {
  fetchMock.mockResolvedValueOnce(response({ data: { products: { mode: 'product-set', data: [], inventoryByProductId: {} }, orders: [], tickets: [] } }));
  await renderWithProviders(<CheckoutDetailsScreen productSetId="empty" />);
  await screen.findByText('No products found');
  for (const section of ['Inventory', 'Orders', 'Tickets']) { await fireEvent.press(screen.getByRole('tab', { name: section })); await screen.findByText(`No ${section.toLowerCase()} found`); }
});
test('incrementally reveals large arrays and preserves nulls and booleans', async () => {
  await renderWithProviders(<RecordFields value={{ values: Array.from({ length: 25 }, (_, index) => `value-${index}`) }} />);
  await fireEvent.press(screen.getByRole('button', { name: 'Values (25)' }));
  expect(screen.queryByText('value-24')).toBeNull();
  await fireEvent.press(screen.getByRole('button', { name: 'Show more fields (5 remaining)' }));
  expect(screen.getByText('value-24')).toBeOnTheScreen();
});
test('checkout not-found errors are actionable', async () => {
  fetchMock.mockResolvedValueOnce(response({}, 404));
  await renderWithProviders(<CheckoutDetailsScreen productSetId="missing" />);
  await screen.findByText('This item could not be found or is unavailable to you.');
});
