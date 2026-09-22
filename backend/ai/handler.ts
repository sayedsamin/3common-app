import { createHash } from 'node:crypto';
import { GetSecretValueCommand, SecretsManagerClient } from '@aws-sdk/client-secrets-manager';
import { z } from 'zod';
import { chatRequestSchema, chatResponseSchema, querySchema } from '../../src/modules/ai/contracts';
import { createDataClient } from './data';
import { runChat } from './chat';
import { failure, normalize } from './errors';

const eventSchema = z.object({ body: z.string().nullable().optional(), isBase64Encoded: z.boolean().optional(), headers: z.record(z.string(), z.string().optional()), requestContext: z.object({ requestId: z.string(), http: z.object({ method: z.string(), path: z.string() }) }) });
type Dependencies = { fetcher: typeof fetch; getSecret: () => Promise<string>; fingerprints: string[]; model: string; log: (entry: Record<string, string | number>) => void };
export function makeHandler(deps: Dependencies) {
  return async (event: unknown) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 25000);
    const started = Date.now(); let requestId = 'unknown'; let inputTokens = 0; let outputTokens = 0; let errorCode = '';
    try {
      const parsed = eventSchema.parse(event); requestId = parsed.requestContext.requestId;
      const { method, path } = parsed.requestContext.http;
      if (method !== 'POST' || !['/chat', '/query'].includes(path)) throw failure('chat', 'validation', 'Unknown endpoint.', 404);
      if (parsed.isBase64Encoded || !parsed.body || Buffer.byteLength(parsed.body) > 64000) throw failure('chat', 'validation', 'The request is too large or unreadable. Start a new chat.');
      const headers = Object.fromEntries(Object.entries(parsed.headers).map(([key, value]) => [key.toLowerCase(), value]));
      const authorization = headers.authorization;
      const key = authorization?.startsWith('Bearer ') ? authorization.slice(7) : '';
      if (!key || key.length > 4096) throw failure('3common', 'credentials', 'Sign in with your 3common API key.', 401);
      const fingerprint = createHash('sha256').update(key).digest('hex');
      if (!deps.fingerprints.includes(fingerprint)) throw failure('chat', 'forbidden', 'AI access is not enabled for this API key. Contact the app administrator.', 403);
      let body: unknown;
      try { body = JSON.parse(parsed.body); } catch { throw failure('chat', 'validation', 'The request is unreadable.'); }
      // Validate before any network requests and authorize before any paid model call.
      const request = path === '/chat' ? chatRequestSchema.parse(body) : querySchema.parse(body);
      const data = createDataClient(key, controller.signal, deps.fetcher);
      await data.verify();
      let response;
      if (path === '/query') response = (await data.execute(request)).result;
      else {
        const secret = await deps.getSecret();
        if (controller.signal.aborted) throw failure('chat', 'timeout', 'The request timed out.', 504);
        response = chatResponseSchema.parse(await runChat(request, data, secret, deps.model, controller.signal, deps.fetcher, (i, o) => { inputTokens += i; outputTokens += o; }));
        errorCode = response.error?.code ?? '';
      }
      return { statusCode: 200, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }, body: JSON.stringify(response) };
    } catch (error) {
      const normalized = normalize(error); errorCode = normalized.detail.code;
      return { statusCode: normalized.status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }, body: JSON.stringify({ error: normalized.detail }) };
    } finally {
      clearTimeout(timer);
      deps.log({ requestId, latencyMs: Date.now() - started, inputTokens, outputTokens, errorCode });
    }
  };
}
const secrets = new SecretsManagerClient({ maxAttempts: 1, requestHandler: { connectionTimeout: 2000, requestTimeout: 4000 } });
let cachedSecret: { value: string; expires: number } | undefined;
async function getSecret() {
  if (cachedSecret && cachedSecret.expires > Date.now()) return cachedSecret.value;
  try {
    const result = await secrets.send(new GetSecretValueCommand({ SecretId: process.env.OPENAI_SECRET_ARN }));
    const value = z.string().min(1).parse(result.SecretString);
    const parsed = z.object({ OPENAI_API_KEY: z.string().min(1) }).parse(JSON.parse(value));
    cachedSecret = { value: parsed.OPENAI_API_KEY, expires: Date.now() + 300000 };
    return cachedSecret.value;
  } catch { throw failure('chat', 'configuration', 'The assistant is not configured. Ask the app administrator to check its secret.', 503); }
}
export const handler = makeHandler({ fetcher: fetch, getSecret, fingerprints: (process.env.ALLOWED_KEY_SHA256 ?? '').split(',').map(v => v.trim()).filter(Boolean), model: process.env.OPENAI_MODEL ?? 'gpt-5.4-nano', log: entry => console.info(JSON.stringify(entry)) });
