import { useLocalSearchParams } from 'expo-router';
import { ErrorState, Screen } from '@/components/ui';
import { InvoiceDetailsScreen, invoiceRouteSchema } from '@/modules/invoices';

export default function InvoiceRoute() {
  const result = invoiceRouteSchema.safeParse(useLocalSearchParams());
  return result.success ? <InvoiceDetailsScreen invoiceId={result.data.invoiceId} /> : <Screen><ErrorState message="Invalid invoice ID." /></Screen>;
}
