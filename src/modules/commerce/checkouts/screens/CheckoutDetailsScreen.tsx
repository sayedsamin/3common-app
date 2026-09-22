import { useQuery } from '@tanstack/react-query';
import { FlashList } from '@shopify/flash-list';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Button, EmptyState, ErrorState, Screen, Text } from '@/components/ui';
import { checkoutQueryOptions } from '../queries';
import { CheckoutOverview } from '../components/CheckoutOverview';
import { CheckoutProductRow } from '../components/CheckoutProductRow';
import { CheckoutQueryState } from '../components/CheckoutQueryState';
import type { CheckoutProduct } from '../schemas';

function ProductRow({ item, index }: { item: CheckoutProduct; index: number }) { return <CheckoutProductRow key={`${item.productId}:${index}`} product={item} index={index} />; }
export function CommerceCheckoutDetailsScreen({ checkoutId }: { checkoutId: string }) {
  const query = useQuery(checkoutQueryOptions(checkoutId));
  return <Screen scrollable={false} edges={['left', 'right', 'bottom']}>
    <FlashList data={query.data?.products ?? []} renderItem={ProductRow} keyExtractor={(item, index) => `${item.productId}:${index}`}
      refreshing={query.isRefetching} onRefresh={() => { void query.refetch(); }}
      ListHeaderComponent={<View className="gap-4 pb-4">
        <CheckoutQueryState query={query} label="checkout details" />
        {query.data ? <><CheckoutOverview checkout={query.data} /><Text variant="heading" accessibilityRole="header">Products ({query.data.products.length})</Text></> : null}
      </View>}
      ListEmptyComponent={query.data ? <EmptyState title="No products configured" description="This checkout has no product entries." /> : null}
      ListFooterComponent={<View className="gap-2 py-3"><Button label="Refresh checkout" variant="secondary" loading={query.isFetching} onPress={() => void query.refetch()} />
        <Button label="Back to Checkouts" variant="ghost" onPress={() => router.replace('/commerce/checkouts')} /></View>} />
  </Screen>;
}
export function InvalidCheckoutScreen() { return <Screen><ErrorState message="This checkout link is invalid." /><Button label="Back to Checkouts" onPress={() => router.replace('/commerce/checkouts')} /></Screen>; }
