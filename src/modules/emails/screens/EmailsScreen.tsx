import { FlashList } from '@shopify/flash-list';
import { router } from 'expo-router';
import { View } from 'react-native';
import { Button, EmptyState, ListPagination, ListToolbar, QueryFeedback, Screen, Text } from '@/components/ui';
import { useEmailsList } from '../hooks';
import { emailStatus } from '../utils';
const views = ['all', 'draft', 'scheduled', 'sent', 'past'].map(value => ({ value, label: value.charAt(0).toUpperCase() + value.slice(1) }));
const sortOptions = [{ value: 'updatedAt', label: 'Last updated' }, { value: 'subject', label: 'Subject' }, { value: 'date_sent', label: 'Delivery date' }, { value: 'recipient_count', label: 'Recipients' }];
export function EmailsScreen() {
  const { controls, setControls, query, isSearchPending } = useEmailsList(); const data = isSearchPending ? undefined : query.data;
  return <Screen scrollable={false} edges={['left', 'right', 'bottom']}><FlashList data={data?.data ?? []} keyExtractor={(item, index) => item.id ?? String(index)} refreshing={query.isRefetching} onRefresh={() => { void query.refetch(); }}
    ListHeaderComponent={<View className="gap-3 pb-4"><Button label="Create email" onPress={() => router.push('/marketing/emails/new')} /><ListToolbar value={controls} onChange={setControls} primaryOptions={views} sortOptions={sortOptions} searchPlaceholder="Search email subjects" /><QueryFeedback query={query} label="emails" /></View>}
    renderItem={({ item }) => <View className="mb-3 gap-2 rounded-card bg-surface-muted p-4"><Button label={item.subject || 'Untitled email'} variant="ghost" disabled={!item.id} onPress={() => { if (item.id) router.push({ pathname: '/marketing/emails/[emailId]', params: { emailId: item.id } }); }} /><Text>{emailStatus(item)} · {item.recipient_count ?? 0} recipients</Text>{item.date_sent ? <Text>{new Date(item.date_sent).toLocaleString()}</Text> : null}</View>}
    ListEmptyComponent={!query.isFetching && !isSearchPending && !query.error && query.fetchStatus !== 'paused' ? <EmptyState title="No emails found" description="Create a campaign or adjust your search." /> : null}
    ListFooterComponent={<ListPagination variant="compact" value={controls} onChange={setControls} hasMore={Boolean(data?.hasMore)} isLoading={query.isFetching || isSearchPending} onRefresh={() => { void query.refetch(); }} />} />
  </Screen>;
}
