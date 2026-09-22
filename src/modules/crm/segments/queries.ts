import { queryOptions } from '@tanstack/react-query';
import { getSegment, getSegmentMembers, getSegments, getSegmentsByMember } from './api';
import { segmentMembersInputSchema, segmentsByMemberInputSchema, segmentsInputSchema, type SegmentMembersInput, type SegmentsByMemberInput, type SegmentsInput } from './schemas';

export const segmentsKeys = {
  all: ['segments'] as const,
  lists: ['segments', 'list'] as const,
  list: (input: SegmentsInput) => ['segments', 'list', segmentsInputSchema.parse(input)] as const,
  segment: (id: string) => ['segments', 'segment', id] as const,
  detail: (id: string) => ['segments', 'segment', id, 'detail'] as const,
  members: (id: string, input: SegmentMembersInput) => ['segments', 'segment', id, 'members', segmentMembersInputSchema.parse(input)] as const,
  byMembers: ['segments', 'by-member'] as const,
  byMember: (input: SegmentsByMemberInput) => ['segments', 'by-member', segmentsByMemberInputSchema.parse(input)] as const,
};
export function segmentsQueryOptions(input: SegmentsInput = {}) { return queryOptions({ queryKey: segmentsKeys.list(input), queryFn: ({ signal }) => getSegments(input, signal), staleTime: 30_000 }); }
export function segmentQueryOptions(id: string) { return queryOptions({ queryKey: segmentsKeys.detail(id), queryFn: ({ signal }) => getSegment(id, signal), staleTime: 30_000 }); }
export function segmentMembersQueryOptions(id: string, input: SegmentMembersInput = {}) { return queryOptions({ queryKey: segmentsKeys.members(id, input), queryFn: ({ signal }) => getSegmentMembers(id, input, signal), staleTime: 30_000 }); }
export function segmentsByMemberQueryOptions(input: SegmentsByMemberInput) { return queryOptions({ queryKey: segmentsKeys.byMember(input), queryFn: ({ signal }) => getSegmentsByMember(input, signal), staleTime: 30_000 }); }
