import { useState } from 'react';
import { View } from 'react-native';
import { Button } from './Button';
import { Input } from './Input';
import { Text } from './Text';
import { commonOperators, filterOperators, newCondition, newGroup, type ConditionDraft, type GroupDraft } from '@/lib/filter-builder';
export type FilterField = { value: string; label: string; type: ConditionDraft['type'] };

const operatorLabels: Record<ConditionDraft['operator'], string> = {
  is_equal_to_any_of: 'Equals any of', is_not_equal_to_any_of: 'Does not equal any of', contains: 'Contains', contains_exactly: 'Contains exactly',
  is_before: 'Is before', is_after: 'Is after', is_between: 'Is between', is_equal_to: 'Equals', is_not_equal_to: 'Does not equal',
  is_greater_than: 'Is greater than', is_greater_than_or_equal_to: 'Is at least', is_less_than: 'Is less than', is_less_than_or_equal_to: 'Is at most',
  is_any_of: 'Is any of', is_none_of: 'Is none of', is_empty: 'Is empty', is_not_empty: 'Is not empty',
};

export function FilterSelect<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: readonly { value: T; label: string }[]; onChange: (value: T) => void }) {
  const [open, setOpen] = useState(false);
  return <View className="min-w-0 gap-1">
    <Button label={`${label}: ${options.find(item => item.value === value)?.label ?? value}`} variant="secondary" trailingIcon={open ? 'chevron-up' : 'chevron-down'}
      accessibilityState={{ expanded: open }} onPress={() => setOpen(!open)} />
    {open ? <View className="gap-1">{options.map(option => <Button key={option.value} label={option.label} variant={option.value === value ? 'secondary' : 'ghost'}
      accessibilityRole="radio" accessibilityLabel={`${label}: ${option.label}`} accessibilityState={{ checked: option.value === value }} onPress={() => { onChange(option.value); setOpen(false); }} />)}</View> : null}
  </View>;
}

function Condition({ value, onChange, label, fields }: { value: ConditionDraft; onChange: (value: ConditionDraft) => void; label: string; fields: readonly FilterField[] }) {
  const operators = [...filterOperators[value.type], ...commonOperators];
  const needsValue = value.operator !== 'is_empty' && value.operator !== 'is_not_empty';
  const multiple = ['is_any_of', 'is_none_of', 'is_equal_to_any_of', 'is_not_equal_to_any_of'].includes(value.operator);
  const hint = value.type === 'date' ? 'YYYY-MM-DD (UTC), or a date and time with a timezone.' : multiple ? 'Separate values with commas.' : undefined;
  return <View className="min-w-0 gap-2">
    <FilterSelect label={`${label} field`} value={fields.some(field => field.value === value.field) ? value.field : 'custom'} options={[...fields, { value: 'custom', label: 'Other field' }]}
      onChange={field => { const type = fields.find(item => item.value === field)?.type ?? 'text'; onChange({ ...value, field: field === 'custom' ? '' : field, type, operator: filterOperators[type][0], value: '', end: '' }); }} />
    {!fields.some(field => field.value === value.field) ? <>
      <Input label={`${label} field name`} value={value.field} autoCapitalize="none" autoCorrect={false} onChangeText={field => onChange({ ...value, field })} />
      <FilterSelect label={`${label} value type`} value={value.type} options={(['text', 'date', 'number', 'select'] as const).map(type => ({ value: type, label: type }))}
        onChange={type => onChange({ ...value, type, operator: filterOperators[type][0], value: '', end: '' })} />
    </> : null}
    <FilterSelect label={`${label} comparison`} value={value.operator} options={operators.map(operator => ({ value: operator, label: operatorLabels[operator] }))}
      onChange={operator => onChange({ ...value, operator })} />
    {needsValue ? <Input label={`${label} value`} value={value.value} helperText={hint} autoCapitalize="none" autoCorrect={false}
      keyboardType={value.type === 'number' ? 'numbers-and-punctuation' : 'default'} onChangeText={next => onChange({ ...value, value: next })} /> : null}
    {value.operator === 'is_between' ? <Input label={`${label} range end`} value={value.end} helperText={hint} autoCapitalize="none" autoCorrect={false}
      keyboardType={value.type === 'number' ? 'numbers-and-punctuation' : 'default'} onChangeText={end => onChange({ ...value, end })} /> : null}
  </View>;
}

export function FilterGroupEditor({ value, onChange, label = 'Group', fields }: { value: GroupDraft; onChange: (value: GroupDraft) => void; label?: string; fields: readonly FilterField[] }) {
  return <View className="min-w-0 gap-3">
    <Text variant="label">{label}</Text>
    <FilterSelect label={`${label} match`} value={value.logic} options={[{ value: 'and', label: 'All conditions (AND)' }, { value: 'or', label: 'Any condition (OR)' }]}
      onChange={logic => onChange({ ...value, logic })} />
    {value.conditions.map((item, index) => {
      const itemLabel = `${label} ${index + 1}`;
      const update = (next: GroupDraft | ConditionDraft) => onChange({ ...value, conditions: value.conditions.map((current, i) => i === index ? next : current) });
      return <View key={index} className="min-w-0 gap-2 border-t border-border pt-3">
        {item.kind === 'group' ? <FilterGroupEditor fields={fields} value={item} onChange={update} label={itemLabel} /> : <Condition fields={fields} value={item} onChange={update} label={itemLabel} />}
        <Button label={`Remove ${itemLabel.toLowerCase()}`} variant="ghost" leadingIcon="close" onPress={() => onChange({ ...value, conditions: value.conditions.filter((_, i) => i !== index) })} />
      </View>;
    })}
    <View className="flex-row flex-wrap gap-2">
      <Button label={`Add condition to ${label.toLowerCase()}`} variant="secondary" leadingIcon="plus" onPress={() => onChange({ ...value, conditions: [...value.conditions, { ...newCondition(), field: fields[0]?.value ?? '', type: fields[0]?.type ?? 'text', operator: !fields[0] || fields[0].type === 'text' ? 'contains' : filterOperators[fields[0].type][0] }] })} />
      <Button label={`Add subgroup to ${label.toLowerCase()}`} variant="ghost" leadingIcon="plus" onPress={() => onChange({ ...value, conditions: [...value.conditions, { ...newGroup(), conditions: [{ ...newCondition(), field: fields[0]?.value ?? '', type: fields[0]?.type ?? 'text', operator: !fields[0] || fields[0].type === 'text' ? 'contains' : filterOperators[fields[0].type][0] }] }] })} />
    </View>
  </View>;
}

