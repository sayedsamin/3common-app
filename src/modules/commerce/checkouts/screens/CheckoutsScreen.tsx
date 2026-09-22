import { useState } from 'react';
import { View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { EmptyState, ListPagination, ListToolbar, LoadingState, Screen } from '@/components/ui';
import { CheckoutRow } from '../components/CheckoutRow';
import { CheckoutFilters } from '../components/CheckoutFilters';
import { CheckoutQueryState } from '../components/CheckoutQueryState';
import { useCheckoutsList } from '../hooks';
import { checkoutSortSchema, type CheckoutListItem } from '../schemas';
import { checkoutFilterError, checkoutSortLabels } from '../utils';

function renderCheckout({ item }: { item: CheckoutListItem }) { return <CheckoutRow item={item} />; }

export function CheckoutsScreen() {
  const { controls, setControls, query, isSearchPending } = useCheckoutsList();
  const [eventLabels, setEventLabels] = useState<Record<string, string>>({});
  const data = isSearchPending ? undefined : query.data;
  const isBusy = query.isFetching || isSearchPending;
  return <Screen scrollable={false} edges={['left', 'right', 'bottom']} className="gap-0">
    <FlashList data={data?.data ?? []} renderItem={renderCheckout} keyExtractor={item => item.id} keyboardShouldPersistTaps="handled"
      refreshing={query.isRefetching} onRefresh={() => { if (!isSearchPending) void query.refetch(); }}
      ListHeaderComponent={<View className="gap-3 pb-4">
        <ListToolbar value={controls} onChange={setControls} searchPlaceholder="Search checkouts"
          primaryOptions={[{ value: 'all', label: 'All checkouts' }, { value: 'open', label: 'Open' }, { value: 'closed', label: 'Closed' }]}
          sortOptions={checkoutSortSchema.options.map(value => ({ value, label: checkoutSortLabels[value] }))}
          renderExtraFilters={(draft, onChange) => <CheckoutFilters draft={draft} onChange={onChange} eventLabels={eventLabels} onEventLabel={(id, label) => setEventLabels(previous => ({ ...previous, [id]: label }))} />}
          validateFilters={checkoutFilterError}
          extraFilterLabels={{ eventId: eventLabels[controls.filters.eventId ?? ''] || 'Event', timeslotId: 'Timeslot', advanced: 'Advanced conditions' }} />
        {isSearchPending ? <LoadingState label="Searching checkouts..." /> : <CheckoutQueryState query={query} label="checkouts" />}
      </View>}
      ListEmptyComponent={!isBusy && !query.error && query.fetchStatus !== 'paused' ? <EmptyState title="No checkouts found" description="Try another search or adjust your filters." /> : null}
      ListFooterComponent={<ListPagination variant="compact" value={controls} onChange={setControls} hasMore={Boolean(data?.hasMore)} isLoading={isBusy} refreshLabel="Refresh checkouts" onRefresh={() => { if (!isSearchPending) void query.refetch(); }} />} />
  </Screen>;
}
