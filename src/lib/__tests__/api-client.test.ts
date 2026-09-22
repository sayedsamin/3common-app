import { ApiError, apiRequest } from '../api-client';
import { setApiKey } from '../api-session';
import { apiQueryRetryDelay, shouldRetryApiQuery } from '../api-error';
import { createQueryClient } from '../query-client';

jest.mock('../env', () => ({ env: { apiUrl: undefined } }));
const fetchMock = jest.spyOn(globalThis, 'fetch');
beforeEach(() => {
  setApiKey('test-key');
  fetchMock.mockReset().mockImplementation(async () => new Response(JSON.stringify({ events: [] }), { status: 200 }));
});
afterEach(() => { setApiKey(null); jest.useRealTimers(); });

test('adds Bearer authentication to reads and writes while preserving headers and query parameters', async () => {
  await apiRequest('events/?status=draft&search=hello%20world');
  await apiRequest('events/', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'wrong' }, body: '{}' });
  expect(fetchMock.mock.calls[0]?.[0]).toBe('https://api.3common.com/v1/events/?status=draft&search=hello%20world');
  for (const [, options] of fetchMock.mock.calls) {
    expect(new Headers(options?.headers).get('Authorization')).toBe('Bearer test-key');
  }
  expect(new Headers(fetchMock.mock.calls[1]?.[1]?.headers).get('Content-Type')).toBe('application/json');
});
test('uses the current key for every request and stops after sign-out', async () => {
  setApiKey('replacement');
  await apiRequest('events/');
  expect(new Headers(fetchMock.mock.calls[0]?.[1]?.headers).get('Authorization')).toBe('Bearer replacement');
  setApiKey(null);
  await expect(apiRequest('events/')).rejects.toMatchObject({ code: 'unauthenticated' });
  expect(fetchMock).toHaveBeenCalledTimes(1);
});
test.each(['https://other.example/events/', '//other.example/events/', '../outside'])('does not send credentials outside the API: %s', async path => {
  await expect(apiRequest(path)).rejects.toMatchObject({ code: 'url' });
  expect(fetchMock).not.toHaveBeenCalled();
});
test('normalizes unauthorized responses without exposing server content', async () => {
  fetchMock.mockResolvedValue(new Response('sensitive server details', { status: 401 }));
  await expect(apiRequest('events/')).rejects.toMatchObject({ code: 'unauthenticated', status: 401 });
});
test('handles empty success and network failure', async () => {
  fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }));
  await expect(apiRequest('events/')).resolves.toBeUndefined();
  fetchMock.mockRejectedValueOnce(new Error('private details'));
  await expect(apiRequest('events/')).rejects.toMatchObject({ code: 'network', message: 'Unable to connect. Check your connection and try again.' });
});

test('preserves the documented envelope without exposing raw server content as the display message', async () => {
  const envelope = { status: 422, error: 'VALIDATION_FAILED', message: 'Private input is invalid', details: { name: ['Required'] } };
  fetchMock.mockResolvedValueOnce(new Response(JSON.stringify(envelope), { status: 422 }));
  const error: unknown = await apiRequest('events/').catch((error: unknown) => error);
  expect(error).toBeInstanceOf(ApiError);
  expect(error).toMatchObject({ code: 'validation', status: 422, serverCode: 'VALIDATION_FAILED', serverMessage: envelope.message, details: envelope.details, isRetryable: false });
  expect(JSON.stringify(error)).not.toContain('Private input');
  expect(JSON.stringify(error)).not.toContain('Required');
});

test.each([
  [400, 'validation'], [401, 'unauthenticated'], [403, 'forbidden'], [404, 'not_found'],
  [409, 'conflict'], [422, 'validation'], [429, 'rate_limit'], [500, 'server'], [503, 'server'],
])('classifies HTTP %s and limits retries to transient failures', async (status, code) => {
  fetchMock.mockResolvedValueOnce(new Response('not JSON', { status: Number(status) }));
  const error: unknown = await apiRequest('events/').catch((error: unknown) => error);
  expect(error).toMatchObject({ status, code });
  expect(shouldRetryApiQuery(0, error)).toBe(Number(status) === 429 || Number(status) >= 500);
  expect(shouldRetryApiQuery(2, error)).toBe(false);
});

test.each([
  { status: 400, error: 10, message: 'bad' },
  { status: 401, error: 'WRONG_STATUS', message: 'bad' },
  { status: 400, error: 'INVALID_DETAILS', message: 'bad', details: [] },
])('falls back safely for invalid or inconsistent envelopes: %j', async body => {
  fetchMock.mockResolvedValueOnce(new Response(JSON.stringify(body), { status: 400 }));
  await expect(apiRequest('events/')).rejects.toMatchObject({ code: 'validation', status: 400, serverCode: undefined, details: undefined });
});

test.each(['60', 'Tue, 22 Sep 2026 12:01:00 GMT'])('respects Retry-After: %s', async retryAfter => {
  jest.useFakeTimers().setSystemTime(new Date('2026-09-22T12:00:00Z'));
  fetchMock.mockResolvedValueOnce(new Response('', { status: 429, headers: { 'Retry-After': retryAfter } }));
  const error: unknown = await apiRequest('events/').catch((error: unknown) => error);
  expect(error).toMatchObject({ retryAfterMs: 60_000 });
  expect(apiQueryRetryDelay(0, error)).toBe(60_000);
});

test.each(['invalid', '-1', '1.5', ''])('uses backoff for invalid Retry-After: %s', async retryAfter => {
  fetchMock.mockResolvedValueOnce(new Response('', { status: 503, headers: { 'Retry-After': retryAfter } }));
  const error: unknown = await apiRequest('events/').catch((error: unknown) => error);
  expect(error).toMatchObject({ retryAfterMs: undefined });
  expect(apiQueryRetryDelay(0, error)).toBe(1000);
  expect(apiQueryRetryDelay(1, error)).toBe(2000);
});

test('does not overflow a long retry delay into an immediate retry', async () => {
  fetchMock.mockResolvedValueOnce(new Response('', { status: 429, headers: { 'Retry-After': '999999999999' } }));
  const error: unknown = await apiRequest('events/').catch((error: unknown) => error);
  expect(shouldRetryApiQuery(0, error)).toBe(false);
});

test.each(['POST', 'PATCH', 'DELETE'])('does not automatically replay %s requests', async method => {
  fetchMock.mockResolvedValueOnce(new Response('', { status: 503 }));
  const error: unknown = await apiRequest('events/', { method }).catch((error: unknown) => error);
  expect(shouldRetryApiQuery(0, error)).toBe(false);
  expect(fetchMock).toHaveBeenCalledTimes(1);
});

test('normalizes malformed URLs and skips pre-cancelled requests', async () => {
  await expect(apiRequest('https://[')).rejects.toMatchObject({ code: 'url' });
  const controller = new AbortController();
  controller.abort();
  await expect(apiRequest('events/', { signal: controller.signal })).rejects.toMatchObject({ code: 'cancelled', isRetryable: false });
  expect(fetchMock).not.toHaveBeenCalled();
});

test('times out an in-flight request and cleans up the timer', async () => {
  jest.useFakeTimers();
  fetchMock.mockImplementationOnce((_url, options) => new Promise((_resolve, reject) => {
    options?.signal?.addEventListener('abort', () => reject(new Error('aborted')));
  }));
  const result = expect(apiRequest('events/')).rejects.toMatchObject({ code: 'timeout', isRetryable: true });
  await jest.advanceTimersByTimeAsync(30_000);
  await result;
  expect(jest.getTimerCount()).toBe(0);
});

test('query defaults retry reads with backoff and preserve explicit overrides', async () => {
  jest.useFakeTimers();
  const client = createQueryClient();
  fetchMock.mockResolvedValueOnce(new Response('', { status: 503 }));
  const result = client.fetchQuery({ queryKey: ['events'], queryFn: () => apiRequest('events/') });
  await jest.advanceTimersByTimeAsync(999);
  expect(fetchMock).toHaveBeenCalledTimes(1);
  await jest.advanceTimersByTimeAsync(1);
  await expect(result).resolves.toEqual({ events: [] });
  expect(fetchMock).toHaveBeenCalledTimes(2);
  expect(client.getDefaultOptions().mutations?.retry).toBe(false);
  client.clear();
  const noRetry = createQueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  expect(noRetry.getDefaultOptions().queries?.retry).toBe(false);
  noRetry.clear();
});
