import { setApiKey } from '@/lib/api-session';
import { addSegmentMember, convertSegmentToStatic, createSegment, deleteSegment, getSegment, getSegmentMembers, getSegments, getSegmentsByMember, removeSegmentMember, updateSegment } from '../api';
import { createSegmentSchema, segmentRouteSchema, segmentMembersInputSchema, segmentsInputSchema, updateSegmentSchema } from '../schemas';
import { segmentsKeys } from '../queries';
import { contactFilterFields, readSegmentFilters } from '../utils';
import { buildFilterGroup } from '@/lib/filter-builder';
import { id, input, member, memberId, page, response, segment } from '../test-fixtures';

const fetchMock = jest.spyOn(globalThis, 'fetch');
beforeEach(() => { setApiKey('test-key'); fetchMock.mockReset(); });
afterEach(() => setApiKey(null));

test('all ten endpoints use documented paths, envelopes, methods and authentication', async () => {
  for (const body of [{ segments: [segment] }, page([segment]), { segment }, { segment }, { segment }, { id, deleted: true }, { segment: { ...segment, kind: 'static' } }, page([member]), { inserted: false, memberCount: 1 }, { removed: false, memberCount: 0 }]) fetchMock.mockResolvedValueOnce(response(body));
  await expect(getSegmentsByMember({ memberId, targetType: 'contact' })).resolves.toEqual([segment]);
  await expect(getSegments()).resolves.toEqual(page([segment]));
  await expect(createSegment(input)).resolves.toEqual(segment);
  await expect(getSegment(id)).resolves.toEqual(segment);
  await expect(updateSegment(id, { name: 'Changed' })).resolves.toEqual(segment);
  await expect(deleteSegment(id)).resolves.toEqual({ id, deleted: true });
  await expect(convertSegmentToStatic(id)).resolves.toMatchObject({ kind: 'static' });
  await expect(getSegmentMembers(id)).resolves.toEqual(page([member]));
  await expect(addSegmentMember(id, memberId)).resolves.toEqual({ inserted: false, memberCount: 1 });
  await expect(removeSegmentMember(id, memberId)).resolves.toEqual({ removed: false, memberCount: 0 });
  expect(fetchMock.mock.calls.map(([url]) => new URL(String(url)).pathname)).toEqual([
    `/v1/segments/by-member/${memberId}`, '/v1/segments/', '/v1/segments/', `/v1/segments/${id}`, `/v1/segments/${id}`, `/v1/segments/${id}`,
    `/v1/segments/${id}/convert-to-static`, `/v1/segments/${id}/members`, `/v1/segments/${id}/members/${memberId}`, `/v1/segments/${id}/members/${memberId}`,
  ]);
  expect(fetchMock.mock.calls.map(([, options]) => options?.method ?? 'GET')).toEqual(['GET', 'GET', 'POST', 'GET', 'PATCH', 'DELETE', 'POST', 'GET', 'POST', 'DELETE']);
  expect(JSON.parse(String(fetchMock.mock.calls[2]?.[1]?.body))).toEqual({ input: { ...input, status: 'active', trackMembershipEvents: true } });
  expect(JSON.parse(String(fetchMock.mock.calls[4]?.[1]?.body))).toEqual({ update: { name: 'Changed' } });
  expect(fetchMock.mock.calls[6]?.[1]?.body).toBeUndefined();
  expect(new URL(String(fetchMock.mock.calls[0]?.[0])).searchParams.get('targetType')).toBe('contact');
  for (const [, options] of fetchMock.mock.calls) expect(new Headers(options?.headers).get('Authorization')).toBe('Bearer test-key');
});
test('serializes every list/member parameter and preserves open filter properties', async () => {
  const filters = [{ logic: 'or' as const, conditions: [{ custom: true }], extension: 'keep' }];
  fetchMock.mockResolvedValueOnce(response(page([segment]))).mockResolvedValueOnce(response(page([member])));
  await getSegments({ pageNumber: 2, pageSize: 200, sortField: 'memberCount', sortDirection: 'asc', search: ' A & B ', targetType: 'ticket', folderId: 'unfiled', status: 'archived', filters });
  expect(Object.fromEntries(new URL(String(fetchMock.mock.calls[0]?.[0])).searchParams)).toEqual({ pageNumber: '2', pageSize: '200', sortField: 'memberCount', sortDirection: 'asc', search: 'A & B', targetType: 'ticket', folderId: 'unfiled', status: 'archived', filters: JSON.stringify(filters) });
  await getSegmentMembers(id, { pageNumber: 3, pageSize: 100, search: ' Member ', sortField: 'memberId', sortDirection: 'asc' });
  expect(Object.fromEntries(new URL(String(fetchMock.mock.calls[1]?.[0])).searchParams)).toEqual({ pageNumber: '3', pageSize: '100', search: 'Member', sortField: 'memberId', sortDirection: 'asc' });
});
test.each(['', '../bad', id.toUpperCase(), 'abc', undefined, [id]])('rejects invalid route IDs %j', segmentId => {
  expect(segmentRouteSchema.safeParse({ segmentId }).success).toBe(false);
});
test('rejects invalid input before sending requests', async () => {
  await expect(getSegment('bad')).rejects.toThrow();
  await expect(addSegmentMember(id, 'bad')).rejects.toThrow();
  await expect(getSegmentsByMember({ memberId: 'bad' })).rejects.toThrow();
  await expect(getSegments({ pageSize: 201 })).rejects.toThrow();
  await expect(createSegment({ ...input, filters: [] })).rejects.toThrow();
  expect(fetchMock).not.toHaveBeenCalled();
  for (const forbidden of ['targetType', 'kind', 'status', 'formId']) expect(updateSegmentSchema.safeParse({ [forbidden]: 'contact' }).success).toBe(false);
  expect(createSegmentSchema.safeParse({ ...input, refreshIntervalMs: 59999 }).success).toBe(false);
  expect(segmentMembersInputSchema.safeParse({ pageSize: 201 }).success).toBe(false);
  expect(segmentsInputSchema.safeParse({ pageNumber: -1 }).success).toBe(false);
  expect(segmentsInputSchema.parse({})).toMatchObject({ pageNumber: 0, pageSize: 20 });
});
test('validates envelopes, identities, conversion and deletion confirmations', async () => {
  for (const body of [{ data: segment }, { segment: { ...segment, id: memberId } }, { segment }, { id, deleted: false }, page([{ ...member, segmentId: memberId }]), { inserted: true }]) fetchMock.mockResolvedValueOnce(response(body));
  await expect(getSegment(id)).rejects.toMatchObject({ code: 'response' });
  await expect(updateSegment(id, {})).rejects.toMatchObject({ code: 'response' });
  await expect(convertSegmentToStatic(id)).rejects.toMatchObject({ code: 'response' });
  await expect(deleteSegment(id)).rejects.toMatchObject({ code: 'response' });
  await expect(getSegmentMembers(id)).rejects.toMatchObject({ code: 'response' });
  await expect(addSegmentMember(id, memberId)).rejects.toMatchObject({ code: 'response' });
});
test('forwards cancellation and normalized API errors', async () => {
  const controller = new AbortController(); controller.abort();
  await expect(getSegments({}, controller.signal)).rejects.toMatchObject({ code: 'cancelled' });
  expect(fetchMock).not.toHaveBeenCalled();
  fetchMock.mockResolvedValueOnce(response({ error: { code: 'duplicate', message: 'duplicate', details: { conflictingId: id } } }, 409));
  await expect(createSegment(input)).rejects.toMatchObject({ code: 'conflict', details: { conflictingId: id } });
});
test('normalizes defaults and separates every query input', () => {
  expect(segmentsKeys.list({})).toEqual(segmentsKeys.list({ pageNumber: 0, pageSize: 20, sortField: 'createdAt', sortDirection: 'desc' }));
  for (const changes of [{ search: 'A' }, { pageNumber: 1 }, { folderId: 'unfiled' }, { targetType: 'order' as const }, { status: 'archived' as const }, { filters: segment.filters }]) expect(segmentsKeys.list(changes)).not.toEqual(segmentsKeys.list({}));
  expect(segmentsKeys.byMember({ memberId })).not.toEqual(segmentsKeys.byMember({ memberId, targetType: 'contact' }));
  expect(segmentsKeys.members(id, {})).not.toEqual(segmentsKeys.members(id, { search: 'A' }));
});
test('hydrates nested typed filters losslessly and refuses destructive conversion of extensions', () => {
  const filters = [{ logic: 'and' as const, conditions: [{ logic: 'or', conditions: [{ field: 'grossSum', operator: 'is_between', value: { start: 5, end: 20 } }] }] }, ...segment.filters];
  const drafts = readSegmentFilters(filters, contactFilterFields);
  expect(drafts?.map(buildFilterGroup)).toEqual(filters);
  for (const unsupported of [
    [{ ...segment.filters[0], logic: 'and' as const, conditions: [], extension: true }],
    [{ logic: 'and' as const, conditions: [{ field: 'email', operator: 'is_equal_to_any_of', value: ['a,b'] }] }],
    [{ logic: 'and' as const, conditions: [{ future: 'condition' }] }],
  ]) expect(readSegmentFilters(unsupported, contactFilterFields)).toBeUndefined();
});
