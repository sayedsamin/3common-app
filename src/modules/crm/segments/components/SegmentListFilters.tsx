import { View } from 'react-native';
import { Input, Text, type ListState } from '@/components/ui';
import { segmentListDrafts } from '../list-filters';
import { segmentFilterFields } from '../utils';
import { SegmentFilters } from './SegmentFilters';

export function SegmentListFilters({ draft, onChange }: { draft: ListState; onChange: (changes: Partial<ListState>) => void }) {
  return <View className="gap-4">
    <Input label="Folder" helperText="Enter a folder ID or unfiled. Leave blank for all folders." autoCapitalize="none" autoCorrect={false}
      value={draft.filters.folderId ?? ''} onChangeText={folderId => onChange({ filters: { ...draft.filters, folderId } })} />
    <Text variant="label">Advanced conditions</Text>
    <SegmentFilters fields={segmentFilterFields} value={segmentListDrafts(draft.filters.advanced)}
      onChange={groups => onChange({ filters: { ...draft.filters, advanced: groups.length ? JSON.stringify(groups) : '' } })} />
  </View>;
}
