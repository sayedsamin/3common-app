import type { z } from 'zod';
import type { groupSchema, Query } from './contracts';

const labels: Record<string, string> = { ticketSum: 'Tickets and products sold', grossSum: 'Spending', orderSum: 'Orders', mostRecentOrder: 'Most recent order', leastRecentOrder: 'First order', events_attended: 'Events attended', items_purchased: 'Items purchased', products_purchased: 'Products purchased' };
const operators: Record<string, string> = { is_equal_to_any_of: 'matches any of', is_not_equal_to_any_of: 'does not match', contains: 'contains', contains_exactly: 'contains exactly', is_before: 'is before', is_after: 'is after', is_between: 'is between', is_equal_to: 'equals', is_not_equal_to: 'does not equal', is_greater_than: 'is greater than', is_greater_than_or_equal_to: 'is at least', is_less_than: 'is less than', is_less_than_or_equal_to: 'is at most', is_any_of: 'is any of', is_none_of: 'is none of', is_empty: 'is empty', is_not_empty: 'is not empty' };
function label(value: string) { return labels[value] ?? value.replace(/([a-z])([A-Z])/g, '$1 $2').replaceAll('_', ' '); }
function describeGroup(group: z.infer<typeof groupSchema>): string {
  return '(' + group.conditions.map(condition => {
    if ('logic' in condition) return describeGroup(condition);
    const value = condition.value;
    const display = value === undefined ? '' : Array.isArray(value) ? value.join(', ') : typeof value === 'object' ? `${value.start} and ${value.end}` : String(value);
    return `${label(condition.field)} ${operators[condition.operator] ?? condition.operator} ${display}`.trim();
  }).join(group.logic === 'and' ? ' AND ' : ' OR ') + ')';
}
export function describeQuery(query: Query): string {
  const parts: string[] = [];
  const input = query.input;
  if ('search' in input && input.search) parts.push(`Search: “${input.search}”`);
  if ('status' in input && input.status) parts.push(`Status: ${input.status}`);
  if ('filter' in input && input.filter) parts.push(`Filter: ${label(input.filter)}`);
  if ('startAfter' in input && input.startAfter) parts.push(`Starts on or after: ${input.startAfter} (UTC)`);
  if ('startBefore' in input && input.startBefore) parts.push(`Starts on or before: ${input.startBefore} (UTC)`);
  if ('filters' in input) input.filters?.forEach(group => parts.push(describeGroup(group)));
  if ('sortField' in input) parts.push(`Sorted by ${label(input.sortField)}, ${input.sortDirection === 'asc' ? 'ascending' : 'descending'}`);
  if ('sort' in input) parts.push(input.sort === 'oldest' ? 'Oldest first' : 'Newest first');
  if ('id' in input) parts.push(`Record: ${input.id}`);
  return parts.join('\n') || 'No filters';
}
