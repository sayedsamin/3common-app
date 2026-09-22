import { View } from 'react-native';
import { Icon, type IconProps } from './Icon';
import { Text } from './Text';

export function PlaceholderContent({ title, icon, message = 'Coming soon' }: { title: string; icon: IconProps['name']; message?: string }) {
  return <View className="flex-1 items-center justify-center gap-3 py-16">
    <View className="mb-2 h-16 w-16 items-center justify-center rounded-[20px] bg-surface"><Icon name={icon} tone="muted" size={28} /></View>
    <Text accessibilityRole="header" variant="heading">{message}</Text>
    <Text variant="muted" className="max-w-xs text-center">{title} will be available here.</Text>
  </View>;
}
