import type { CreateSegment, Segment } from './schemas';
export const id = 'abcdef0123456789abcdef01';
export const memberId = 'abcdef0123456789abcdef02';
export const segment: Segment = { id, ownerId: 'workspace', name: 'Frequent customers', targetType: 'contact', kind: 'active', status: 'active', trackMembershipEvents: true,
  filters: [{ logic: 'and', conditions: [{ field: 'orderSum', operator: 'is_greater_than', value: 5 }] }], createdAt: '2026-09-01T12:00:00Z', updatedAt: '2026-09-01T12:00:00Z' };
export const input: CreateSegment = { name: segment.name, targetType: 'contact', kind: 'active', filters: segment.filters };
export const member = { segmentId: id, memberId, joinedAt: '2026-09-01T12:00:00Z', extra: { label: 'Member' } };
export function response(data: unknown, status = 200) { return new Response(JSON.stringify(data), { status }); }
export function page<T>(data: T[], pageNumber = 0, hasMore = false) { return { data, pageNumber, pageSize: 20, hasMore }; }
