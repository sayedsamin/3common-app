import type { PropsWithChildren } from 'react';
import { act, cleanup, renderHook } from '@testing-library/react-native';
import { onlineManager, QueryClientProvider } from '@tanstack/react-query';
import { createQueryClient } from '@/lib/query-client';
import { setApiKey } from '@/lib/api-session';
import { useAddSegmentMember, useConvertSegmentToStatic, useCreateSegment, useDeleteSegment, useRemoveSegmentMember, useUpdateSegment } from '../mutations';
import { segmentsKeys } from '../queries';
import { id, input, member, memberId, page, response, segment } from '../test-fixtures';

const fetchMock = jest.spyOn(globalThis, 'fetch');
function context() {
  const client = createQueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { gcTime: 0 } } });
  function wrapper({ children }: PropsWithChildren) { return <QueryClientProvider client={client}>{children}</QueryClientProvider>; }
  client.setQueryData(segmentsKeys.list({}), page([segment]));
  client.setQueryData(segmentsKeys.detail(id), segment);
  client.setQueryData(segmentsKeys.members(id, {}), page([member]));
  client.setQueryData(segmentsKeys.byMember({ memberId }), [segment]);
  return { client, wrapper };
}
beforeEach(() => { setApiKey('test-key'); fetchMock.mockReset(); });
afterEach(async () => { await cleanup(); onlineManager.setOnline(true); setApiKey(null); });

test('create, update and conversion seed returned details and invalidate dependent reads', async () => {
  const { client, wrapper } = context();
  const { result } = await renderHook(() => ({ create: useCreateSegment(), update: useUpdateSegment(id), convert: useConvertSegmentToStatic(id) }), { wrapper });
  fetchMock.mockResolvedValueOnce(response({ segment }));
  await act(async () => { await result.current.create.mutateAsync(input); });
  expect(client.getQueryData(segmentsKeys.detail(id))).toEqual(segment);
  fetchMock.mockResolvedValueOnce(response({ segment: { ...segment, name: 'Updated' } }));
  await act(async () => { await result.current.update.mutateAsync({ name: 'Updated' }); });
  expect(client.getQueryData(segmentsKeys.detail(id))).toMatchObject({ name: 'Updated' });
  fetchMock.mockResolvedValueOnce(response({ segment: { ...segment, kind: 'static' } }));
  await act(async () => { await result.current.convert.mutateAsync(); });
  expect(client.getQueryData(segmentsKeys.detail(id))).toMatchObject({ kind: 'static' });
  for (const key of [segmentsKeys.list({}), segmentsKeys.members(id, {}), segmentsKeys.byMember({ memberId })]) expect(client.getQueryState(key)?.isInvalidated).toBe(true);
  await cleanup(); client.clear();
});
test('membership changes use authoritative counts even for no-ops', async () => {
  const { client, wrapper } = context();
  const { result } = await renderHook(() => ({ add: useAddSegmentMember(id), remove: useRemoveSegmentMember(id) }), { wrapper });
  fetchMock.mockResolvedValueOnce(response({ inserted: false, memberCount: 7 }));
  await act(async () => { await result.current.add.mutateAsync(memberId); });
  expect(client.getQueryData(segmentsKeys.detail(id))).toMatchObject({ memberCount: 7 });
  fetchMock.mockResolvedValueOnce(response({ removed: false, memberCount: 3 }));
  await act(async () => { await result.current.remove.mutateAsync(memberId); });
  expect(client.getQueryData(segmentsKeys.detail(id))).toMatchObject({ memberCount: 3 });
  expect(client.getQueryState(segmentsKeys.byMember({ memberId }))?.isInvalidated).toBe(true);
  await cleanup(); client.clear();
});
test('deletion cancels reads before removing segment and member pages', async () => {
  const { client, wrapper } = context();
  const cancel = jest.spyOn(client, 'cancelQueries'), remove = jest.spyOn(client, 'removeQueries');
  const { result } = await renderHook(() => useDeleteSegment(id), { wrapper });
  fetchMock.mockResolvedValueOnce(response({ id, deleted: true }));
  await act(async () => { await result.current.mutateAsync(); });
  expect(client.getQueriesData({ queryKey: segmentsKeys.segment(id) })).toEqual([]);
  expect(cancel.mock.invocationCallOrder[0]).toBeLessThan(remove.mock.invocationCallOrder[0] ?? Infinity);
  expect(client.getQueryState(segmentsKeys.list({}))?.isInvalidated).toBe(true);
  await cleanup(); client.clear();
});
test('offline failures retain data and never queue or retry writes', async () => {
  const { client, wrapper } = context(); onlineManager.setOnline(false);
  const { result } = await renderHook(() => useDeleteSegment(id), { wrapper });
  fetchMock.mockRejectedValue(new TypeError('offline'));
  await act(async () => { await expect(result.current.mutateAsync()).rejects.toMatchObject({ code: 'network' }); });
  expect(result.current.isPaused).toBe(false);
  expect(client.getQueryData(segmentsKeys.detail(id))).toEqual(segment);
  await act(async () => { onlineManager.setOnline(true); });
  expect(fetchMock).toHaveBeenCalledTimes(1);
  await cleanup(); client.clear();
});
