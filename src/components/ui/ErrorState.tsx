import { View } from 'react-native';

import { Button } from './Button';
import { Text } from './Text';
import { Icon } from './Icon';

export function ErrorState({ message = 'Something went wrong. Please try again.', onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <View className="gap-3 rounded-card bg-danger-soft p-4">
      <View className="flex-row items-start gap-3"><Icon name="alert-circle-outline" tone="danger" /><Text accessibilityRole="alert" className="flex-1 text-danger">{message}</Text></View>
      {onRetry ? <Button label="Try again" leadingIcon="refresh" variant="secondary" className="self-start" onPress={onRetry} /> : null}
    </View>
  );
}
