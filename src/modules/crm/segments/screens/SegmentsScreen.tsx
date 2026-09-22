import { FlashList } from '@shopify/flash-list';
import { router } from 'expo-router';
import { View } from 'react-native';
import { Button, EmptyState, ListPagination, ListToolbar, LoadingState, Screen } from '@/components/ui';
import { contactLabel } from '../../utils';
import { useSegmentsList } from '../hooks';
import { segmentSortSchema, segmentStatusSchema } from '../schemas';
import { segmentListFilterError } from '../list-filters';
import { SegmentListFilters } from '../components/SegmentListFilters';
import { SegmentQueryState } from '../components/SegmentQueryState';
import { SegmentRow } from '../components/SegmentRow';
import { MemberLookup } from '../components/MemberLookup';

const targetOptions = [{ value: 'contact', label: 'Contacts' }, { value: 'order', label: 'Orders' }, { value: 'ticket', label: 'Tickets' }];
const sortLabels = { name: 'Name', createdAt: 'Created date', updatedAt: 'Updated date', lastRefreshedAt: 'Last refreshed', memberCount: 'Member count', targetType: 'Target type' };

export function SegmentsScreen() {
  const { controls, setControls, query, isSearchPending } = useSegmentsList();
  const data = isSearchPending ? undefined : query.data;
  const isBusy = query.isFetching || isSearchPending;
  return <Screen scrollable={false} edges={['left', 'right', 'bottom']} className="gap-0">
    <FlashList data={data?.data ?? []} renderItem={SegmentRow} keyExtractor={item => item.id} keyboardShouldPersistTaps="handled"
      refreshing={query.isRefetching} onRefresh={() => { if (!isSearchPending) void query.refetch(); }}
      ListHeaderComponent={<View className="gap-3 pb-4">
        <View className="flex-row flex-wrap items-center gap-2">
          <Button label="New segment" leadingIcon="plus" onPress={() => router.push('/crm/segments/new')} />
          <MemberLookup />
        </View>
        <ListToolbar value={controls} onChange={setControls} searchPlaceholder="Search segments"
          primaryOptions={[{ value: 'all', label: 'All segments' }, ...segmentStatusSchema.options.map(value => ({ value, label: contactLabel(value) }))]}
          sortOptions={segmentSortSchema.options.map(value => ({ value, label: sortLabels[value] }))}
          filters={[{ key: 'targetType', label: 'Target type', options: targetOptions }]}
          renderExtraFilters={(draft, onChange) => <SegmentListFilters draft={draft} onChange={onChange} />}
          validateFilters={segmentListFilterError}
          extraFilterLabels={{ folderId: controls.filters.folderId === 'unfiled' ? 'Unfiled' : 'Folder', advanced: 'Advanced conditions' }} />
        {!isSearchPending ? <SegmentQueryState query={query} label="segments" /> : <LoadingState label="Searching segments..." />}
      </View>}
      ListEmptyComponent={!isBusy && !query.error && query.fetchStatus !== 'paused' ? <EmptyState title="No segments found" description="Create a segment or adjust your filters." /> : null}
      ListFooterComponent={<ListPagination variant="compact" value={controls} onChange={setControls} hasMore={Boolean(data?.hasMore)} isLoading={isBusy}
        refreshLabel="Refresh segments" onRefresh={() => { if (!isSearchPending) void query.refetch(); }} />} />
  </Screen>;
}
