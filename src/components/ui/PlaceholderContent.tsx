import { View } from 'react-native';
import { Icon, type IconProps } from './Icon';
import { Text } from './Text';

export function PlaceholderContent({ title, icon }: { title: string; icon: IconProps['name'] }) {
  return <View className="flex-1 items-center justify-center gap-4 py-12">
    <View className="rounded-card bg-success-soft p-4"><Icon name={icon} tone="success" size={32} /></View>
    <Text accessibilityRole="header" variant="title">{title}</Text>
    <Text variant="muted">Coming soon</Text>
  </View>;
}
