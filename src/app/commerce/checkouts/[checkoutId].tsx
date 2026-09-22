import { useLocalSearchParams } from 'expo-router';
import { CommerceCheckoutDetailsScreen, InvalidCheckoutScreen, checkoutRouteSchema } from '@/modules/commerce';

export default function CheckoutRoute() {
  const params = checkoutRouteSchema.safeParse(useLocalSearchParams());
  return params.success ? <CommerceCheckoutDetailsScreen checkoutId={params.data.checkoutId} /> : <InvalidCheckoutScreen />;
}
