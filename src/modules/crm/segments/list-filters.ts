import { z } from 'zod';
import type { ListState } from '@/components/ui';
import { buildFilterGroup, groupDraftSchema } from '@/lib/filter-builder';
import { segmentsInputSchema } from './schemas';

export function segmentListDrafts(value?: string) {
  return value ? z.array(groupDraftSchema).parse(JSON.parse(value)) : [];
}
export function segmentListInput(controls: ListState) {
  const groups = segmentListDrafts(controls.filters.advanced);
  return segmentsInputSchema.parse({
    pageNumber: controls.page - 1, pageSize: controls.pageSize, search: controls.search,
    sortField: controls.sortField, sortDirection: controls.sortDirection,
    status: controls.primaryFilter === 'all' ? undefined : controls.primaryFilter,
    targetType: controls.filters.targetType || undefined,
    folderId: controls.filters.folderId?.trim() || undefined,
    filters: groups.length ? groups.map(buildFilterGroup) : undefined,
  });
}
export function segmentListFilterError(controls: ListState) {
  try { segmentListInput(controls); return undefined; }
  catch (error) {
    if (error instanceof z.ZodError) return 'Enter a valid folder ID or "unfiled".';
    return error instanceof Error ? error.message : 'Check your filter values.';
  }
}
