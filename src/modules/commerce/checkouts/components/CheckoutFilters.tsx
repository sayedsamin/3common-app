import { View } from 'react-native';
import { Button, FilterGroupEditor, Input, Text, type ListState } from '@/components/ui';
import { newGroup } from '@/lib/filter-builder';
import { checkoutFilterDrafts, checkoutFilterFields } from '../utils';
import { CheckoutEventPicker } from './CheckoutEventPicker';

export function CheckoutFilters({ draft, onChange, eventLabels, onEventLabel }: {
  draft: ListState; onChange: (changes: Partial<ListState>) => void; eventLabels: Readonly<Record<string, string>>; onEventLabel: (id: string, label: string) => void;
}) {
  const groups = checkoutFilterDrafts(draft.filters.advanced);
  const update = (key: string, value: string) => onChange({ filters: { ...draft.filters, [key]: value } });
  const updateGroups = (next: typeof groups) => update('advanced', next.length ? JSON.stringify(next) : '');
  return <View className="gap-4">
    <CheckoutEventPicker value={draft.filters.eventId ?? ''} label={eventLabels[draft.filters.eventId ?? '']} onSelect={(id, label) => { onEventLabel(id, label); update('eventId', id); }} />
    <Input label="Timeslot ID" helperText="Leave blank for all timeslots." value={draft.filters.timeslotId ?? ''} onChangeText={value => update('timeslotId', value.trim())} autoCapitalize="none" autoCorrect={false} />
    <Text variant="label">Advanced conditions</Text>
    {groups.map((group, index) => <View key={index} className="gap-2 rounded-control border border-border p-3">
      <FilterGroupEditor fields={checkoutFilterFields} value={group} label={`Group ${index + 1}`} onChange={value => updateGroups(groups.map((item, i) => index === i ? value : item))} />
      <Button label={`Remove group ${index + 1}`} variant="ghost" onPress={() => updateGroups(groups.filter((_, i) => i !== index))} />
    </View>)}
    <Button label="Add filter group" variant="secondary" leadingIcon="plus" onPress={() => updateGroups([...groups, newGroup()])} />
  </View>;
}
