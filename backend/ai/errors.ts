import { z } from 'zod';
import type { ChatError } from '../../src/modules/ai/contracts';

export class ChatFailure extends Error {
  constructor(public readonly detail: ChatError, public readonly status = 400) { super(detail.message); }
}
export function failure(service: ChatError['service'], code: ChatError['code'], message: string, status = 400) { return new ChatFailure({ service, code, message }, status); }
export function normalize(error: unknown): ChatFailure {
  if (error instanceof ChatFailure) return error;
  if (error instanceof z.ZodError) return failure('chat', 'validation', 'The query is invalid. Check the filters or clarify your request.');
  if (error instanceof Error && /abort|timeout/i.test(error.name)) return failure('chat', 'timeout', 'The request timed out. Try a narrower search.', 504);
  return failure('chat', 'server', 'The assistant is temporarily unavailable. Try again.', 503);
}
export async function readResponse(response: Response, service: ChatError['service']) {
  let body: unknown;
  try { body = await response.json(); } catch { if (response.ok) throw failure(service, 'response', `${service} returned an unreadable response.`, 502); }
  if (response.ok) return body;
  const parsed = z.object({ error: z.object({ code: z.string().optional(), type: z.string().optional() }) }).safeParse(body);
  const codes = parsed.success ? [parsed.data.error.code, parsed.data.error.type] : [];
  if (response.status === 401) throw failure(service, 'credentials', service === '3common' ? 'Your 3common API key was rejected. Sign in again with a valid key.' : 'The OpenAI key is invalid, expired, or revoked. Ask the app administrator to replace it.', service === '3common' ? 401 : 502);
  if (service === 'OpenAI' && codes.some(c => c && /insufficient_quota|billing|usage_limit|spend_limit/.test(c))) throw failure(service, 'quota', 'OpenAI credits or usage quota are exhausted. Ask the app administrator to check billing and limits.', 503);
  if (response.status === 429) {
    const header = response.headers.get('retry-after');
    const seconds = header && /^\d+(\.\d+)?$/.test(header) ? Number(header) : undefined;
    const retryAfterMs = Math.min(86400000, Math.max(1000, seconds !== undefined ? seconds * 1000 : header && Number.isFinite(Date.parse(header)) ? Date.parse(header) - Date.now() : 30000));
    throw new ChatFailure({ service, code: 'rate_limit', message: `${service} is receiving too many requests. Wait before retrying.`, retryAfterMs }, 429);
  }
  if (response.status === 403) throw failure(service, 'forbidden', `${service} denied permission for this request.`, 403);
  if (response.status === 400 || response.status === 422) throw failure(service, 'validation', `${service} rejected the request. Check the filters or clarify your question.`);
  throw failure(service, 'server', `${service} could not complete the request. Try again later.`, 502);
}
export async function fetchService(fetcher: typeof fetch, url: string, init: RequestInit, service: ChatError['service']) {
  try { return await readResponse(await fetcher(url, { ...init, redirect: 'error' }), service); }
  catch (error) {
    if (error instanceof ChatFailure) throw error;
    if (init.signal?.aborted) throw failure(service, 'timeout', `${service} did not finish before the time limit.`, 504);
    throw failure(service, 'network', `Unable to connect to ${service}. Try again.`, 502);
  }
}
