import { View } from 'react-native';

import { Text } from './Text';
import { Icon } from './Icon';

export function EmptyState({ title = 'Nothing here yet', description }: { title?: string; description?: string }) {
  return (
    <View className="items-center gap-2 py-12">
      <View className="mb-2 h-14 w-14 items-center justify-center rounded-card bg-surface"><Icon name="magnify" size={24} tone="muted" /></View>
      <Text accessibilityRole="header" variant="cardTitle">{title}</Text>
      {description ? <Text variant="muted" className="max-w-xs text-center">{description}</Text> : null}
    </View>
  );
}
