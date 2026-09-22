import { View } from 'react-native';
import { Button, FilterGroupEditor, Text, type FilterField } from '@/components/ui';
import { filterOperators, type GroupDraft } from '@/lib/filter-builder';

export function SegmentFilters({ value, onChange, fields }: { value: GroupDraft[] | undefined; onChange: (value: GroupDraft[]) => void; fields: readonly FilterField[] }) {
  function add() {
    const field = fields[0];
    const type = field?.type ?? 'text';
    onChange([...(value ?? []), { kind: 'group', logic: 'and', conditions: [{ kind: 'condition', field: field?.value ?? '', type, operator: filterOperators[type][0], value: '', end: '' }] }]);
  }
  return <View className="gap-3">
    <Text variant="label">Filter groups</Text>
    {value === undefined ? <>
      <Text>These saved filters contain conditions this editor cannot represent. They will be preserved when you save other changes.</Text>
      <Button label="Replace all saved filters" variant="secondary" onPress={add} />
    </> : <>
      {value.map((group, index) => <View key={index} className="gap-2 rounded-control border border-border p-3">
        <FilterGroupEditor fields={fields} value={group} label={`Group ${index + 1}`} onChange={next => onChange(value.map((item, i) => i === index ? next : item))} />
        <Button label={`Remove group ${index + 1}`} variant="ghost" onPress={() => onChange(value.filter((_, i) => i !== index))} />
      </View>)}
      <Button label="Add filter group" variant="secondary" onPress={add} />
    </>}
  </View>;
}
