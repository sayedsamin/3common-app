import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FlashList } from '@shopify/flash-list';
import { View } from 'react-native';
import { Button, EmptyState, Input, ListPagination, ListToolbar, QueryFeedback, Screen, Text, type ListState } from '@/components/ui';
import { emailActivityQueryOptions, emailEventsQueryOptions } from '../queries';
import { emailActivityInputSchema } from '../contracts';
import { filtersSchema } from '../schemas';

export function EmailEventsScreen({ emailId }: { emailId: string }) {
  const [event, setEvent] = useState<'open' | 'bounce'>('open'); const [cursors, setCursors] = useState<(string | undefined)[]>([undefined]); const [index, setIndex] = useState(0);
  const query = useQuery(emailEventsQueryOptions(emailId, { event, cursor: cursors[index], pageSize: 50 }));
  return <Screen scrollable={false}><FlashList data={query.data?.data ?? []} keyExtractor={(row, i) => row.event_id ?? `${row.recipient}-${row.timestamp}-${i}`} refreshing={query.isRefetching} onRefresh={() => { void query.refetch(); }}
    ListHeaderComponent={<View className="gap-3"><Text variant="label">Delivery events</Text><View className="flex-row gap-2">{(['open', 'bounce'] as const).map(value => <Button key={value} label={value === 'open' ? 'Opens' : 'Bounces'} variant={value === event ? 'primary' : 'secondary'} onPress={() => { setEvent(value); setCursors([undefined]); setIndex(0); }} />)}</View><QueryFeedback query={query} label="delivery events" /></View>}
    renderItem={({ item }) => <View className="gap-2 py-3"><Text>{item.recipient}</Text><Text>{item.event_type} · {item.timestamp}</Text>{item.reason ? <Text>{item.reason}</Text> : null}{item.error_code ? <Text>Error code: {item.error_code}</Text> : null}</View>}
    ListEmptyComponent={query.data?.data.length === 0 ? <EmptyState title="No delivery events" /> : null}
    ListFooterComponent={<View className="flex-row gap-2"><Button label="Previous events" disabled={!index || query.isFetching} onPress={() => setIndex(index - 1)} /><Button label="Next events" disabled={!query.data?.hasMore || !query.data.nextCursor || query.isFetching} onPress={() => { const next = query.data?.nextCursor; if (next) { setCursors([...cursors.slice(0, index + 1), next]); setIndex(index + 1); } }} /></View>} /></Screen>;
}
const activityKinds = ['all', 'delivered', 'open', 'initial_open', 'click', 'bounce', 'unsubscribe', 'spam_complaint', 'order'].map(value => ({ value, label: value.replace(/_/g, ' ') }));
export function EmailActivityScreen({ emailId }: { emailId: string }) {
  const [controls, setControls] = useState<ListState>({ primaryFilter: 'all', search: '', filters: {}, page: 1, pageSize: 20, sortField: 'timestamp', sortDirection: 'desc' }); const [after, setAfter] = useState(''); const [applied, setApplied] = useState<ReturnType<typeof filtersSchema.parse>>([]); const [error, setError] = useState('');
  const filters = [...applied, ...(controls.primaryFilter === 'all' ? [] : [{ logic: 'and', conditions: [{ field: 'eventType', operator: 'is_equal_to_any_of', value: [controls.primaryFilter] }] }])];
  const input = emailActivityInputSchema.parse({ pageNumber: controls.page - 1, pageSize: controls.pageSize, search: controls.search, sortField: controls.sortField, sortDirection: controls.sortDirection, filters: filters.length ? JSON.stringify(filters) : undefined }); const query = useQuery(emailActivityQueryOptions(emailId, input));
  return <Screen scrollable={false}><FlashList data={query.data?.data ?? []} keyExtractor={row => row.id} refreshing={query.isRefetching} onRefresh={() => { void query.refetch(); }}
    ListHeaderComponent={<View className="gap-3"><Text variant="label">Campaign activity</Text><Text variant="muted">Stored activity feed; refreshing reloads stored records.</Text><ListToolbar value={controls} onChange={setControls} primaryOptions={activityKinds} searchPlaceholder="Search recipients" sortOptions={[{ value: 'timestamp', label: 'Time' }, { value: 'recipient', label: 'Recipient' }, { value: 'eventType', label: 'Activity type' }]} /><Input label="Activity after (UTC)" helperText="Optional: YYYY-MM-DDTHH:mm:ssZ" value={after} onChangeText={setAfter} error={error} /><Button label="Apply date filter" onPress={() => { if (after && (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(after) || !Number.isFinite(Date.parse(after)))) { setError('Enter a valid UTC date and time.'); return; } setApplied(after ? filtersSchema.parse([{ logic: 'and', conditions: [{ field: 'timestamp', operator: 'is_after', value: Date.parse(after) }] }]) : []); setControls(value => ({ ...value, page: 1 })); setError(''); }} /><QueryFeedback query={query} label="activity" /></View>}
    renderItem={({ item }) => <View className="gap-2 py-3"><Text>{item.recipient}</Text><Text>{item.eventType} · {new Date(item.timestamp).toLocaleString()}</Text>{item.reason ? <Text>{item.reason}</Text> : null}{item.url ? <Text>{item.url}</Text> : null}{item.orderId ? <Text>Order: {item.orderId}{item.amount !== undefined ? ` · ${item.amount} minor currency units` : ''}</Text> : null}</View>}
    ListEmptyComponent={query.data?.data.length === 0 ? <EmptyState title="No activity found" /> : null}
    ListFooterComponent={<ListPagination variant="compact" value={controls} onChange={setControls} hasMore={Boolean(query.data?.hasMore)} isLoading={query.isFetching} onRefresh={() => { void query.refetch(); }} />} /></Screen>;
}
