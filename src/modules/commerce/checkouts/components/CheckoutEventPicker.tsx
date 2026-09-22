import { useState } from 'react';
import { View } from 'react-native';
import { Button, Input, Text } from '@/components/ui';
import { useCheckoutEventSearch } from '../hooks';
import { CheckoutQueryState } from './CheckoutQueryState';

export function CheckoutEventPicker({ value, label, onSelect }: { value: string; label?: string; onSelect: (id: string, label: string) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const { query, search, setSearch, page, setPage, isSearchPending } = useCheckoutEventSearch(isOpen);
  const isBusy = query.isFetching || isSearchPending;
  return <View className="gap-2">
    <Text variant="label">Event</Text>
    <Button label={value ? label || value : 'All events'} accessibilityLabel="Choose event" variant="secondary" trailingIcon={isOpen ? 'chevron-up' : 'chevron-down'} accessibilityState={{ expanded: isOpen }} onPress={() => setIsOpen(previous => !previous)} />
    {isOpen ? <View className="gap-3 rounded-control border border-border p-3">
      <Input label="Search events" value={search} onChangeText={setSearch} autoCapitalize="none" autoCorrect={false} />
      {!isSearchPending ? <CheckoutQueryState query={query} label="events" /> : <Text>Searching events...</Text>}
      {!isSearchPending ? query.data?.data.map(event => <Button key={event.id} label={event.name || event.id} variant="ghost" accessibilityRole="radio" accessibilityLabel={`Select event ${event.name || event.id}`} accessibilityState={{ checked: value === event.id }}
        disabled={isBusy || Boolean(query.error) || query.fetchStatus === 'paused'} onPress={() => { onSelect(event.id, event.name || event.id); setIsOpen(false); }} />) : null}
      {!isBusy && !query.error && query.data?.data.length === 0 ? <Text>No events found.</Text> : null}
      <View className="flex-row flex-wrap gap-2">
        <Button label="Previous events" variant="secondary" disabled={page === 0 || isBusy} onPress={() => setPage(page - 1)} />
        <Button label="Next events" variant="secondary" disabled={!query.data?.hasMore || isBusy} onPress={() => setPage(page + 1)} />
      </View>
    </View> : null}
    {value ? <Button label="Clear event" variant="ghost" onPress={() => { onSelect('', ''); setIsOpen(false); }} /> : null}
  </View>;
}
