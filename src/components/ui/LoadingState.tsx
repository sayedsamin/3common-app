import { View } from 'react-native';

import { Text } from './Text';

export function LoadingState({ label = 'Loading…' }: { label?: string }) {
  return (
    <View accessibilityState={{ busy: true }} className="py-6">
      <Text accessibilityLiveRegion="polite" variant="muted">{label}</Text>
    </View>
  );
}
