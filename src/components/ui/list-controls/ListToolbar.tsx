import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Button } from '../Button';
import { Input } from '../Input';
import { Text } from '../Text';
import type { ListFilter, ListOption, ListState } from './types';

export type ListToolbarProps = {
  value: ListState;
  onChange: (value: ListState) => void;
  primaryOptions: readonly ListOption[];
  sortOptions: readonly ListOption[];
  filters?: readonly ListFilter[];
  searchPlaceholder?: string;
};

export function ListToolbar({ value, onChange, primaryOptions, sortOptions, filters = [], searchPlaceholder = 'Search items…' }: ListToolbarProps) {
  const [panel, setPanel] = useState<'filters' | 'sort' | null>(null);
  const activeCount = filters.filter((filter) => Boolean(value.filters[filter.key])).length;
  const sortLabel = sortOptions.find((option) => option.value === value.sortField)?.label ?? 'Choose field';
  function update(changes: Partial<ListState>) {
    onChange({ ...value, ...changes, page: 1 });
  }

  return (
    <View className="rounded-control border border-control-border bg-surface">
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View className="flex-row gap-2 p-3">
          {primaryOptions.map((option) => (
            <Button key={option.value} label={option.label}
              variant={value.primaryFilter === option.value ? 'secondary' : 'ghost'}
              className={value.primaryFilter === option.value ? 'bg-surface-muted' : undefined}
              accessibilityState={{ selected: value.primaryFilter === option.value }}
              accessibilityLabel={`Primary filter: ${option.label}`}
              onPress={() => update({ primaryFilter: option.value })} />
          ))}
        </View>
      </ScrollView>
      <View className="flex-row flex-wrap items-end gap-3 border-t border-control-border p-3">
        <View className="min-w-48 flex-1">
          <Input label="Search" placeholder={searchPlaceholder} value={value.search}
            onChangeText={(search) => update({ search })} autoCapitalize="none"
            autoCorrect={false} returnKeyType="search" />
        </View>
        {value.search ? <Button label="Clear search" variant="ghost" onPress={() => update({ search: '' })} /> : null}
        {filters.length > 0 ? <Button label={`Filters${activeCount ? ` (${activeCount})` : ''}`} variant="secondary"
          accessibilityState={{ expanded: panel === 'filters' }}
          onPress={() => setPanel(panel === 'filters' ? null : 'filters')} /> : null}
        <Button label={`Sort: ${sortLabel}`} variant="secondary"
          accessibilityState={{ expanded: panel === 'sort' }}
          onPress={() => setPanel(panel === 'sort' ? null : 'sort')} />
        <Button label={value.sortDirection === 'asc' ? '↑ Ascending' : '↓ Descending'} variant="secondary"
          accessibilityLabel={`Sort direction: ${value.sortDirection === 'asc' ? 'ascending' : 'descending'}. Reverse sort`}
          onPress={() => update({ sortDirection: value.sortDirection === 'asc' ? 'desc' : 'asc' })} />
      </View>
      {panel === 'filters' ? (
        <View className="gap-4 border-t border-control-border p-3">
          {filters.map((filter) => (
            <View key={filter.key} className="gap-2">
              <Text variant="label">{filter.label}</Text>
              <View className="flex-row flex-wrap gap-2">
                <Button label="Any" accessibilityLabel={`${filter.label}: Any`} variant="secondary"
                  accessibilityState={{ selected: !value.filters[filter.key] }}
                  onPress={() => { const next = { ...value.filters }; delete next[filter.key]; update({ filters: next }); }} />
                {filter.options.map((option) => (
                  <Button key={option.value} label={option.label} accessibilityLabel={`${filter.label}: ${option.label}`}
                    variant={value.filters[filter.key] === option.value ? 'primary' : 'secondary'}
                    accessibilityState={{ selected: value.filters[filter.key] === option.value }}
                    onPress={() => update({ filters: { ...value.filters, [filter.key]: option.value } })} />
                ))}
              </View>
            </View>
          ))}
          {activeCount > 0 ? <Button label="Clear filters" variant="ghost" onPress={() => update({ filters: {} })} /> : null}
        </View>
      ) : null}
      {panel === 'sort' ? (
        <View className="flex-row flex-wrap gap-2 border-t border-control-border p-3">
          {sortOptions.map((option) => (
            <Button key={option.value} label={option.label} accessibilityLabel={`Sort by ${option.label}`}
              variant={value.sortField === option.value ? 'primary' : 'secondary'}
              accessibilityState={{ selected: value.sortField === option.value }}
              onPress={() => { update({ sortField: option.value }); setPanel(null); }} />
          ))}
        </View>
      ) : null}
    </View>
  );
}
