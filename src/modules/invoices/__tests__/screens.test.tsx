import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react-native';
import { onlineManager } from '@tanstack/react-query';
import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';
import { renderWithProviders } from '@/test/render';
import { setApiKey } from '@/lib/api-session';
import { InvoicesScreen } from '../screens/InvoicesScreen';
import { InvoiceDetailsScreen } from '../screens/InvoiceDetailsScreen';
import { InvoiceForm } from '../components/InvoiceForm';
import { InvoiceActions } from '../components/InvoiceActions';
import { invoice, response } from '../test-fixtures';
import { contact, page } from '@/modules/crm/test-fixtures';

jest.mock('expo-router', () => ({ router: { push: jest.fn(), replace: jest.fn() } }));
jest.mock('@/hooks/useReducedMotion', () => ({ useReducedMotion: () => true }));
const fetchMock = jest.spyOn(globalThis, 'fetch');
beforeEach(() => {
  setApiKey('test-key'); jest.mocked(SecureStore.getItemAsync).mockResolvedValue('test-key');
  fetchMock.mockReset().mockImplementation(async url => response(String(url).includes('/contacts/') ? page([contact]) : { data: invoice }));
  jest.mocked(router.push).mockClear(); jest.mocked(router.replace).mockClear();
});
afterEach(async () => { await cleanup(); onlineManager.setOnline(true); setApiKey(null); });

test('paginates, applies filters, and opens invoice details', async () => {
  fetchMock.mockImplementation(async value => {
    const url = new URL(String(value));
    if (url.pathname.includes('/contacts/')) return response(page([contact]));
    return response({ data: [{ ...invoice, number: url.searchParams.get('page') === '1' ? 'INV-2' : 'INV-1' }], hasMore: url.searchParams.get('page') === '0' });
  });
  await renderWithProviders(<InvoicesScreen />);
  await screen.findByRole('button', { name: 'View invoice INV-1' });
  await fireEvent.press(screen.getByRole('button', { name: 'Next page' }));
  await screen.findByRole('button', { name: 'View invoice INV-2' });
  expect(screen.getByRole('button', { name: 'Next page' })).toBeDisabled();
  await fireEvent.press(screen.getByRole('button', { name: 'Invoice filters' }));
  await fireEvent.press(screen.getByRole('button', { name: 'draft' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Choose customer' }));
  await fireEvent.press(await screen.findByRole('radio', { name: /Select contact Alex River/ }));
  await fireEvent.press(screen.getByRole('button', { name: 'Apply filters' }));
  await screen.findByRole('button', { name: 'View invoice INV-1' });
  const url = new URL(String(fetchMock.mock.calls.at(-1)?.[0]));
  expect(url.searchParams.get('page')).toBe('0'); expect(url.searchParams.get('status')).toBe('draft'); expect(url.searchParams.get('customerId')).toBe(contact.id);
  await fireEvent.press(screen.getByRole('button', { name: 'View invoice INV-1' }));
  expect(router.push).toHaveBeenCalledWith({ pathname: '/commerce/invoices/[invoiceId]', params: { invoiceId: invoice.id } });
});

test('shows empty, error, retry and offline feedback', async () => {
  fetchMock.mockResolvedValueOnce(response({ error: { code: 'FORBIDDEN', message: 'private' } }, 403));
  await renderWithProviders(<InvoicesScreen />);
  await screen.findByText('You do not have permission to perform this action.');
  fetchMock.mockResolvedValueOnce(response({ data: [], hasMore: false }));
  await fireEvent.press(screen.getByRole('button', { name: 'Try again' }));
  await screen.findByText('No invoices found');
  await cleanup(); fetchMock.mockClear(); onlineManager.setOnline(false);
  await renderWithProviders(<InvoicesScreen />);
  await screen.findByText('You are offline. Invoices will load when you reconnect.');
  expect(fetchMock).not.toHaveBeenCalled();
});

test('selects a customer, prefills contact details, and creates a draft using exact cents', async () => {
  await renderWithProviders(<InvoiceForm />);
  expect(fetchMock).not.toHaveBeenCalled();
  await fireEvent.press(screen.getByRole('button', { name: 'Choose customer' }));
  await fireEvent.press(await screen.findByRole('radio', { name: /Select contact Alex River/ }));
  expect(screen.getByLabelText('Customer email')).toHaveDisplayValue('billing@example.com');
  expect(screen.getByLabelText('First name')).toHaveDisplayValue('Alex');
  expect(screen.getByLabelText('Last name')).toHaveDisplayValue('River');
  expect(screen.getByLabelText('Phone')).toHaveDisplayValue('5551234567');
  expect(screen.queryByLabelText('Search contacts')).toBeNull();
  await fireEvent.changeText(screen.getByLabelText('Customer email'), 'invoice@example.com');
  await fireEvent.changeText(screen.getByLabelText('Line 1 description'), 'Admission');
  await fireEvent.changeText(screen.getByLabelText('Line 1 unit price'), '10.29');
  await fireEvent.press(screen.getByRole('button', { name: 'Create draft' }));
  await waitFor(() => expect(router.replace).toHaveBeenCalled());
  const write = fetchMock.mock.calls.find(([, options]) => options?.method === 'POST');
  expect(JSON.parse(String(write?.[1]?.body))).toMatchObject({ customerId: contact.id, customerEmail: 'invoice@example.com', customerFirstName: 'Alex', customerLastName: 'River', customerPhone: '5551234567', currency: 'USD', autoCharge: false, lineItems: [{ description: 'Admission', quantity: 1, unitAmount: 1029 }] });
});

test('preserves draft input after failures and sends only changed fields', async () => {
  fetchMock.mockResolvedValueOnce(response({ error: { code: 'INVALID', message: 'Invalid' } }, 400));
  await renderWithProviders(<InvoiceForm invoice={invoice} />);
  await fireEvent.changeText(screen.getByLabelText('Notes'), 'Keep this note');
  await fireEvent.press(screen.getByRole('button', { name: 'Save changes' }));
  await screen.findByText('Check the information you entered and try again.');
  expect(screen.getByLabelText('Notes')).toHaveDisplayValue('Keep this note');
  expect(JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body))).toEqual({ notes: 'Keep this note' });
  expect(router.replace).not.toHaveBeenCalled();
});

test('changing an existing draft customer replaces recipient details but preserves invoice content', async () => {
  const next = { ...contact, billingEmail: undefined, phone: undefined };
  fetchMock.mockImplementation(async url => response(String(url).includes('/contacts/') ? page([next]) : { data: invoice }));
  await renderWithProviders(<InvoiceForm invoice={{ ...invoice, customerPhone: 'old-phone' }} />);
  expect(fetchMock).not.toHaveBeenCalled();
  await fireEvent.changeText(screen.getByLabelText('Notes'), 'Keep my notes');
  await fireEvent.press(screen.getByRole('button', { name: 'Choose customer' }));
  await fireEvent.press(await screen.findByRole('radio', { name: /Select contact Alex River/ }));
  expect(screen.getByLabelText('Customer email')).toHaveDisplayValue(contact.email);
  expect(screen.getByLabelText('Phone')).toHaveDisplayValue('');
  expect(screen.getByLabelText('Notes')).toHaveDisplayValue('Keep my notes');
  expect(screen.getByLabelText('Line 1 description')).toHaveDisplayValue('Admission');
  await fireEvent.press(screen.getByRole('button', { name: 'Save changes' }));
  await waitFor(() => expect(router.replace).toHaveBeenCalled());
  const write = fetchMock.mock.calls.find(([, options]) => options?.method === 'PATCH');
  expect(JSON.parse(String(write?.[1]?.body))).toEqual({ customerId: contact.id, customerEmail: contact.email, customerFirstName: 'Alex', customerLastName: 'River', customerPhone: '', notes: 'Keep my notes' });
});

test('validates draft form without issuing requests', async () => {
  await renderWithProviders(<InvoiceForm />);
  await fireEvent.press(screen.getByRole('button', { name: 'Create draft' }));
  await screen.findByText('Select a customer.');
  expect(fetchMock).not.toHaveBeenCalled();
});

test('details render payments and missing fields without enabling unknown actions', async () => {
  fetchMock.mockResolvedValueOnce(response({ data: { id: 'minimal' } }));
  await renderWithProviders(<InvoiceDetailsScreen invoiceId="minimal" />);
  await screen.findByText('Invoice minimal');
  expect(screen.queryByRole('button', { name: 'Record payment' })).toBeNull();
  expect(screen.queryByRole('button', { name: 'Edit draft' })).toBeNull();
  await cleanup();
  setApiKey('test-key');
  fetchMock.mockResolvedValueOnce(response({ data: { ...invoice, status: 'paid', payments: [{ id: 'p-1', status: 'succeeded', amount: 2100, paidAt: '2026-10-01T00:00:00Z', note: 'Cash payment' }] } }));
  await renderWithProviders(<InvoiceDetailsScreen invoiceId={invoice.id} />);
  await screen.findByText('Cash payment');
  expect(screen.queryByRole('button', { name: 'Void invoice' })).toBeNull();
  await screen.findByRole('button', { name: 'Send receipt' });
});

test('finalizing requires confirmation and sending email is opt-in', async () => {
  await renderWithProviders(<InvoiceActions invoice={invoice} />);
  await fireEvent.press(screen.getByRole('button', { name: 'Finalize invoice' }));
  expect(fetchMock).not.toHaveBeenCalled();
  const toggle = screen.getByLabelText('Send email when finalizing');
  expect(toggle.props.value).toBe(false);
  await fireEvent(toggle, 'valueChange', true);
  await fireEvent.press(screen.getByRole('button', { name: 'Confirm' }));
  await screen.findByText('Invoice finalized.');
  expect(String(fetchMock.mock.calls[0]?.[0])).toContain('/finalize?sendEmail=true');
});

test('partial payment retries retain the same idempotency key and input', async () => {
  fetchMock.mockRejectedValueOnce(new TypeError('connection interrupted'));
  await renderWithProviders(<InvoiceActions invoice={{ ...invoice, status: 'open' }} />);
  await fireEvent.press(screen.getByRole('button', { name: 'Record payment' }));
  await fireEvent.changeText(screen.getByLabelText('Payment amount'), '5.25');
  await fireEvent.changeText(screen.getByLabelText('Payment note (optional)'), 'Cash');
  await fireEvent.press(screen.getByRole('button', { name: 'Confirm' }));
  await screen.findByText('Unable to connect. Check your connection and try again.');
  expect(screen.getByLabelText('Payment amount')).toHaveDisplayValue('5.25');
  await fireEvent.press(screen.getByRole('button', { name: 'Confirm' }));
  await screen.findByText('Payment recorded.');
  const first = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body));
  expect(first).toMatchObject({ payment: 525, note: 'Cash', idempotencyKey: expect.any(String) });
  expect(JSON.parse(String(fetchMock.mock.calls[1]?.[1]?.body))).toEqual(first);
});

test.each([{ status: 'draft' as const, label: 'Delete draft', suffix: '', method: 'DELETE' }, { status: 'open' as const, label: 'Void invoice', suffix: '/void', method: 'POST' }, { status: 'paid' as const, label: 'Send receipt', suffix: '/send', method: 'POST' }])('$label performs the requested action after confirmation', async ({ status, label, suffix, method }) => {
  await renderWithProviders(<InvoiceActions invoice={{ ...invoice, status }} />);
  await fireEvent.press(screen.getByRole('button', { name: label }));
  expect(fetchMock).not.toHaveBeenCalled();
  await fireEvent.press(screen.getByRole('button', { name: 'Confirm' }));
  await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
  expect(String(fetchMock.mock.calls[0]?.[0])).toBe(`https://api.3common.com/v1/invoices/invoice-1${suffix}`);
  expect(fetchMock.mock.calls[0]?.[1]?.method).toBe(method);
});
