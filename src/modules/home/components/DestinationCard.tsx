import { Link } from 'expo-router';
import { Pressable, View } from 'react-native';
import { Icon, Text } from '@/components/ui';
import type { NavigationDestination } from '@/constants/navigation';

export function DestinationCard({ destination }: { destination: NavigationDestination }) {
  return <Link href={destination.href} asChild>
    <Pressable accessibilityRole="link" accessibilityLabel={destination.title} accessibilityHint={destination.description}
      className="min-h-20 flex-row items-center gap-3 rounded-control px-3 py-4 active:bg-success-soft web:hover:bg-surface-muted web:focus-visible:outline-2 web:focus-visible:outline-offset-2 web:focus-visible:outline-focus">
      <View className="h-12 w-12 shrink-0 items-center justify-center rounded-control bg-success-soft"><Icon name={destination.icon} tone="success" size={23} /></View>
      <View className="min-w-0 flex-1 gap-1">
        <Text variant="cardTitle">{destination.title}</Text>
        <Text variant="caption" className="text-[13px] leading-[19px]">{destination.description}</Text>
      </View>
      <Icon name="chevron-right" tone="muted" size={19} />
    </Pressable>
  </Link>;
}
