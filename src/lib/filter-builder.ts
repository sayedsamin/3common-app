import { z } from 'zod';

export const filterOperators = {
  text: ['is_equal_to_any_of', 'is_not_equal_to_any_of', 'contains', 'contains_exactly'],
  date: ['is_before', 'is_after', 'is_between'],
  number: ['is_equal_to', 'is_not_equal_to', 'is_greater_than', 'is_greater_than_or_equal_to', 'is_less_than', 'is_less_than_or_equal_to', 'is_between'],
  select: ['is_any_of', 'is_none_of'],
} as const;
export const commonOperators = ['is_empty', 'is_not_empty'] as const;
export const operatorSchema = z.enum([...filterOperators.text, ...filterOperators.date, ...filterOperators.number, ...filterOperators.select, ...commonOperators]);
export const conditionSchema = z.object({ field: z.string().trim().min(1), operator: operatorSchema, value: z.json().optional() });
export const filterGroupSchema = z.object({
  logic: z.enum(['and', 'or']),
  get conditions() { return z.array(z.union([conditionSchema, filterGroupSchema])).min(1); },
});
export type FilterGroup = z.infer<typeof filterGroupSchema>;

export const conditionDraftSchema = z.object({
  kind: z.literal('condition'), field: z.string(), type: z.enum(['text', 'date', 'number', 'select']),
  operator: operatorSchema, value: z.string(), end: z.string(),
});
export const groupDraftSchema = z.object({
  kind: z.literal('group'), logic: z.enum(['and', 'or']),
  get conditions() { return z.array(z.union([conditionDraftSchema, groupDraftSchema])); },
});
export type GroupDraft = z.infer<typeof groupDraftSchema>;
export type ConditionDraft = z.infer<typeof conditionDraftSchema>;
export const newCondition = (): ConditionDraft => ({ kind: 'condition', field: 'name', type: 'text', operator: 'contains', value: '', end: '' });
export const newGroup = (): GroupDraft => ({ kind: 'group', logic: 'and', conditions: [newCondition()] });

export function readFilterDraft(value?: string): GroupDraft | undefined {
  if (!value) return undefined;
  return groupDraftSchema.parse(JSON.parse(value));
}

export function dateValue(value: string, endOfDay = false) {
  const trimmed = value.trim();
  if (z.iso.date().safeParse(trimmed).success) return `${trimmed}T${endOfDay ? '23:59:59.999' : '00:00:00.000'}Z`;
  if (!z.iso.datetime({ offset: true }).safeParse(trimmed).success) throw new Error('Enter a valid date (YYYY-MM-DD) or date and time with a timezone.');
  return new Date(trimmed).toISOString();
}

function buildCondition(draft: ConditionDraft): z.infer<typeof conditionSchema> {
  const field = draft.field.trim();
  if (!field) throw new Error('Choose a field for every condition.');
  const operator = draft.operator;
  if (operator === 'is_empty' || operator === 'is_not_empty') return { field, operator };
  if (![...filterOperators[draft.type]].some(value => value === operator)) throw new Error('Choose an operator that matches the field type.');
  if (!draft.value.trim()) throw new Error('Enter a value for every condition.');
  const scalar = (value: string, end = false) => {
    if (draft.type === 'date') return dateValue(value, end);
    if (draft.type === 'number') {
      if (!value.trim() || !Number.isFinite(Number(value))) throw new Error('Enter a valid number for every numeric condition.');
      return Number(value);
    }
    return value.trim();
  };
  if (operator === 'is_between') {
    const start = scalar(draft.value), end = scalar(draft.end, true);
    if (start > end) throw new Error('The range start must be before or equal to its end.');
    return { field, operator, value: { start, end } };
  }
  if (['is_any_of', 'is_none_of', 'is_equal_to_any_of', 'is_not_equal_to_any_of'].includes(operator)) {
    const value = draft.value.split(',').map(item => item.trim()).filter(Boolean);
    if (!value.length) throw new Error('Enter at least one value.');
    return { field, operator, value };
  }
  return { field, operator, value: scalar(draft.value) };
}

export function buildFilterGroup(draft: GroupDraft): FilterGroup {
  if (!draft.conditions.length) throw new Error('Add a condition to each group or remove the empty group.');
  return { logic: draft.logic, conditions: draft.conditions.map(item => item.kind === 'group' ? buildFilterGroup(item) : buildCondition(item)) };
}

