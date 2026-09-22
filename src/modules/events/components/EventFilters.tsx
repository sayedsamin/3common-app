import { View } from 'react-native';
import { Button, Input, Text, FilterGroupEditor, type ListState } from '@/components/ui';
import { newGroup, readFilterDraft, type ConditionDraft } from '../filter-schemas';

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
      {group ? <><FilterGroupEditor fields={fields} value={group} onChange={next => setFilter('advanced', JSON.stringify(next))} />
        <Button label="Remove advanced conditions" variant="ghost" onPress={() => setFilter('advanced', '')} /></>
        : <Button label="Add advanced conditions" variant="secondary" leadingIcon="plus" onPress={() => setFilter('advanced', JSON.stringify(newGroup()))} />}
    </View>
  </View>;
}
