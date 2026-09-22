import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { FlashList } from '@shopify/flash-list';
import { Button, EmptyState, ErrorState, LoadingState, Screen, Text } from '@/components/ui';
import { RecordFields } from '../components/RecordFields';
import { checkoutQueryOptions } from '../queries';
import type { JsonRecord } from '../schemas';
import { orderErrorMessage, recordLabel } from '../utils';

type Section = 'Products' | 'Inventory' | 'Orders' | 'Tickets';
type RecordRow = { key: string; title: string; value: JsonRecord };
function CheckoutRecord({ item }: { item: RecordRow }) {
  const [isExpanded, setIsExpanded] = useState(false);
  return <View className="mb-3 gap-3 rounded-control border border-border p-4">
    <Button label={item.title} accessibilityLabel={`Details: ${item.title}`} variant="secondary" accessibilityState={{ expanded: isExpanded }} onPress={() => setIsExpanded(previous => !previous)} />
    {isExpanded ? <RecordFields value={item.value} /> : null}
  </View>;
}
function renderRecord({ item }: { item: RecordRow }) { return <CheckoutRecord key={item.key} item={item} />; }
export function CheckoutDetailsScreen({ productSetId }: { productSetId: string }) {
  const [section, setSection] = useState<Section>('Products');
  const query = useQuery(checkoutQueryOptions(productSetId));
  const records = useMemo(() => {
    const data = query.data;
    const rows = (values: JsonRecord[] | undefined, kind: Section) => (values ?? []).map((value, index) => ({ key: `${kind}:${index}`, title: recordLabel(value, `${kind} record ${index + 1}`), value }));
    return { Products: rows(data?.products.data, 'Products'), Inventory: Object.entries(data?.products.inventoryByProductId ?? {}).map(([id, value]) => ({ key: id, title: id, value })), Orders: rows(data?.orders, 'Orders'), Tickets: rows(data?.tickets, 'Tickets') };
  }, [query.data]);
  return <Screen scrollable={false} edges={['left', 'right', 'bottom']}>
    <FlashList key={`${productSetId}:${section}`} data={records[section]} renderItem={renderRecord} keyExtractor={item => item.key} refreshing={query.isRefetching} onRefresh={() => { void query.refetch(); }}
      ListHeaderComponent={<View className="gap-3 pb-4">
        <Text variant="heading" accessibilityRole="header">Checkout details</Text>
        <Text variant="muted">Products, inventory, orders, and tickets for this product set.</Text>
        <Text selectable>Product set: {productSetId}</Text>
        <View className="flex-row flex-wrap gap-2">{(['Products', 'Inventory', 'Orders', 'Tickets'] as const).map(name => <Button key={name} label={`${name} (${query.data ? records[name].length : '—'})`} accessibilityLabel={name} accessibilityRole="tab" accessibilityState={{ selected: section === name }} variant={section === name ? 'primary' : 'secondary'} onPress={() => setSection(name)} />)}</View>
        {section === 'Products' ? <Text variant="muted">Product counts show returned groups. Expand a group to inspect its product types and items.</Text> : null}
        {query.fetchStatus === 'paused' ? <Text accessibilityRole="alert">You are offline. {query.data ? 'Showing previously loaded checkout details.' : 'Checkout details will load when you reconnect.'}</Text> : null}
        {query.error ? <ErrorState message={orderErrorMessage(query.error)} onRetry={() => { void query.refetch(); }} /> : null}
        {query.error && query.data ? <Text>Showing previously loaded checkout details.</Text> : null}
        {query.isFetching ? <LoadingState label={query.data ? 'Refreshing checkout details...' : 'Loading checkout details...'} /> : null}
      </View>}
      ListEmptyComponent={query.data ? <EmptyState title={`No ${section.toLowerCase()} found`} description="This section has no records." /> : null}
      ListFooterComponent={<Button label="Refresh checkout details" variant="secondary" disabled={query.isFetching} onPress={() => { void query.refetch(); }} />} />
  </Screen>;
}
