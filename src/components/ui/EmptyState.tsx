import { View } from 'react-native';

import { Text } from './Text';

export function EmptyState({ title = 'Nothing here yet', description }: { title?: string; description?: string }) {
  return (
    <View className="gap-2 py-6">
      <Text accessibilityRole="header" variant="cardTitle">{title}</Text>
      {description ? <Text variant="muted">{description}</Text> : null}
    </View>
  );
}
