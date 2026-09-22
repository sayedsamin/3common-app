import { z } from 'zod';
import { groupSchema, type Query } from '../../src/modules/ai/contracts';
import { failure } from './errors';

type FieldType = 'text' | 'number' | 'date' | 'select' | 'boolean';
export const contactFields: Record<string, FieldType> = {
  _id: 'text', vendorId: 'text',
  email: 'text', billingEmail: 'text', firstName: 'text', lastName: 'text', fullName: 'text', phone: 'text', status: 'select',
  grossSum: 'number', orderSum: 'number', leastRecentOrder: 'date', mostRecentOrder: 'date', createdAt: 'date', updatedAt: 'date',
  events_attended: 'select', items_purchased: 'select', products_purchased: 'select',
};
export const eventFields: Record<string, FieldType> = {
  name: 'text', status: 'select', type: 'select', start: 'date', end: 'date', ticketSum: 'number',
  venueName: 'text', tags: 'select', customTags: 'select', createdAt: 'date', updatedAt: 'date',
  isPublic: 'boolean', isVirtual: 'boolean', isCancelled: 'boolean', 'location.address': 'text',
  schedule: 'select', language: 'select', locationPlaceholder: 'text', virtualEventLink: 'text', description: 'text',
};
const families: Record<FieldType, readonly string[]> = {
  text: ['is_equal_to_any_of', 'is_not_equal_to_any_of', 'contains', 'contains_exactly'],
  number: ['is_equal_to', 'is_not_equal_to', 'is_greater_than', 'is_greater_than_or_equal_to', 'is_less_than', 'is_less_than_or_equal_to', 'is_between'],
  date: ['is_before', 'is_after', 'is_between'], select: ['is_any_of', 'is_none_of'], boolean: ['is_equal_to', 'is_not_equal_to'],
};
export function validateQuery(query: Query) {
  if (query.tool !== 'list_contacts' && query.tool !== 'list_events') return;
  const fields = query.tool === 'list_contacts' ? contactFields : eventFields;
  let count = 0;
  function visit(group: z.infer<typeof groupSchema>, depth: number) {
    if (depth > 8) throw failure('chat', 'validation', 'Use at most eight levels of filter groups.');
    for (const condition of group.conditions) {
      if (++count > 100) throw failure('chat', 'validation', 'Use at most 100 filter conditions.');
      if ('logic' in condition) { visit(condition, depth + 1); continue; }
      const type = fields[condition.field];
      if (!type) throw failure('chat', 'validation', `Unsupported filter field: ${condition.field}. Ask for a supported field; no filter was applied.`);
      const { operator, value } = condition;
      if (operator === 'is_empty' || operator === 'is_not_empty') {
        if (value !== undefined) throw failure('chat', 'validation', 'Empty checks must not have a value.');
        continue;
      }
      if (!families[type].includes(operator)) throw failure('chat', 'validation', `The operator does not match ${condition.field}.`);
      const valid = (v: unknown) => type === 'number' ? typeof v === 'number' && Number.isFinite(v) : type === 'boolean' ? typeof v === 'boolean' : type === 'date' ? z.iso.datetime({ offset: true }).safeParse(v).success : typeof v === 'string' && v.length > 0;
      if (operator === 'is_between') {
        const range = z.object({ start: z.union([z.string(), z.number()]), end: z.union([z.string(), z.number()]) }).safeParse(value);
        if (!range.success || !valid(range.data.start) || !valid(range.data.end) || (type === 'date' ? Date.parse(String(range.data.start)) > Date.parse(String(range.data.end)) : range.data.start > range.data.end)) throw failure('chat', 'validation', 'Provide a valid range with the start before the end.');
        if (type === 'date') condition.value = { start: new Date(String(range.data.start)).toISOString(), end: new Date(String(range.data.end)).toISOString() };
      } else if (['is_equal_to_any_of', 'is_not_equal_to_any_of', 'is_any_of', 'is_none_of'].includes(operator)) {
        if (!Array.isArray(value) || !value.length || !value.every(valid)) throw failure('chat', 'validation', 'Provide a nonempty list of matching filter values.');
      } else {
        if (!valid(value)) throw failure('chat', 'validation', `Invalid value for ${condition.field}.`);
        if (type === 'date') condition.value = new Date(String(value)).toISOString();
      }
    }
  }
  query.input.filters?.forEach(group => visit(group, 1));
  if (query.tool === 'list_events') {
    if (!['start', 'end', 'name', ...Object.keys(eventFields)].includes(query.input.sortField)) throw failure('chat', 'validation', 'Unsupported event sort field.');
    const { startAfter, startBefore } = query.input;
    if (startAfter && startBefore && Date.parse(startAfter) > Date.parse(startBefore)) throw failure('chat', 'validation', 'The start date must precede the end date.');
  }
}
