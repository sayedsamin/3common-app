import { View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Button, EmptyState, ErrorState, LoadingState, Screen, Text } from '@/components/ui';
import { OrderFilters } from '../components/OrderFilters';
import { OrderRow } from '../components/OrderRow';
import { useOrdersList } from '../hooks';
import type { Order } from '../schemas';
import { orderErrorMessage } from '../utils';

function renderOrder({ item }: { item: Order }) { return <OrderRow key={item.id} order={item} />; }
export function OrdersScreen() {
  const { input, setInput, query } = useOrdersList();
  return <Screen scrollable={false} edges={['left', 'right', 'bottom']}>
    <FlashList data={query.data?.data ?? []} keyExtractor={item => item.id} renderItem={renderOrder} refreshing={query.isRefetching} onRefresh={() => { void query.refetch(); }} keyboardShouldPersistTaps="handled"
      ListHeaderComponent={<View className="gap-3 pb-4">
        <OrderFilters input={input} onChange={setInput} />
        <Button label={input.sortDirection === 'desc' ? 'Newest first' : 'Oldest first'} variant="secondary" onPress={() => setInput({ ...input, page: 0, sortDirection: input.sortDirection === 'desc' ? 'asc' : 'desc' })} />
        <Text variant="muted">{input.orderStatus ?? 'All statuses'} · {input.type ?? 'All types'}{input.refunded === undefined ? '' : input.refunded ? ' · Refunded only' : ' · Non-refunded only'}{input.status ? ' · Paid/completed only' : ''}{input.isBoxOffice ? ' · Box-office only' : ''}{input.orderNumber ? ` · Order: ${input.orderNumber}` : ''}</Text>
        {query.fetchStatus === 'paused' ? <Text accessibilityRole="alert">You are offline. {query.data ? 'Showing previously loaded orders.' : 'Orders will load when you reconnect.'}</Text> : null}
        {query.error ? <ErrorState message={orderErrorMessage(query.error)} onRetry={() => { void query.refetch(); }} /> : null}
        {query.error && query.data ? <Text>Showing previously loaded orders.</Text> : null}
        {query.isFetching ? <LoadingState label={query.data ? 'Refreshing orders...' : 'Loading orders...'} /> : null}
      </View>}
      ListEmptyComponent={!query.isPending && !query.error ? <EmptyState title="No orders found" description="Orders will appear here when available. Try adjusting your filters." /> : null}
      ListFooterComponent={<View className="gap-3"><Text>Page {input.page + 1}</Text><View className="flex-row flex-wrap gap-3"><Button label="Previous orders" variant="secondary" disabled={input.page === 0 || query.isFetching} onPress={() => setInput({ ...input, page: input.page - 1 })} /><Button label="Next orders" variant="secondary" disabled={!query.data?.hasMore || query.isFetching} onPress={() => setInput({ ...input, page: input.page + 1 })} /><Button label="Refresh orders" variant="secondary" disabled={query.isFetching} onPress={() => { void query.refetch(); }} /></View></View>} />
  </Screen>;
}
