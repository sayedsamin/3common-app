import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Badge, Icon, Text } from '@/components/ui';
import type { Event } from '../schemas';
import { eventListDate, eventMoney, safeEventUrl, statusLabel } from '../utils';

export function EventRow({ event }: { event: Event }) {
  const [failedImage, setFailedImage] = useState<string | undefined>();
  const image = safeEventUrl(event.image);
  return <Pressable accessibilityRole="button" accessibilityLabel={`View event: ${event.name || 'Untitled event'}`}
    onPress={() => router.push({ pathname: '/events/[eventId]', params: { eventId: event.id } })}
    className="mb-2 flex-row items-start gap-3 rounded-card bg-surface p-3 active:bg-surface-muted web:focus-visible:outline-2 web:focus-visible:outline-offset-2 web:focus-visible:outline-focus">
    <View className="h-16 w-16 items-center justify-center overflow-hidden rounded-control bg-surface-muted">
      {image && failedImage !== image ? <Image source={{ uri: image }} style={{ width: 64, height: 64 }} contentFit="cover" accessibilityLabel={`${event.name || 'Event'} cover`} onError={() => setFailedImage(image)} />
        : <Icon name="calendar-blank-outline" size={24} tone="muted" />}
    </View>
    <View className="min-w-0 flex-1 gap-1">
      <View className="flex-row items-start gap-2">
        <Text variant="cardTitle" numberOfLines={2} className="flex-1">{event.name || 'Untitled event'}</Text>
        <Icon name="chevron-right" size={18} tone="muted" />
      </View>
      <Text variant="caption" className="text-body">{eventListDate(event.start, event.timeZone)}</Text>
      <Text variant="caption" numberOfLines={1}>{event.isVirtual ? 'Virtual event' : event.venueName || event.location?.address || 'Location to be announced'}</Text>
      <View className="mt-1 flex-row flex-wrap items-center gap-x-3 gap-y-1">
        <Badge label={statusLabel(event.status)} variant={event.status === 'open' ? 'success' : event.status === 'cancelled' ? 'danger' : 'neutral'} />
        <Text variant="caption">{event.itemsSold === undefined ? 'Sales unavailable' : `${event.itemsSold} sold`}</Text>
        {event.revenueCents !== undefined ? <Text variant="caption">{eventMoney(event.revenueCents, event.currency)}</Text> : null}
      </View>
    </View>
  </Pressable>;
}
