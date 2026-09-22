import { useState } from 'react';
import { View } from 'react-native';
import { Button, Input, Text, type ListState } from '@/components/ui';
import { commonOperators, filterOperators, newCondition, newGroup, readFilterDraft, type ConditionDraft, type GroupDraft } from '../filter-schemas';

const fields: { value: string; label: string; type: ConditionDraft['type'] }[] = [
  { value: 'name', label: 'Name', type: 'text' },
  { value: 'status', label: 'Status', type: 'select' },
  { value: 'start', label: 'Start date', type: 'date' },
  { value: 'end', label: 'End date', type: 'date' },
  { value: 'ticketSum', label: 'Tickets and products sold', type: 'number' },
  { value: 'type', label: 'Event type', type: 'select' },
  { value: 'venueName', label: 'Venue name', type: 'text' },
  { value: 'tags', label: 'Tags', type: 'select' },
  { value: 'customTags', label: 'Custom tags', type: 'select' },
  { value: 'createdAt', label: 'Created date', type: 'date' },
  { value: 'updatedAt', label: 'Updated date', type: 'date' },
];
const operatorLabels: Record<ConditionDraft['operator'], string> = {
  is_equal_to_any_of: 'Equals any of', is_not_equal_to_any_of: 'Does not equal any of', contains: 'Contains', contains_exactly: 'Contains exactly',
  is_before: 'Is before', is_after: 'Is after', is_between: 'Is between', is_equal_to: 'Equals', is_not_equal_to: 'Does not equal',
  is_greater_than: 'Is greater than', is_greater_than_or_equal_to: 'Is at least', is_less_than: 'Is less than', is_less_than_or_equal_to: 'Is at most',
  is_any_of: 'Is any of', is_none_of: 'Is none of', is_empty: 'Is empty', is_not_empty: 'Is not empty',
};

function Select<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: readonly { value: T; label: string }[]; onChange: (value: T) => void }) {
  const [open, setOpen] = useState(false);
  return <View className="min-w-0 gap-1">
    <Button label={`${label}: ${options.find(item => item.value === value)?.label ?? value}`} variant="secondary" trailingIcon={open ? 'chevron-up' : 'chevron-down'}
      accessibilityState={{ expanded: open }} onPress={() => setOpen(!open)} />
    {open ? <View className="gap-1">{options.map(option => <Button key={option.value} label={option.label} variant={option.value === value ? 'secondary' : 'ghost'}
      accessibilityRole="radio" accessibilityLabel={`${label}: ${option.label}`} accessibilityState={{ checked: option.value === value }} onPress={() => { onChange(option.value); setOpen(false); }} />)}</View> : null}
  </View>;
}

function Condition({ value, onChange, label }: { value: ConditionDraft; onChange: (value: ConditionDraft) => void; label: string }) {
  const operators = [...filterOperators[value.type], ...commonOperators];
  const needsValue = value.operator !== 'is_empty' && value.operator !== 'is_not_empty';
  const multiple = ['is_any_of', 'is_none_of', 'is_equal_to_any_of', 'is_not_equal_to_any_of'].includes(value.operator);
  const hint = value.type === 'date' ? 'YYYY-MM-DD (UTC), or a date and time with a timezone.' : multiple ? 'Separate values with commas.' : undefined;
  return <View className="min-w-0 gap-2">
    <Select label={`${label} field`} value={fields.some(field => field.value === value.field) ? value.field : 'custom'} options={[...fields, { value: 'custom', label: 'Other field' }]}
      onChange={field => { const type = fields.find(item => item.value === field)?.type ?? 'text'; onChange({ ...value, field: field === 'custom' ? '' : field, type, operator: filterOperators[type][0], value: '', end: '' }); }} />
    {!fields.some(field => field.value === value.field) ? <>
      <Input label={`${label} field name`} value={value.field} autoCapitalize="none" autoCorrect={false} onChangeText={field => onChange({ ...value, field })} />
      <Select label={`${label} value type`} value={value.type} options={(['text', 'date', 'number', 'select'] as const).map(type => ({ value: type, label: type }))}
        onChange={type => onChange({ ...value, type, operator: filterOperators[type][0], value: '', end: '' })} />
    </> : null}
    <Select label={`${label} comparison`} value={value.operator} options={operators.map(operator => ({ value: operator, label: operatorLabels[operator] }))}
      onChange={operator => onChange({ ...value, operator })} />
    {needsValue ? <Input label={`${label} value`} value={value.value} helperText={hint} autoCapitalize="none" autoCorrect={false}
      keyboardType={value.type === 'number' ? 'numbers-and-punctuation' : 'default'} onChangeText={next => onChange({ ...value, value: next })} /> : null}
    {value.operator === 'is_between' ? <Input label={`${label} range end`} value={value.end} helperText={hint} autoCapitalize="none" autoCorrect={false}
      keyboardType={value.type === 'number' ? 'numbers-and-punctuation' : 'default'} onChangeText={end => onChange({ ...value, end })} /> : null}
  </View>;
}

function Group({ value, onChange, label = 'Group' }: { value: GroupDraft; onChange: (value: GroupDraft) => void; label?: string }) {
  return <View className="min-w-0 gap-3">
    <Text variant="label">{label}</Text>
    <Select label={`${label} match`} value={value.logic} options={[{ value: 'and', label: 'All conditions (AND)' }, { value: 'or', label: 'Any condition (OR)' }]}
      onChange={logic => onChange({ ...value, logic })} />
    {value.conditions.map((item, index) => {
      const itemLabel = `${label} ${index + 1}`;
      const update = (next: GroupDraft | ConditionDraft) => onChange({ ...value, conditions: value.conditions.map((current, i) => i === index ? next : current) });
      return <View key={index} className="min-w-0 gap-2 border-t border-border pt-3">
        {item.kind === 'group' ? <Group value={item} onChange={update} label={itemLabel} /> : <Condition value={item} onChange={update} label={itemLabel} />}
        <Button label={`Remove ${itemLabel.toLowerCase()}`} variant="ghost" leadingIcon="close" onPress={() => onChange({ ...value, conditions: value.conditions.filter((_, i) => i !== index) })} />
      </View>;
    })}
    <View className="flex-row flex-wrap gap-2">
      <Button label={`Add condition to ${label.toLowerCase()}`} variant="secondary" leadingIcon="plus" onPress={() => onChange({ ...value, conditions: [...value.conditions, newCondition()] })} />
      <Button label={`Add subgroup to ${label.toLowerCase()}`} variant="ghost" leadingIcon="plus" onPress={() => onChange({ ...value, conditions: [...value.conditions, newGroup()] })} />
    </View>
  </View>;
}

export function EventFilters({ draft, onChange }: { draft: ListState; onChange: (changes: Partial<ListState>) => void }) {
  const group = readFilterDraft(draft.filters.advanced);
  const setFilter = (key: string, value: string) => onChange({ filters: { ...draft.filters, [key]: value } });
  return <View className="min-w-0 gap-4">
    <View className="gap-3">
      <Text variant="label">Event start date</Text>
      <Text variant="caption">Include events starting on or after the first date and on or before the last date. Dates use UTC; a last date includes the whole day.</Text>
      <Input label="Starts on or after" placeholder="YYYY-MM-DD" value={draft.filters.startAfter ?? ''} autoCapitalize="none" autoCorrect={false}
        onChangeText={value => setFilter('startAfter', value)} onClear={() => setFilter('startAfter', '')} clearLabel="Clear start date" />
      <Input label="Starts on or before" placeholder="YYYY-MM-DD" value={draft.filters.startBefore ?? ''} autoCapitalize="none" autoCorrect={false}
        onChangeText={value => setFilter('startBefore', value)} onClear={() => setFilter('startBefore', '')} clearLabel="Clear end date" />
    </View>
    <View className="gap-3">
      <Text variant="label">Advanced conditions</Text>
      <Text variant="caption">Combine conditions with all or any matching. These apply together with your search, status, and date range.</Text>
      {group ? <><Group value={group} onChange={next => setFilter('advanced', JSON.stringify(next))} />
        <Button label="Remove advanced conditions" variant="ghost" onPress={() => setFilter('advanced', '')} /></>
        : <Button label="Add advanced conditions" variant="secondary" leadingIcon="plus" onPress={() => setFilter('advanced', JSON.stringify(newGroup()))} />}
    </View>
  </View>;
}
