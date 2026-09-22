import { act, cleanup, fireEvent, screen, waitFor } from '@testing-library/react-native';
import * as SecureStore from 'expo-secure-store';
import { getApiKey, setApiKey } from '@/lib/api-session';
import { renderWithProviders } from '@/test/render';
import { AIScreen } from '../screens/AIScreen';
import { resetChat, useChatStore } from '../store';
import { querySchema } from '../contracts';

jest.mock('@/lib/env', () => ({ env: { aiUrl: 'https://chat.example.com' } }));
jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));
const fetchMock = jest.spyOn(globalThis, 'fetch');
const response = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });
const query = querySchema.parse({ tool: 'list_events', input: { status: 'open' } });
const first = { query, cards: [{ id: 'event-1', kind: 'event', title: 'Community evening', subtitle: '2026-11-01', status: 'open' }], hasMore: true, nextQuery: querySchema.parse({ tool: 'list_events', input: { status: 'open', page: 1 } }) };
beforeEach(() => { resetChat(); fetchMock.mockReset(); jest.mocked(SecureStore.getItemAsync).mockResolvedValue('test-key'); });
afterEach(async () => { await cleanup(); resetChat(); setApiKey(null); });
async function renderChat() { await renderWithProviders(<AIScreen />); await waitFor(() => expect(getApiKey()).toBe('test-key')); }
async function send(text = 'Show open events') { await fireEvent.changeText(screen.getByLabelText('Message'), text); await fireEvent.press(screen.getByRole('button', { name: 'Send message' })); }

test('scope notice, result cards and pagination without another chat request', async () => {
  fetchMock.mockImplementation(async url => String(url).endsWith('/query') ? response({ ...first, cards: [{ ...first.cards[0], id: 'event-2', title: 'Second event' }], hasMore: false, nextQuery: undefined }) : response({ text: 'Here are your events.', results: [first] }));
  await renderChat(); expect(screen.getByText('Events & contacts only')).toBeTruthy();
  await send(); await screen.findByText('Community evening');
  await fireEvent.press(screen.getByRole('button', { name: 'Load more' })); await screen.findByText('Second event');
  expect(fetchMock.mock.calls.filter(([url]) => String(url).endsWith('/chat'))).toHaveLength(1);
  await fireEvent.press(screen.getByRole('button', { name: 'Filters' }));
  expect(screen.getByText(/Status: open/)).toBeTruthy();
});
test('failed POST preserves message and retry does not duplicate it', async () => {
  fetchMock.mockResolvedValueOnce(response({ error: { service: 'OpenAI', code: 'quota', message: 'Credits exhausted.' } }, 503)).mockResolvedValueOnce(response({ text: 'Recovered.', results: [] }));
  await renderChat(); await send(); await screen.findByText('OpenAI: Credits exhausted.');
  await fireEvent.press(screen.getByRole('button', { name: 'Retry' })); await screen.findByText('Recovered.');
  expect(screen.getAllByText('Show open events')).toHaveLength(1); expect(fetchMock).toHaveBeenCalledTimes(2);
});
test('follow-up includes bounded conversation and previous query', async () => {
  fetchMock.mockResolvedValue(response({ text: 'Here are your events.', results: [first] }));
  await renderChat(); await send(); await screen.findByText('Community evening'); await send('Only this month');
  await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
  const body = JSON.parse(String(fetchMock.mock.calls[1]?.[1]?.body));
  expect(body.context).toEqual([query]); expect(body.messages.at(-1).content).toBe('Only this month');
  await waitFor(() => expect(useChatStore.getState().isBusy).toBe(false));
});
test('new chat aborts requests and ignores late results', async () => {
  let resolve: ((value: Response) => void) | undefined;
  fetchMock.mockImplementation(() => new Promise<Response>(done => { resolve = done; }));
  await renderChat(); await send(); await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
  await fireEvent.press(screen.getByRole('button', { name: 'New chat' }));
  expect(fetchMock.mock.calls[0]?.[1]?.signal?.aborted).toBe(true);
  await act(async () => { resolve?.(response({ text: 'Old response', results: [first] })); });
  expect(screen.queryByText('Old response')).toBeNull(); expect(useChatStore.getState().messages).toHaveLength(0);
});
test('Stop preserves history and allows retry; duplicate sends are blocked', async () => {
  fetchMock.mockImplementation((_, init) => new Promise<Response>((_, reject) => { init?.signal?.addEventListener('abort', () => reject(new Error('aborted'))); }));
  await renderChat(); await send(); await screen.findByRole('button', { name: 'Stop' });
  expect(screen.queryByRole('button', { name: 'Send message' })).toBeNull();
  await fireEvent.press(screen.getByRole('button', { name: 'Stop' })); await screen.findByRole('button', { name: 'Retry' });
  expect(screen.getByText('Show open events')).toBeTruthy(); expect(fetchMock).toHaveBeenCalledTimes(1);
});
test('session replacement clears transcript and draft', async () => {
  fetchMock.mockResolvedValue(response({ text: 'Here are your events.', results: [first] }));
  await renderChat(); await send(); await screen.findByText('Community evening');
  await act(async () => { setApiKey('replacement'); });
  expect(useChatStore.getState().messages).toHaveLength(0); expect(screen.queryByText('Community evening')).toBeNull();
});

test('rate-limit countdown blocks retries until the provider delay expires', async () => {
  fetchMock.mockResolvedValueOnce(response({ error: { service: 'OpenAI', code: 'rate_limit', message: 'Wait before retrying.', retryAfterMs: 1000 } }, 429)).mockResolvedValueOnce(response({ text: 'Ready again.', results: [] }));
  await renderChat(); await send();
  await screen.findByText('OpenAI: Wait before retrying.');
  expect(screen.getByRole('button', { name: /Retry in/ })).toBeDisabled(); expect(fetchMock).toHaveBeenCalledTimes(1);
  const retry = await screen.findByRole('button', { name: 'Retry' }, { timeout: 3000 });
  await fireEvent.press(retry); await screen.findByText('Ready again.');
});

test('partial results remain visible after a summary failure', async () => {
  fetchMock.mockResolvedValue(response({ text: 'Results are available.', results: [first], error: { service: 'OpenAI', code: 'quota', message: 'Credits exhausted.' } }));
  await renderChat(); await send(); await screen.findByText('Community evening');
  expect(screen.getByText('OpenAI: Credits exhausted.')).toBeTruthy();
});

test('large result sets and filter details expand on request', async () => {
  fetchMock.mockResolvedValue(response({ text: '**Matching events**', results: [{ ...first, cards: Array.from({ length: 5 }, (_, index) => ({ id: `event-${index}`, kind: 'event', title: `Match ${index + 1}`, subtitle: 'Open event' })) }] }));
  await renderChat(); await send(); await screen.findByText('Match 1');
  expect(screen.queryByText('Match 4')).toBeNull(); expect(screen.queryByText(/Status: open/)).toBeNull();
  await fireEvent.press(screen.getByRole('button', { name: 'Show all 5 results on this page' }));
  expect(screen.getByText('Match 5')).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: 'Filters' })); expect(screen.getByText(/Status: open/)).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: 'Hide filters' })); expect(screen.queryByText(/Status: open/)).toBeNull();
});
