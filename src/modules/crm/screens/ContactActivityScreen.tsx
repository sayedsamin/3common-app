import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FlashList } from '@shopify/flash-list';
import { View } from 'react-native';
import { Button, EmptyState, ListPagination, OptionSheet, Screen, Text, type ListState } from '@/components/ui';
import { activityTypeSchema, type ContactActivity } from '../schemas';
import { contactActivityQueryOptions } from '../queries';
import { contactDate, contactLabel } from '../utils';
import { ContactQueryState } from '../components/ContactQueryState';

function ActivityRow({ item }: { item: ContactActivity }) {
  return <View className="gap-2 border-b border-border py-4"><Text variant="label">{contactLabel(item.type)}</Text><Text>{contactDate(item.createdAt)}</Text></View>;
}
export function ContactActivityScreen({ contactId }: { contactId: string }) {
  const [controls, setControls] = useState<ListState>({ primaryFilter: 'all', search: '', filters: {}, sortField: 'createdAt', sortDirection: 'desc', pageSize: 20, page: 1 });
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filter = activityTypeSchema.safeParse(controls.primaryFilter);
  const query = useQuery(contactActivityQueryOptions(contactId, { pageNumber: controls.page - 1, pageSize: controls.pageSize,
    filter: filter.success ? filter.data : undefined, sort: controls.sortDirection === 'asc' ? 'oldest' : undefined }));
  return <Screen scrollable={false} edges={['left', 'right', 'bottom']}>
    <FlashList data={query.data?.data ?? []} renderItem={ActivityRow} keyExtractor={item => item._id} refreshing={query.isRefetching} onRefresh={() => { void query.refetch(); }}
      ListHeaderComponent={<View className="gap-3">
        <Button label={`Activity type: ${filter.success ? contactLabel(filter.data) : 'All'}`} variant="secondary" onPress={() => setIsFilterOpen(true)} />
        <Button label={controls.sortDirection === 'desc' ? 'Newest first' : 'Oldest first'} variant="secondary" onPress={() => setControls({ ...controls, page: 1, sortDirection: controls.sortDirection === 'desc' ? 'asc' : 'desc' })} />
        <ContactQueryState query={query} label="activity" />
      </View>}
      ListEmptyComponent={!query.isFetching && !query.error && query.fetchStatus !== 'paused' ? <EmptyState title="No activity found" description="Activity for this contact will appear here." /> : null}
      ListFooterComponent={<ListPagination variant="compact" value={controls} onChange={setControls} hasMore={Boolean(query.data?.hasMore)} isLoading={query.isFetching} refreshLabel="Refresh activity" onRefresh={() => { void query.refetch(); }} />} />
    <OptionSheet title="Activity type" visible={isFilterOpen} onClose={() => setIsFilterOpen(false)}>
      <View className="gap-2">{['all', ...activityTypeSchema.options].map(value => <Button key={value} label={value === 'all' ? 'All activity' : contactLabel(value)}
        accessibilityRole="radio" accessibilityState={{ checked: controls.primaryFilter === value }} variant="secondary"
        onPress={() => { setControls({ ...controls, primaryFilter: value, page: 1 }); setIsFilterOpen(false); }} />)}</View>
    </OptionSheet>
  </Screen>;
}
