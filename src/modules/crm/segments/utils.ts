import { z } from 'zod';
import { ApiError } from '@/lib/api-client';
import { buildFilterGroup, filterGroupSchema, filterOperators, type ConditionDraft, type GroupDraft } from '@/lib/filter-builder';
import type { FilterField } from '@/components/ui';
import type { SegmentFilter } from './schemas';

export const contactFilterFields: FilterField[] = [
  ...['email', 'billingEmail', 'firstName', 'lastName', 'fullName', 'phone'].map(value => ({ value, label: value, type: 'text' as const })),
  ...['status', 'events_attended', 'items_purchased', 'products_purchased'].map(value => ({ value, label: value, type: 'select' as const })),
  ...['createdAt', 'updatedAt', 'leastRecentOrder', 'mostRecentOrder'].map(value => ({ value, label: value, type: 'date' as const })),
  ...['orderSum', 'grossSum'].map(value => ({ value, label: value, type: 'number' as const })),
];
export const segmentFilterFields: FilterField[] = [
  { value: 'name', label: 'Name', type: 'text' }, { value: 'targetType', label: 'Target type', type: 'select' },
  { value: 'status', label: 'Status', type: 'select' }, { value: 'kind', label: 'Kind', type: 'select' },
  { value: 'memberCount', label: 'Member count', type: 'number' }, { value: 'createdAt', label: 'Created', type: 'date' },
];
export function segmentErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    if (error.code === 'conflict') return 'A segment with this name already exists for this target type. Choose another name.';
    return error.message;
  }
  return 'Check your information and try again.';
}
// Compare JSON structure without depending on property insertion order.
function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  const object = z.record(z.string(), z.unknown()).safeParse(value);
  if (object.success) return `{${Object.keys(object.data).sort().map(key => `${JSON.stringify(key)}:${canonical(object.data[key])}`).join(',')}}`;
  return JSON.stringify(value) ?? 'undefined';
}
export function readSegmentFilters(filters: SegmentFilter[], fields: readonly FilterField[]): GroupDraft[] | undefined {
  try {
    const parsed = z.array(filterGroupSchema).parse(filters);
    function group(value: z.infer<typeof filterGroupSchema>): GroupDraft {
      return { kind: 'group', logic: value.logic, conditions: value.conditions.map(item => {
        if ('logic' in item) return group(item);
        const range = z.object({ start: z.union([z.string(), z.number()]), end: z.union([z.string(), z.number()]) }).safeParse(item.value);
        const knownType = fields.find(field => field.value === item.field)?.type;
        let type: ConditionDraft['type'] = knownType ?? 'text';
        if (!knownType) {
          if (typeof item.value === 'number' || (range.success && typeof range.data.start === 'number')) type = 'number';
          else if (item.operator === 'is_between' || ['is_before', 'is_after'].includes(item.operator)) type = 'date';
          else if (['is_any_of', 'is_none_of'].includes(item.operator)) type = 'select';
        }
        if (![...filterOperators[type], 'is_empty', 'is_not_empty'].some(operator => operator === item.operator)) throw new Error('Unsupported operator');
        return { kind: 'condition', field: item.field, type, operator: item.operator,
          value: range.success ? String(range.data.start) : Array.isArray(item.value) ? item.value.join(',') : item.value === undefined ? '' : String(item.value),
          end: range.success ? String(range.data.end) : '' };
      }) };
    }
    const drafts = parsed.map(group);
    // Extensions, non-string arrays, comma-containing values, and normalization
    // differences must never be silently rewritten by the visual editor.
    return canonical(drafts.map(buildFilterGroup)) === canonical(filters) ? drafts : undefined;
  } catch { return undefined; }
}
