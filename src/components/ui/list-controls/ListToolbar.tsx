import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Button } from '../Button';
import { Icon } from '../Icon';
import { IconButton } from '../IconButton';
import { OptionSheet } from '../OptionSheet';
import { SearchInput } from '../SearchInput';
import { Text } from '../Text';
import { cn } from '@/lib/cn';
import type { ListFilter, ListOption, ListState } from './types';
export type ListToolbarProps = {
  value: ListState; onChange: (value: ListState) => void; primaryOptions: readonly ListOption[];
  sortOptions: readonly ListOption[]; filters?: readonly ListFilter[]; searchPlaceholder?: string;
};
function Choice({ label, selected, onPress, accessibilityLabel }: { label: string; selected: boolean; onPress: () => void; accessibilityLabel?: string }) {
  return <Pressable accessibilityRole="radio" accessibilityLabel={accessibilityLabel ?? label} accessibilityState={{ checked: selected }}
    onPress={onPress} className={cn('min-h-12 flex-row items-center justify-between gap-3 rounded-control px-3 py-3 web:focus-visible:outline-2 web:focus-visible:outline-focus', selected && 'bg-success-soft')}>
    <Text className={selected ? 'text-success' : 'text-foreground'}>{label}</Text>
    <Icon name={selected ? 'radiobox-marked' : 'radiobox-blank'} tone={selected ? 'success' : 'muted'} />
  </Pressable>;
}
export function ListToolbar({ value, onChange, primaryOptions, sortOptions, filters = [], searchPlaceholder = 'Search items' }: ListToolbarProps) {
  const [panel, setPanel] = useState<{ kind: 'filters' | 'sort'; draft: ListState } | null>(null);
  const defaultFilter = primaryOptions[0]?.value ?? '';
  const activeCount = (value.primaryFilter !== defaultFilter ? 1 : 0) + filters.filter(filter => Boolean(value.filters[filter.key])).length;
  const sortLabel = sortOptions.find(option => option.value === value.sortField)?.label ?? 'Choose field';
  function updateDraft(changes: Partial<ListState>) { setPanel(current => current ? { ...current, draft: { ...current.draft, ...changes } } : null); }
  function apply() {
    if (!panel) return;
    const changes = panel.kind === 'filters' ? { primaryFilter: panel.draft.primaryFilter, filters: panel.draft.filters } : { sortField: panel.draft.sortField, sortDirection: panel.draft.sortDirection };
    onChange({ ...value, ...changes, page: 1 });
    setPanel(null);
  }
  return <View className="gap-2">
    <View className="flex-row items-center gap-2">
      <View className="min-w-0 flex-1"><SearchInput value={value.search} onChangeText={search => onChange({ ...value, search, page: 1 })} placeholder={searchPlaceholder} /></View>
      <IconButton label={activeCount ? `Filters (${activeCount})` : 'Filters'} icon="tune-variant" variant="secondary" isActive={activeCount > 0}
        accessibilityState={{ expanded: panel?.kind === 'filters' }} onPress={() => setPanel({ kind: 'filters', draft: { ...value, filters: { ...value.filters } } })} />
      <IconButton label={`Sort: ${sortLabel}`} icon="sort-variant" variant="secondary" accessibilityState={{ expanded: panel?.kind === 'sort' }}
        onPress={() => setPanel({ kind: 'sort', draft: { ...value, filters: { ...value.filters } } })} />
    </View>
    {activeCount > 0 ? <View className="flex-row flex-wrap items-center gap-2">
      {value.primaryFilter !== defaultFilter ? <Button size="compact" variant="ghost" label={primaryOptions.find(option => option.value === value.primaryFilter)?.label ?? value.primaryFilter}
        trailingIcon="close" accessibilityLabel="Remove status filter" className="bg-success-soft" onPress={() => onChange({ ...value, primaryFilter: defaultFilter, page: 1 })} /> : null}
      {filters.filter(filter => Boolean(value.filters[filter.key])).map(filter => <Button key={filter.key} size="compact" variant="ghost"
        label={filter.options.find(option => option.value === value.filters[filter.key])?.label ?? filter.label} trailingIcon="close"
        accessibilityLabel={`Remove ${filter.label.toLowerCase()} filter`} onPress={() => { const next = { ...value.filters }; delete next[filter.key]; onChange({ ...value, filters: next, page: 1 }); }} />)}
    </View> : null}
    <OptionSheet visible={panel !== null} title={panel?.kind === 'filters' ? 'Filters' : 'Sort'} onClose={() => setPanel(null)}
      footer={<View className="flex-row gap-3">
        <Button label="Reset" variant="secondary" onPress={() => panel?.kind === 'filters' ? updateDraft({ primaryFilter: defaultFilter, filters: {} }) : updateDraft({ sortField: sortOptions[0]?.value ?? value.sortField, sortDirection: 'desc' })} />
        <Button label={panel?.kind === 'filters' ? 'Apply filters' : 'Apply sort'} className="flex-1" onPress={apply} />
      </View>}>
      {panel?.kind === 'filters' ? <View className="gap-4">
        <View><Text variant="caption" className="px-3 py-2">STATUS</Text>{primaryOptions.map(option => <Choice key={option.value} label={option.label}
          accessibilityLabel={`Primary filter: ${option.label}`} selected={panel.draft.primaryFilter === option.value} onPress={() => updateDraft({ primaryFilter: option.value })} />)}</View>
        {filters.map(filter => <View key={filter.key}><Text variant="label" className="px-3 py-2">{filter.label}</Text>
          <Choice label="Any" accessibilityLabel={`${filter.label}: Any`} selected={!panel.draft.filters[filter.key]} onPress={() => { const next = { ...panel.draft.filters }; delete next[filter.key]; updateDraft({ filters: next }); }} />
          {filter.options.map(option => <Choice key={option.value} label={option.label} accessibilityLabel={`${filter.label}: ${option.label}`}
            selected={panel.draft.filters[filter.key] === option.value} onPress={() => updateDraft({ filters: { ...panel.draft.filters, [filter.key]: option.value } })} />)}
        </View>)}
      </View> : panel ? <View className="gap-4">
        <View><Text variant="caption" className="px-3 py-2">SORT BY</Text>{sortOptions.map(option => <Choice key={option.value} label={option.label} accessibilityLabel={`Sort by ${option.label}`}
          selected={panel.draft.sortField === option.value} onPress={() => updateDraft({ sortField: option.value })} />)}</View>
        <View><Text variant="caption" className="px-3 py-2">DIRECTION</Text>
          <Choice label="Ascending" selected={panel.draft.sortDirection === 'asc'} onPress={() => updateDraft({ sortDirection: 'asc' })} />
          <Choice label="Descending" selected={panel.draft.sortDirection === 'desc'} onPress={() => updateDraft({ sortDirection: 'desc' })} />
        </View>
      </View> : null}
    </OptionSheet>
  </View>;
}
