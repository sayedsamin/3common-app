import { z } from 'zod';

const errorEnvelopeSchema = z.object({
  status: z.number().int().min(400).max(599),
  error: z.string().min(1),
  message: z.string(),
  details: z.record(z.string(), z.unknown()).optional(),
});
// The Events OpenAPI document also defines this nested envelope.
const nestedErrorEnvelopeSchema = z.object({ error: z.object({
  code: z.string().min(1), message: z.string(),
  details: z.record(z.string(), z.unknown()).optional().catch(undefined),
}) });

type ApiErrorCode = 'unauthenticated' | 'forbidden' | 'not_found' | 'validation' | 'conflict' |
  'rate_limit' | 'server' | 'http' | 'network' | 'timeout' | 'cancelled' | 'response' | 'url';
type ErrorMetadata = {
  serverCode?: string;
  serverMessage?: string;
  details?: Record<string, unknown>;
  retryAfterMs?: number;
  isRetryable?: boolean;
};

export class ApiError extends Error {
  readonly serverCode?: string;
  readonly serverMessage?: string;
  readonly details?: Record<string, unknown>;
  readonly retryAfterMs?: number;
  readonly isRetryable: boolean;

  constructor(public readonly code: ApiErrorCode, message: string, public readonly status?: number, metadata: ErrorMetadata = {}) {
    super(message);
    this.name = 'ApiError';
    this.serverCode = metadata.serverCode;
    this.serverMessage = metadata.serverMessage;
    this.details = metadata.details;
    this.retryAfterMs = metadata.retryAfterMs;
    this.isRetryable = metadata.isRetryable ?? false;
    // Raw server data can contain personal information. Keep it out of ordinary
    // error serialization; feature forms may explicitly validate and consume it.
    Object.defineProperty(this, 'serverMessage', { enumerable: false });
    Object.defineProperty(this, 'details', { enumerable: false });
  }
}

function httpErrorInfo(status: number): [ApiErrorCode, string] {
  switch (status) {
    case 400: case 422: return ['validation', 'Check the information you entered and try again.'];
    case 401: return ['unauthenticated', 'Your API key was rejected. Update it in Settings.'];
    case 403: return ['forbidden', 'You do not have permission to perform this action.'];
    case 404: return ['not_found', 'This item could not be found or is unavailable to you.'];
    case 409: return ['conflict', 'This item has changed. Refresh and try again.'];
    case 429: return ['rate_limit', 'Too many requests. Please wait before trying again.'];
    default: return status >= 500
      ? ['server', 'The service is temporarily unavailable. Please try again later.']
      : ['http', 'The request failed. Please try again.'];
  }
}

function parseRetryAfter(value: string | null): number | undefined {
  if (!value?.trim()) return undefined;
  const trimmed = value.trim();
  if (/^\d+$/.test(trimmed)) {
    const delay = Number(trimmed) * 1000;
    // An unrepresentably long delay must never turn into an immediate retry.
    return Number.isFinite(delay) ? delay : Number.MAX_SAFE_INTEGER;
  }
  // Avoid Date.parse interpreting invalid numeric delays such as -1 as dates.
  if (!/^[A-Za-z]/.test(trimmed)) return undefined;
  const timestamp = Date.parse(trimmed);
  return Number.isFinite(timestamp) ? Math.max(0, timestamp - Date.now()) : undefined;
}

export async function createHttpError(response: Response, canRetry: boolean): Promise<ApiError> {
  const [code, message] = httpErrorInfo(response.status);
  let body: unknown;
  try { body = await response.json(); } catch { /* Non-JSON errors still retain HTTP semantics. */ }
  const parsed = errorEnvelopeSchema.safeParse(body);
  // HTTP status is authoritative; don't trust an inconsistent envelope.
  const envelope = parsed.success && parsed.data.status === response.status ? parsed.data : undefined;
  const nested = nestedErrorEnvelopeSchema.safeParse(body);
  return new ApiError(code, message, response.status, {
    serverCode: envelope?.error ?? (nested.success ? nested.data.error.code : undefined),
    serverMessage: envelope?.message ?? (nested.success ? nested.data.error.message : undefined),
    details: envelope?.details ?? (nested.success ? nested.data.error.details : undefined),
    retryAfterMs: parseRetryAfter(response.headers.get('Retry-After')),
    isRetryable: canRetry && (response.status === 429 || response.status >= 500),
  });
}

export function shouldRetryApiQuery(failureCount: number, error: unknown): boolean {
  return failureCount < 2 && error instanceof ApiError && error.isRetryable &&
    // JS timers overflow beyond this limit. Surface the error instead of retrying early.
    (error.retryAfterMs ?? 0) <= 2_147_483_647;
}

export function apiQueryRetryDelay(attempt: number, error: unknown): number {
  const backoff = Math.min(1000 * 2 ** attempt, 30_000);
  return Math.max(backoff, error instanceof ApiError ? error.retryAfterMs ?? 0 : 0);
}
