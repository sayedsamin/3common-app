import { getApiKey } from './api-session';
import { env } from './env';
import { ApiError, createHttpError } from './api-error';
export { ApiError } from './api-error';

// Paths are relative to the API root, e.g. events/?status=draft.
// Modules validate the unknown response using their domain schemas.
export async function apiRequest(path: string, options: RequestInit = {}): Promise<unknown> {
  let url: URL;
  try {
    const base = new URL((env.apiUrl ?? 'https://api.3common.com/v1').replace(/\/+$/, '') + '/');
    url = new URL(path.replace(/^\/(?!\/)/, ''), base);
    if (url.origin !== base.origin || !url.pathname.startsWith(base.pathname) || url.username || url.password) {
      throw new Error('Invalid API URL');
    }
  } catch {
    throw new ApiError('url', 'Requests must use the configured API.');
  }
  if (options.signal?.aborted) throw new ApiError('cancelled', 'The request was cancelled.');
  const method = (options.method ?? 'GET').toUpperCase();
  const canRetry = method === 'GET' || method === 'HEAD';
  const key = getApiKey();
  if (!key) throw new ApiError('unauthenticated', 'Enter your API key to continue.');
  const headers = new Headers(options.headers);
  headers.set('Authorization', 'Bearer ' + key);
  if (!headers.has('Accept')) headers.set('Accept', 'application/json');
  const controller = new AbortController();
  let isTimeout = false;
  const abort = () => controller.abort();
  options.signal?.addEventListener('abort', abort, { once: true });
  if (options.signal?.aborted) abort();
  const timeout = setTimeout(() => { isTimeout = true; abort(); }, 30_000);
  try {
    const response = await fetch(url.toString(), {
      ...options, headers, signal: controller.signal, redirect: 'error',
    });
    if (!response.ok) {
      throw await createHttpError(response, canRetry);
    }
    if (response.status === 204 || method === 'HEAD') return undefined;
    try { return await response.json(); }
    catch { throw new ApiError('response', 'The API returned an unreadable response.'); }
  } catch (error) {
    if (options.signal?.aborted) throw new ApiError('cancelled', 'The request was cancelled.');
    if (isTimeout) throw new ApiError('timeout', 'The request timed out. Please try again.', undefined, { isRetryable: canRetry });
    if (error instanceof ApiError) throw error;
    throw new ApiError('network', 'Unable to connect. Check your connection and try again.', undefined, { isRetryable: canRetry });
  } finally {
    clearTimeout(timeout);
    options.signal?.removeEventListener('abort', abort);
  }
}
