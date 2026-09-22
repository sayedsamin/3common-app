import { useLocalSearchParams } from 'expo-router';
import { ErrorState, Screen } from '@/components/ui';
import { CheckoutDetailsScreen, checkoutRouteSchema } from '@/modules/orders';

export default function CheckoutRoute() {
  const parsed = checkoutRouteSchema.safeParse(useLocalSearchParams());
  return parsed.success ? <CheckoutDetailsScreen productSetId={parsed.data.productSetId} /> : <Screen><ErrorState message="Invalid checkout reference." /></Screen>;
}
