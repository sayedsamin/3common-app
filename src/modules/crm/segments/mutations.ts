import { useMutation, useQueryClient } from '@tanstack/react-query';
import { addSegmentMember, convertSegmentToStatic, createSegment, deleteSegment, removeSegmentMember, updateSegment } from './api';
import { segmentsKeys } from './queries';
import type { CreateSegment, Segment, UpdateSegment } from './schemas';

function useSegmentWrite<TInput, TResult>(mutationFn: (input: TInput) => Promise<TResult>, apply: (result: TResult, client: ReturnType<typeof useQueryClient>) => void) {
  const client = useQueryClient();
  return useMutation({ mutationFn, retry: false, networkMode: 'always',
    onMutate: () => client.cancelQueries({ queryKey: segmentsKeys.all }),
    onSuccess: async result => {
      await client.cancelQueries({ queryKey: segmentsKeys.all });
      apply(result, client);
      void client.invalidateQueries({ queryKey: segmentsKeys.all });
    },
  });
}
function cacheSegment(segment: Segment, client: ReturnType<typeof useQueryClient>) { client.setQueryData(segmentsKeys.detail(segment.id), segment); }
export function useCreateSegment() { return useSegmentWrite((input: CreateSegment) => createSegment(input), cacheSegment); }
export function useUpdateSegment(id: string) { return useSegmentWrite((update: UpdateSegment) => updateSegment(id, update), cacheSegment); }
export function useConvertSegmentToStatic(id: string) { return useSegmentWrite(() => convertSegmentToStatic(id), cacheSegment); }
export function useDeleteSegment(id: string) { return useSegmentWrite(() => deleteSegment(id), (_, client) => { client.removeQueries({ queryKey: segmentsKeys.segment(id) }); }); }
export function useAddSegmentMember(id: string) {
  return useSegmentWrite((memberId: string) => addSegmentMember(id, memberId), (result, client) => {
    client.setQueryData<Segment>(segmentsKeys.detail(id), previous => previous ? { ...previous, memberCount: result.memberCount } : undefined);
  });
}
export function useRemoveSegmentMember(id: string) {
  return useSegmentWrite((memberId: string) => removeSegmentMember(id, memberId), (result, client) => {
    client.setQueryData<Segment>(segmentsKeys.detail(id), previous => previous ? { ...previous, memberCount: result.memberCount } : undefined);
  });
}
