import { useQuery } from '@tanstack/react-query';
import { Button, ErrorState, LoadingState, Screen, Text } from '@/components/ui';
import { View } from 'react-native';
import { InvoiceForm } from '../components/InvoiceForm';
import { invoiceQueryOptions } from '../queries';
import { invoiceErrorMessage } from '../utils';

export function CreateInvoiceScreen() { return <InvoiceForm />; }
export function EditInvoiceScreen({ invoiceId }: { invoiceId: string }) {
  const query = useQuery({ ...invoiceQueryOptions(invoiceId), refetchOnMount: 'always' });
  if (query.data && (query.isFetchedAfterMount || !query.isFetching)) {
    if (query.data.status !== 'draft') return <Screen><Text accessibilityRole="alert">Only draft invoices can be edited. Refresh the invoice details to see its current status.</Text></Screen>;
    return <View className="flex-1"><InvoiceForm key={invoiceId} invoice={query.data} canSave={!query.error && !query.isFetching && query.fetchStatus !== 'paused'} notice={query.error ? 'The latest invoice could not be loaded. Refresh before saving.' : query.fetchStatus === 'paused' ? 'You are offline. Connect before saving.' : undefined} />{query.error ? <Button label="Retry loading invoice" variant="secondary" onPress={() => { void query.refetch(); }} /> : null}</View>;
  }
  return <Screen>{query.fetchStatus === 'paused' ? <Text accessibilityRole="alert">You are offline. Connect to load this invoice.</Text> : query.error ? <ErrorState message={invoiceErrorMessage(query.error)} onRetry={() => { void query.refetch(); }} /> : <LoadingState label="Loading draft..." />}</Screen>;
}
