import { z } from 'zod';
import { ApiError, apiRequest } from '@/lib/api-client';
import { addMemberResponseSchema, createSegmentSchema, deleteSegmentResponseSchema, removeMemberResponseSchema, segmentIdSchema,
  segmentMembersInputSchema, segmentMembersResponseSchema, segmentResponseSchema, segmentsByMemberInputSchema, segmentsByMemberResponseSchema,
  segmentsInputSchema, segmentsResponseSchema, updateSegmentSchema,
  type CreateSegment, type SegmentMembersInput, type SegmentsByMemberInput, type SegmentsInput, type UpdateSegment } from './schemas';

function parse<T>(schema: z.ZodType<T>, value: unknown): T {
  const result = schema.safeParse(value);
  if (!result.success) throw new ApiError('response', 'The segment response could not be read. Refresh before trying again.');
  return result.data;
}
function searchParams(input: Record<string, unknown>) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(input)) {
    if (value !== undefined && value !== '') params.set(key, key === 'filters' ? JSON.stringify(value) : String(value));
  }
  return params;
}
function path(id: string) { return `segments/${segmentIdSchema.parse(id)}`; }
function json(method: string, body: unknown): RequestInit { return { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }; }
function segment(value: unknown, id?: string) {
  const result = parse(segmentResponseSchema, value).segment;
  if (id && result.id !== id) throw new ApiError('response', 'The response refers to a different segment. Refresh before trying again.');
  return result;
}
export async function getSegments(input: SegmentsInput = {}, signal?: AbortSignal) {
  return parse(segmentsResponseSchema, await apiRequest(`segments/?${searchParams(segmentsInputSchema.parse(input))}`, { signal }));
}
export async function getSegment(id: string, signal?: AbortSignal) { return segment(await apiRequest(path(id), { signal }), id); }
export async function getSegmentsByMember(input: SegmentsByMemberInput, signal?: AbortSignal) {
  const { memberId, targetType } = segmentsByMemberInputSchema.parse(input);
  return parse(segmentsByMemberResponseSchema, await apiRequest(`segments/by-member/${memberId}?${searchParams({ targetType })}`, { signal })).segments;
}
export async function createSegment(input: CreateSegment) {
  return segment(await apiRequest('segments/', json('POST', { input: createSegmentSchema.parse(input) })));
}
export async function updateSegment(id: string, update: UpdateSegment) {
  return segment(await apiRequest(path(id), json('PATCH', { update: updateSegmentSchema.parse(update) })), id);
}
export async function deleteSegment(id: string) {
  const result = parse(deleteSegmentResponseSchema, await apiRequest(path(id), { method: 'DELETE' }));
  if (result.id !== id || !result.deleted) throw new ApiError('response', 'Deletion was not confirmed. Refresh the segment before trying again.');
  return result;
}
export async function convertSegmentToStatic(id: string) {
  const result = segment(await apiRequest(`${path(id)}/convert-to-static`, { method: 'POST' }), id);
  if (result.kind !== 'static') throw new ApiError('response', 'Conversion was not confirmed. Refresh the segment before trying again.');
  return result;
}
export async function getSegmentMembers(id: string, input: SegmentMembersInput = {}, signal?: AbortSignal) {
  const result = parse(segmentMembersResponseSchema, await apiRequest(`${path(id)}/members?${searchParams(segmentMembersInputSchema.parse(input))}`, { signal }));
  if (result.data.some(member => member.segmentId !== id)) throw new ApiError('response', 'Members belong to a different segment. Please refresh.');
  return result;
}
export async function addSegmentMember(id: string, memberId: string) {
  return parse(addMemberResponseSchema, await apiRequest(`${path(id)}/members/${segmentIdSchema.parse(memberId)}`, { method: 'POST' }));
}
export async function removeSegmentMember(id: string, memberId: string) {
  return parse(removeMemberResponseSchema, await apiRequest(`${path(id)}/members/${segmentIdSchema.parse(memberId)}`, { method: 'DELETE' }));
}
