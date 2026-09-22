import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { makeHandler } from '../handler';
import { chatRequestSchema, querySchema } from '../../../src/modules/ai/contracts';
import { validateQuery } from '../filters';
import { readResponse, fetchService, ChatFailure } from '../errors';

const key = 'test-user-key';
const fingerprints = [createHash('sha256').update(key).digest('hex')];
const body = { messages: [{ role: 'user', content: 'Find events' }], timezone: 'America/Winnipeg', context: [] };
const event = (path = '/chat', value: unknown = body, token = key) => ({ headers: { authorization: `Bearer ${token}` }, body: JSON.stringify(value), requestContext: { requestId: 'test', http: { method: 'POST', path } } });
const json = (v: unknown, status = 200, headers = {}) => new Response(JSON.stringify(v), { status, headers });
const tool = (name: string, args: unknown) => ({ status: 'completed', output: [{ type: 'function_call', name, call_id: 'call1', arguments: JSON.stringify(args) }] });
const answer = { status: 'completed', output: [{ type: 'message', content: [{ type: 'output_text', text: 'Here are the results.' }] }], usage: { input_tokens: 100, output_tokens: 20 } };
function handler(fetcher: typeof fetch, log = (_entry: unknown) => {}) { return makeHandler({ fetcher, fingerprints, model: 'gpt-5.4-nano', getSecret: async () => 'test-openai-key', log }); }

test('unapproved keys never reach a network or paid call', async () => {
  let calls = 0;
  const result = await handler(async () => { calls++; return json({}); })(event('/chat', body, 'other'));
  assert.equal(result.statusCode, 403); assert.equal(calls, 0);
});
test('rejected upstream credentials stop before OpenAI', async () => {
  const calls: string[] = [];
  const result = await handler(async url => { calls.push(String(url)); return json({}, 401); })(event());
  assert.equal(result.statusCode, 401); assert.equal(calls.length, 1); assert.match(result.body, /3common/);
});
test('list results, filters, and continuation; OpenAI never receives the 3common key', async () => {
  const calls: { url: string; body: string }[] = [];
  let modelCalls = 0;
  const result = await handler(async (url, init) => {
    calls.push({ url: String(url), body: String(init?.body ?? '') });
    if (String(url).includes('openai')) return json(++modelCalls === 1 ? tool('list_events', { search: 'gala', status: 'open' }) : answer);
    return json({ data: [{ id: 'e1', name: 'Gala', start: '2026-11-01T01:00:00Z' }], hasMore: true });
  })(event());
  assert.equal(result.statusCode, 200);
  const response = JSON.parse(result.body); assert.equal(response.results[0].cards[0].title, 'Gala');
  assert.equal(response.results[0].nextQuery.input.page, 1);
  assert.equal(modelCalls, 2);
  const paid = calls.filter(c => c.url.includes('openai'));
  assert.ok(paid.every(c => !c.body.includes(key) && JSON.parse(c.body).store === false));
  assert.ok(paid[0]?.body.includes('America/Winnipeg'));
});
test('pagination uses no OpenAI request', async () => {
  const result = await handler(async url => { assert.ok(!String(url).includes('openai')); return json({ data: [], hasMore: false }); })(event('/query', { tool: 'list_contacts', input: { pageNumber: 2 } }));
  assert.equal(result.statusCode, 200); assert.equal(JSON.parse(result.body).query.input.pageNumber, 2);
});
test('partial results survive a quota error on summary', async () => {
  let modelCalls = 0;
  const result = await handler(async url => {
    if (String(url).includes('openai')) return ++modelCalls === 1 ? json(tool('list_events', {})) : json({ error: { code: 'insufficient_quota' } }, 429);
    return json({ data: [{ id: 'e1', name: 'Saved result' }], hasMore: false });
  })(event());
  const response = JSON.parse(result.body); assert.equal(response.error.code, 'quota'); assert.equal(response.results[0].cards.length, 1);
});
test('write tools and arbitrary URLs cannot execute', async () => {
  let reads = 0;
  const result = await handler(async url => {
    if (String(url).includes('openai')) return json(tool('delete_contact', { id: 'c1', url: 'https://example.com' }));
    reads++; return json({ data: [], hasMore: false });
  })(event());
  assert.equal(reads, 1); assert.equal(JSON.parse(result.body).error.code, 'validation');
});
test('every operator family validates and nested groups retain conditions', () => {
  const conditions = [
    ...['is_equal_to_any_of', 'is_not_equal_to_any_of'].map(operator => ({ field: 'email', operator, value: ['a@example.com'] })),
    ...['contains', 'contains_exactly'].map(operator => ({ field: 'email', operator, value: 'example' })),
    ...['is_before', 'is_after'].map(operator => ({ field: 'createdAt', operator, value: '2026-01-01T00:00:00Z' })),
    ...['is_equal_to', 'is_not_equal_to', 'is_greater_than', 'is_greater_than_or_equal_to', 'is_less_than', 'is_less_than_or_equal_to'].map(operator => ({ field: 'grossSum', operator, value: 10 })),
    ...['is_any_of', 'is_none_of'].map(operator => ({ field: 'status', operator, value: ['opted-in'] })),
    ...['is_empty', 'is_not_empty'].map(operator => ({ field: 'phone', operator })),
    { field: 'grossSum', operator: 'is_between', value: { start: 10, end: 20 } },
    { field: 'createdAt', operator: 'is_between', value: { start: '2026-01-01T00:00:00Z', end: '2026-02-01T00:00:00Z' } },
  ];
  validateQuery(querySchema.parse({ tool: 'list_contacts', input: { filters: [{ logic: 'and', conditions: [{ logic: 'or', conditions }] }] } }));
});
test('unsupported persisted fields, bad value types, and reversed ranges fail', () => {
  for (const condition of [{ field: 'eventsAttended_IDS', operator: 'is_any_of', value: ['x'] }, { field: 'grossSum', operator: 'contains', value: '10' }, { field: 'grossSum', operator: 'is_between', value: { start: 20, end: 10 } }]) {
    assert.throws(() => validateQuery(querySchema.parse({ tool: 'list_contacts', input: { filters: [{ logic: 'and', conditions: [condition] }] } })));
  }
  assert.throws(() => validateQuery(querySchema.parse({ tool: 'list_events', input: { startAfter: '2026-02-01T00:00:00Z', startBefore: '2026-01-01T00:00:00Z' } })));
});
test('quota, authentication, rate limits and forbidden errors are distinct', async () => {
  for (const [status, code, expected] of [[401, '', 'credentials'], [429, 'insufficient_quota', 'quota'], [429, 'rate_limit_exceeded', 'rate_limit'], [403, '', 'forbidden']] as const) {
    await assert.rejects(() => readResponse(json({ error: { code } }, status, { 'retry-after': '2' }), 'OpenAI'), e => e instanceof ChatFailure && e.detail.code === expected && (expected !== 'rate_limit' || e.detail.retryAfterMs === 2000));
  }
});
test('request scoped clients isolate simultaneous user credentials; logs are sanitized', async () => {
  const second = 'second-test-key'; const seen: string[] = []; const logs: unknown[] = [];
  const run = makeHandler({ model: 'gpt-5.4-nano', fingerprints: [...fingerprints, createHash('sha256').update(second).digest('hex')], getSecret: async () => 'secret', log: v => logs.push(v), fetcher: async (url, init) => { if (String(url).includes('openai')) return json(answer); seen.push(new Headers(init?.headers).get('authorization') ?? ''); return json({ data: [], hasMore: false }); } });
  await Promise.all([run(event()), run(event('/chat', body, second))]);
  assert.ok(seen.includes(`Bearer ${key}`)); assert.ok(seen.includes(`Bearer ${second}`));
  assert.ok(!JSON.stringify(logs).includes(key)); assert.ok(!JSON.stringify(logs).includes('Find events'));
});

test('date offsets normalize to UTC across a daylight-saving range', () => {
  const query = querySchema.parse({ tool: 'list_events', input: { startAfter: '2026-11-01T00:00:00-05:00', startBefore: '2026-11-01T23:59:59-06:00', filters: [{ logic: 'and', conditions: [{ field: 'start', operator: 'is_between', value: { start: '2026-11-01T00:00:00-05:00', end: '2026-11-01T23:59:59-06:00' } }] }] } });
  validateQuery(query); assert.equal(query.tool, 'list_events');
  if (query.tool === 'list_events') {
    assert.equal(query.input.startAfter, '2026-11-01T05:00:00.000Z');
    assert.equal(query.input.startBefore, '2026-11-02T05:59:59.000Z');
    assert.deepEqual(query.input.filters?.[0]?.conditions[0], { field: 'start', operator: 'is_between', value: { start: '2026-11-01T05:00:00.000Z', end: '2026-11-02T05:59:59.000Z' } });
  }
  assert.equal(chatRequestSchema.safeParse({ ...body, timezone: 'Invalid/Timezone' }).success, false);
});
test('clarification responses do not query business data beyond authentication', async () => {
  let reads = 0;
  const result = await handler(async url => {
    if (String(url).includes('openai')) return json({ ...answer, output: [{ type: 'message', content: [{ type: 'output_text', text: 'Which event did you mean?' }] }] });
    reads++; return json({ data: [], hasMore: false });
  })(event());
  assert.equal(reads, 1); assert.equal(JSON.parse(result.body).results.length, 0);
});
test('malformed upstream data is a response error, not a user filter error', async () => {
  let reads = 0;
  const result = await handler(async url => {
    if (String(url).includes('openai')) return json(tool('list_events', {}));
    return json(++reads === 1 ? { data: [], hasMore: false } : { data: [{ name: 'Missing id' }], hasMore: false });
  })(event());
  assert.equal(JSON.parse(result.body).error.code, 'response'); assert.equal(JSON.parse(result.body).error.service, '3common');
});
test('model round bound prevents a third round from executing more tools', async () => {
  let models = 0; let reads = 0;
  const result = await handler(async url => {
    if (String(url).includes('openai')) { models++; return json(tool('list_events', {})); }
    reads++; return json({ data: [], hasMore: false });
  })(event());
  assert.equal(models, 3); assert.equal(reads, 3); assert.match(JSON.parse(result.body).error.message, /too many/);
});
test('transport failures and aborted upstream calls are distinguishable', async () => {
  const controller = new AbortController();
  const broken: typeof fetch = async () => { throw new Error('network'); };
  await assert.rejects(() => fetchService(broken, 'https://api.openai.com/v1/responses', { signal: controller.signal }, 'OpenAI'), e => e instanceof ChatFailure && e.detail.code === 'network');
  controller.abort();
  await assert.rejects(() => fetchService(broken, 'https://api.openai.com/v1/responses', { signal: controller.signal }, 'OpenAI'), e => e instanceof ChatFailure && e.detail.code === 'timeout');
});
