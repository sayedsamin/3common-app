import { FlashList } from '@shopify/flash-list';
import { router } from 'expo-router';
import { View } from 'react-native';
import { Button, EmptyState, ListPagination, ListToolbar, Screen, Text } from '@/components/ui';
import { useContactsList } from '../hooks';
import { contactSortSchema, contactStatusSchema, type Contact } from '../schemas';
import { contactLabel } from '../utils';
import { ContactQueryState } from '../components/ContactQueryState';

function ContactRow({ item }: { item: Contact }) {
  return <View className="gap-1 border-b border-border py-3">
    <Button label={item.fullName || item.email} accessibilityLabel={`View contact: ${item.fullName || item.email}`} variant="ghost"
      onPress={() => router.push({ pathname: '/crm/contacts/[contactId]', params: { contactId: item.id } })} />
    <Text selectable>{item.email}</Text><Text variant="muted">{contactLabel(item.status)}</Text>
  </View>;
}
export function ContactsScreen() {
  const { controls, setControls, query, isSearchPending } = useContactsList();
  const data = isSearchPending ? undefined : query.data;
  const isBusy = query.isFetching || isSearchPending;
  return <Screen scrollable={false} edges={['left', 'right', 'bottom']}>
    <FlashList data={data?.data ?? []} renderItem={ContactRow} keyExtractor={item => item.id} keyboardShouldPersistTaps="handled"
      refreshing={query.isRefetching} onRefresh={() => { if (!isSearchPending) void query.refetch(); }}
      ListHeaderComponent={<View className="gap-3">
        <Button label="New contact" leadingIcon="plus" onPress={() => router.push('/crm/contacts/new')} />
        <ListToolbar value={controls} onChange={setControls} primaryOptions={[{ value: 'all', label: 'All contacts' }, ...contactStatusSchema.options.map(value => ({ value, label: contactLabel(value) }))]}
          sortOptions={contactSortSchema.options.map(value => ({ value, label: contactLabel(value) }))} searchPlaceholder="Search contacts" />
        <ContactQueryState query={query} label="contacts" isSearchPending={isSearchPending} />
      </View>}
      ListEmptyComponent={!isBusy && !query.error && query.fetchStatus !== 'paused' ? <EmptyState title="No contacts found" description="Create a contact or adjust your search and filters." /> : null}
      ListFooterComponent={<ListPagination variant="compact" value={controls} onChange={setControls} hasMore={Boolean(data?.hasMore)} isLoading={isBusy}
        refreshLabel="Refresh contacts" onRefresh={() => { if (!isSearchPending) void query.refetch(); }} />} />
  </Screen>;
}
