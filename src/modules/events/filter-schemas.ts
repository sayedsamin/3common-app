import { buildFilterGroup, dateValue, readFilterDraft } from '@/lib/filter-builder';
export * from '@/lib/filter-builder';

export function eventFilterInput(filters: Record<string, string>) {
  const startAfter = filters.startAfter ? dateValue(filters.startAfter) : undefined;
  const startBefore = filters.startBefore ? dateValue(filters.startBefore, true) : undefined;
  if (startAfter && startBefore && startAfter > startBefore) throw new Error('The start date must be before or equal to the end date.');
  const draft = readFilterDraft(filters.advanced);
  return { startAfter, startBefore, filters: draft ? [buildFilterGroup(draft)] : undefined };
}

export function eventFilterError(filters: Record<string, string>) {
  try { eventFilterInput(filters); return undefined; }
  catch (error) { return error instanceof Error ? error.message : 'Check your filter values.'; }
}
