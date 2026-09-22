import { useQuery } from '@tanstack/react-query';
import { View } from 'react-native';
import { Button, ErrorState, LoadingState, Screen, Text } from '@/components/ui';
import { InvoiceActions } from '../components/InvoiceActions';
import { invoiceQueryOptions } from '../queries';
import { invoiceErrorMessage, invoiceMoney } from '../utils';

export function InvoiceDetailsScreen({ invoiceId }: { invoiceId: string }) {
  const query = useQuery({ ...invoiceQueryOptions(invoiceId), refetchOnMount: 'always' });
  const invoice = query.data;
  return <Screen edges={['left', 'right', 'bottom']}>
    {query.fetchStatus === 'paused' ? <Text accessibilityRole="alert">You are offline. Connect before changing this invoice.</Text> : null}
    {query.error ? <ErrorState message={invoiceErrorMessage(query.error)} onRetry={() => { void query.refetch(); }} /> : null}
    {query.isFetching ? <LoadingState label={invoice ? 'Refreshing invoice...' : 'Loading invoice...'} /> : null}
    {invoice ? <>
      <Text variant="heading">Invoice {invoice.number ?? invoice.id}</Text>
      <Text>Status: {invoice.status?.replace('_', ' ') ?? 'Unavailable'}</Text>
      <Text variant="heading">Recipient</Text>
      <Text>{[invoice.customerFirstName, invoice.customerLastName].filter(Boolean).join(' ') || 'Name unavailable'}</Text>
      <Text>Customer ID: {invoice.customerId ?? 'Unavailable'}</Text><Text>Email: {invoice.customerEmail || 'Unavailable'}</Text><Text>Phone: {invoice.customerPhone || 'Unavailable'}</Text>
      <Text variant="heading">Line items</Text>
      {invoice.lineItems?.map((line, index) => <View key={index} className="gap-2 rounded-control border border-border p-3"><Text>{line.description}</Text><Text>{line.quantity} × {invoiceMoney(line.unitAmount, invoice.currency)}</Text><Text>Tax: {invoiceMoney(line.taxAmount, invoice.currency)}</Text></View>) ?? <Text>Unavailable</Text>}
      {([{ key: 'subtotal', label: 'Subtotal' }, { key: 'taxTotal', label: 'Tax total' }, { key: 'total', label: 'Total' }, { key: 'amountPaid', label: 'Amount paid' }, { key: 'amountDue', label: 'Amount due' }] as const).map(({ key, label }) => <Text key={key}>{label}: {invoiceMoney(invoice[key], invoice.currency)}</Text>)}
      {([{ key: 'issuedAt', label: 'Issued' }, { key: 'dueAt', label: 'Due' }, { key: 'paidAt', label: 'Paid' }, { key: 'voidedAt', label: 'Voided' }, { key: 'createdAt', label: 'Created' }, { key: 'updatedAt', label: 'Updated' }] as const).map(({ key, label }) => <Text key={key}>{label}: {invoice[key] ? new Date(invoice[key]).toLocaleString() : 'Unavailable'}</Text>)}
      <Text>Notes: {invoice.notes || 'Unavailable'}</Text><Text>Automatic charging: {invoice.autoCharge === undefined ? 'Unavailable' : invoice.autoCharge ? 'Enabled' : 'Disabled'}</Text>
      <Text variant="heading">Tax IDs</Text>{invoice.taxIds?.length ? invoice.taxIds.map((tax, index) => <Text key={index}>{tax.type}: {tax.value}</Text>) : <Text>{invoice.taxIds ? 'No tax IDs' : 'Unavailable'}</Text>}
      <Text variant="heading">Payment history</Text>
      {invoice.payments?.length ? invoice.payments.map(payment => <View key={payment.id} className="gap-2 rounded-control border border-border p-3"><Text>{invoiceMoney(payment.amount, invoice.currency)} · {payment.status}</Text><Text>{new Date(payment.paidAt).toLocaleString()}</Text>{payment.note ? <Text>{payment.note}</Text> : null}{payment.failureCode ? <Text>Failure: {payment.failureCode}</Text> : null}{payment.refunds?.map(refund => <Text key={refund.id}>Refund: {invoiceMoney(refund.amount, invoice.currency)} · {new Date(refund.refundedAt).toLocaleString()}</Text>)}</View>) : <Text>{invoice.payments ? 'No payments recorded' : 'Unavailable'}</Text>}
      <InvoiceActions invoice={invoice} disabled={query.isFetching || query.fetchStatus === 'paused' || Boolean(query.error)} />
      <Button label="Refresh invoice" variant="secondary" disabled={query.isFetching} onPress={() => { void query.refetch(); }} />
    </> : null}
  </Screen>;
}
