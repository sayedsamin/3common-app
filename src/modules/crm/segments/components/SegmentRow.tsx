import { router } from 'expo-router';
import { Pressable, View } from 'react-native';
import { Badge, Icon, Text } from '@/components/ui';
import type { Segment } from '../schemas';

export function SegmentRow({ item, onNavigate }: { item: Segment; onNavigate?: () => void }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={`View segment: ${item.name}`}
    onPress={() => { onNavigate?.(); router.push({ pathname: '/crm/segments/[segmentId]', params: { segmentId: item.id } }); }}
    className="mb-2 flex-row items-start gap-3 rounded-card bg-surface p-3 active:bg-surface-muted web:focus-visible:outline-2 web:focus-visible:outline-offset-2 web:focus-visible:outline-focus">
    <View className="h-12 w-12 items-center justify-center rounded-control bg-surface-muted"><Icon name="account-multiple-outline" tone="muted" size={24} /></View>
    <View className="min-w-0 flex-1 gap-1">
      <View className="flex-row items-start gap-2"><Text variant="cardTitle" numberOfLines={2} className="flex-1">{item.name}</Text><Icon name="chevron-right" tone="muted" size={18} /></View>
      <Text variant="caption">{({ contact: 'Contacts', order: 'Orders', ticket: 'Tickets' })[item.targetType]} · {item.kind === 'active' ? 'Automatic membership' : 'Static membership'}</Text>
      <View className="mt-1 flex-row flex-wrap items-center gap-x-3 gap-y-1">
        <Badge label={item.status === 'active' ? 'Active' : 'Archived'} variant={item.status === 'active' ? 'success' : 'neutral'} />
        {item.memberCount === undefined ? null : <Text variant="caption">{item.memberCount} members</Text>}
      </View>
    </View>
  </Pressable>;
}
