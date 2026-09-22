import { useLocalSearchParams } from 'expo-router';
import { ErrorState, Screen } from '@/components/ui';
import { EditInvoiceScreen, invoiceRouteSchema } from '@/modules/invoices';

export default function EditInvoiceRoute() {
  const result = invoiceRouteSchema.safeParse(useLocalSearchParams());
  return result.success ? <EditInvoiceScreen invoiceId={result.data.invoiceId} /> : <Screen><ErrorState message="Invalid invoice ID." /></Screen>;
}
