import { FlashList } from '@shopify/flash-list';
import { View } from 'react-native';
import { EmptyState, ErrorState, ListPagination, ListToolbar, LoadingState, Screen, Text } from '@/components/ui';
import { EventRow } from '../components/EventRow';
import { useEventsList } from '../hooks';
import { eventStatusSchema, type Event } from '../schemas';
import { eventErrorMessage, statusLabel } from '../utils';

const statusOptions = [{ value: 'all', label: 'All events' }, ...eventStatusSchema.options.map(value => ({ value, label: statusLabel(value) }))];
const sortOptions = [{ value: 'start', label: 'Start date' }, { value: 'end', label: 'End date' }, { value: 'name', label: 'Name' }];
function renderEvent({ item }: { item: Event }) { return <EventRow event={item} />; }

export function MyEventsScreen() {
  const { controls, setControls, query, isSearchPending } = useEventsList();
  const isBusy = query.isFetching || isSearchPending;
  const data = isSearchPending ? undefined : query.data;
  return <Screen scrollable={false} edges={['left', 'right', 'bottom']} className="gap-0">
    <FlashList data={data?.data ?? []} renderItem={renderEvent} keyExtractor={item => item.id}
      refreshing={query.isRefetching} onRefresh={() => { void query.refetch(); }} keyboardShouldPersistTaps="handled"
      ListHeaderComponent={<View className="gap-3 pb-4">
        <ListToolbar value={controls} onChange={setControls} primaryOptions={statusOptions} sortOptions={sortOptions} searchPlaceholder="Search events" />
        {query.fetchStatus === 'paused' ? <Text accessibilityRole="alert">You are offline. {data ? 'Showing saved results; updates will resume when you reconnect.' : 'Events will load when you reconnect.'}</Text> : null}
        {query.error && !isSearchPending ? <ErrorState message={eventErrorMessage(query.error)} onRetry={() => { void query.refetch(); }} /> : null}
        {data && query.error ? <Text variant="muted">Showing previously loaded events.</Text> : null}
        {isBusy ? <LoadingState label={data ? 'Refreshing events...' : 'Loading events...'} /> : null}
      </View>}
      ListEmptyComponent={!isBusy && !query.error && query.fetchStatus !== 'paused'
        ? <EmptyState title="No events found" description={controls.search || controls.primaryFilter !== 'all' ? 'Try another search or status filter.' : 'Your events will appear here when they are available.'} /> : null}
      ListFooterComponent={<ListPagination variant="compact" value={controls} onChange={setControls} hasMore={Boolean(data?.hasMore)} isLoading={isBusy} onRefresh={() => { void query.refetch(); }} />} />
  </Screen>;
}
