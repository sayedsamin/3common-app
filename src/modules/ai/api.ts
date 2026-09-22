import { z } from 'zod';
import { env } from '@/lib/env';
import { getApiKey } from '@/lib/api-session';
import { aiErrorSchema, chatRequestSchema, chatResponseSchema, querySchema, resultSchema, type ChatError, type ChatRequest, type Query } from './contracts';

export class AIRequestError extends Error {
  constructor(public readonly detail: ChatError) { super(detail.message); }
}
async function request<T>(path: string, body: unknown, schema: z.ZodType<T>, signal: AbortSignal): Promise<T> {
  if (!env.aiUrl) throw new AIRequestError({ service: 'chat', code: 'configuration', message: 'AI is not configured yet. Ask the administrator to connect the chatbot backend.' });
  const url = new URL(env.aiUrl);
  if ((url.protocol !== 'https:' && !(__DEV__ && url.protocol === 'http:' && ['localhost', '127.0.0.1', '10.0.2.2'].includes(url.hostname))) || url.username || url.password || url.search || url.hash) throw new AIRequestError({ service: 'chat', code: 'configuration', message: 'The chatbot backend URL is invalid.' });
  const key = getApiKey();
  if (!key) throw new AIRequestError({ service: '3common', code: 'credentials', message: 'Sign in to use the assistant.' });
  const controller = new AbortController();
  const abort = () => controller.abort(); signal.addEventListener('abort', abort);
  if (signal.aborted) controller.abort();
  const timeout = setTimeout(abort, 30000);
  try {
    const response = await fetch(`${env.aiUrl.replace(/\/$/, '')}/${path}`, { method: 'POST', redirect: 'error', headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: controller.signal });
    let value: unknown;
    try { value = await response.json(); } catch { throw new AIRequestError({ service: 'chat', code: 'response', message: 'The assistant returned an unreadable response. Try again.' }); }
    if (!response.ok) {
      const error = z.object({ error: aiErrorSchema }).safeParse(value);
      if (error.success) throw new AIRequestError(error.data.error);
      throw new AIRequestError({ service: 'chat', code: response.status === 429 ? 'rate_limit' : 'server', message: response.status === 429 ? 'The assistant is busy. Wait before retrying.' : 'The assistant could not complete this request.', ...(response.status === 429 ? { retryAfterMs: 30000 } : {}) });
    }
    const parsed = schema.safeParse(value);
    if (!parsed.success) throw new AIRequestError({ service: 'chat', code: 'response', message: 'The assistant returned an invalid response. Try again.' });
    return parsed.data;
  } catch (error) {
    if (error instanceof AIRequestError) throw error;
    throw new AIRequestError({ service: 'chat', code: signal.aborted ? 'cancelled' : controller.signal.aborted ? 'timeout' : 'network', message: signal.aborted ? 'Request stopped.' : controller.signal.aborted ? 'The request timed out. Try a narrower search.' : 'Unable to connect. Check your connection and retry.' });
  } finally { clearTimeout(timeout); signal.removeEventListener('abort', abort); }
}
export const sendChat = (body: ChatRequest, signal: AbortSignal) => request('chat', chatRequestSchema.parse(body), chatResponseSchema, signal);
export const fetchResults = (body: Query, signal: AbortSignal) => request('query', querySchema.parse(body), resultSchema, signal);
