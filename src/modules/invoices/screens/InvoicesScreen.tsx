import { useState } from 'react';
import { View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { router } from 'expo-router';
import { ContactSelectInput } from '@/modules/crm';
import { Button, EmptyState, ErrorState, Input, LoadingState, OptionSheet, Screen, Text } from '@/components/ui';
import { useInvoicesList } from '../hooks';
import { invoicesInputSchema, invoiceStatusSchema, type Invoice, type InvoicesInput } from '../schemas';
import { invoiceErrorMessage, invoiceMoney } from '../utils';

function InvoiceRow({ item }: { item: Invoice }) {
  return <View className="mb-3 gap-2 rounded-control border border-border p-4">
    <Text variant="heading">{item.number ?? item.id}</Text>
    <Text>{[item.customerFirstName, item.customerLastName].filter(Boolean).join(' ') || item.customerEmail || item.customerId || 'Recipient unavailable'}</Text>
    <Text>Status: {item.status?.replace('_', ' ') ?? 'Unavailable'}</Text>
    <Text>Total: {invoiceMoney(item.total, item.currency)} · Due: {invoiceMoney(item.amountDue, item.currency)}</Text>
    <Button label={`View invoice ${item.number ?? item.id}`} variant="secondary" onPress={() => router.push({ pathname: '/commerce/invoices/[invoiceId]', params: { invoiceId: item.id } })} />
  </View>;
}
function renderInvoice({ item }: { item: Invoice }) { return <InvoiceRow item={item} />; }
export function InvoicesScreen() {
  const { input, setInput, query } = useInvoicesList();
  const [filters, setFilters] = useState({ customerId: '', subscriptionId: '', issuedAfter: '', issuedBefore: '' });
  const [status, setStatus] = useState<InvoicesInput['status']>();
  const [filterError, setFilterError] = useState<string>();
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [customerLabel, setCustomerLabel] = useState('');
  const [appliedCustomerLabel, setAppliedCustomerLabel] = useState('');
  function applyFilters() {
    const result = invoicesInputSchema.safeParse({ page: 0, pageSize: input.pageSize, status, ...Object.fromEntries(Object.entries(filters).map(([key, value]) => [key, value.trim() || undefined])) });
    if (!result.success) { setFilterError(result.error.issues[0]?.message ?? 'Check your filters.'); return; }
    if (result.data.issuedAfter && result.data.issuedBefore && Date.parse(result.data.issuedAfter) > Date.parse(result.data.issuedBefore)) { setFilterError('The start date must be before the end date.'); return; }
    setFilterError(undefined); setInput(result.data); setAppliedCustomerLabel(customerLabel); setIsFiltersOpen(false);
  }
  return <Screen scrollable={false} edges={['left', 'right', 'bottom']}>
    <FlashList data={query.data?.data ?? []} renderItem={renderInvoice} keyExtractor={item => item.id} refreshing={query.isRefetching} onRefresh={() => { void query.refetch(); }} keyboardShouldPersistTaps="handled"
      ListHeaderComponent={<View className="gap-3 pb-4">
        <Button label="New invoice" onPress={() => router.push('/commerce/invoices/new')} />
        <Button label="Invoice filters" variant="secondary" onPress={() => { setStatus(input.status); setCustomerLabel(appliedCustomerLabel); setFilters({ customerId: input.customerId ?? '', subscriptionId: input.subscriptionId ?? '', issuedAfter: input.issuedAfter ?? '', issuedBefore: input.issuedBefore ?? '' }); setIsFiltersOpen(true); }} accessibilityState={{ expanded: isFiltersOpen }} />
        <Text variant="muted">{input.status ? `Status: ${input.status.replace('_', ' ')}` : 'All statuses'}{input.customerId ? ` · Customer: ${appliedCustomerLabel || 'Selected customer'}` : ''}{input.subscriptionId ? ` · Subscription: ${input.subscriptionId}` : ''}{input.issuedAfter ? ` · From: ${input.issuedAfter}` : ''}{input.issuedBefore ? ` · Through: ${input.issuedBefore}` : ''}</Text>
        <OptionSheet title="Invoice filters" visible={isFiltersOpen} onClose={() => setIsFiltersOpen(false)}>
        <View className="gap-3">
        <Text variant="label">Status</Text>
        <View className="flex-row flex-wrap gap-2"><Button label="All" variant={status === undefined ? 'primary' : 'secondary'} onPress={() => setStatus(undefined)} />{invoiceStatusSchema.options.map(value => <Button key={value} label={value.replace('_', ' ')} variant={status === value ? 'primary' : 'secondary'} onPress={() => setStatus(value)} />)}</View>
        <ContactSelectInput value={filters.customerId} selectedLabel={customerLabel} onSelect={contact => { setFilters(previous => ({ ...previous, customerId: contact.id })); setCustomerLabel(contact.fullName || contact.email); }} onClear={() => { setFilters(previous => ({ ...previous, customerId: '' })); setCustomerLabel(''); }} />
        {([{ key: 'subscriptionId', label: 'Subscription ID filter' }, { key: 'issuedAfter', label: 'Issued on or after' }, { key: 'issuedBefore', label: 'Issued on or before' }] as const).map(({ key, label }) => <Input key={key} label={label} value={filters[key]} onChangeText={value => setFilters(previous => ({ ...previous, [key]: value }))} autoCapitalize="none" helperText={key.startsWith('issued') ? 'Optional UTC date-time, e.g. 2026-10-01T00:00:00Z' : undefined} />)}
        {filterError ? <Text accessibilityRole="alert">{filterError}</Text> : null}
        <View className="flex-row flex-wrap gap-3"><Button label="Apply filters" onPress={applyFilters} /><Button label="Reset filters" variant="secondary" onPress={() => { setFilters({ customerId: '', subscriptionId: '', issuedAfter: '', issuedBefore: '' }); setCustomerLabel(''); setAppliedCustomerLabel(''); setStatus(undefined); setFilterError(undefined); setInput({ page: 0, pageSize: 20 }); setIsFiltersOpen(false); }} /></View>
        </View>
        </OptionSheet>
        <Text variant="muted">Newest issue date first.</Text>
        {query.fetchStatus === 'paused' ? <Text accessibilityRole="alert">You are offline. {query.data ? 'Showing previously loaded invoices.' : 'Invoices will load when you reconnect.'}</Text> : null}
        {query.error ? <ErrorState message={invoiceErrorMessage(query.error)} onRetry={() => { void query.refetch(); }} /> : null}
        {query.error && query.data ? <Text>Showing previously loaded invoices.</Text> : null}
        {query.isFetching ? <LoadingState label={query.data ? 'Refreshing invoices...' : 'Loading invoices...'} /> : null}
      </View>}
      ListEmptyComponent={!query.isPending && !query.error ? <EmptyState title="No invoices found" description="Create a draft or adjust your filters." /> : null}
      ListFooterComponent={<View className="gap-3"><Text>Page {input.page + 1}</Text><View className="flex-row gap-3"><Button label="Previous page" variant="secondary" disabled={input.page === 0 || query.isFetching} onPress={() => setInput({ ...input, page: input.page - 1 })} /><Button label="Next page" variant="secondary" disabled={!query.data?.hasMore || query.isFetching} onPress={() => setInput({ ...input, page: input.page + 1 })} /></View></View>} />
  </Screen>;
}
