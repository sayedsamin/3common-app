import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FlashList } from '@shopify/flash-list';
import { View } from 'react-native';
import { eventsQueryOptions } from '@/modules/events';
import { Button, Input, QueryFeedback, Text } from '@/components/ui';
export function EventRecipients({ value, onChange, disabled }: { value: string[]; onChange: (ids: string[]) => void; disabled: boolean }) {
  const [search, setSearch] = useState(''); const [page, setPage] = useState(0); const [open, setOpen] = useState(false);
  const query = useQuery({ ...eventsQueryOptions({ page, pageSize: 20, search, sortField: 'start', sortDirection: 'desc' }), enabled: open });
  return <View className="gap-3"><Text variant="label">Event audiences ({value.length} selected)</Text><Button label={open ? 'Close events' : 'Select events'} disabled={disabled} variant="secondary" onPress={() => setOpen(!open)} />
    {open ? <><Input label="Search events" value={search} onChangeText={text => { setSearch(text); setPage(0); }} disabled={disabled} /><QueryFeedback query={query} label="events" /><View style={{ height: 140 }}><FlashList horizontal data={query.data?.data ?? []} keyExtractor={event => event.id} renderItem={({ item: event }) => <View style={{ width: 240 }} className="pr-3"><Button label={`${value.includes(event.id) ? 'Selected: ' : ''}${event.name}`} accessibilityRole="checkbox" accessibilityState={{ checked: value.includes(event.id) }} variant="secondary" disabled={disabled} onPress={() => onChange(value.includes(event.id) ? value.filter(id => id !== event.id) : [...value, event.id])} /></View>} /></View>
      {value.filter(id => !query.data?.data.some(event => event.id === id)).map(id => <Button key={id} label={`Remove selected event ${id}`} disabled={disabled} variant="secondary" onPress={() => onChange(value.filter(item => item !== id))} />)}
      <View className="flex-row gap-2"><Button label="Previous events" disabled={disabled || !page || query.isFetching} onPress={() => setPage(page - 1)} /><Button label="Next events" disabled={disabled || !query.data?.hasMore || query.isFetching} onPress={() => setPage(page + 1)} /></View></> : null}
  </View>;
}
