import { View } from 'react-native';

import { Button } from './Button';
import { Text } from './Text';

export function ErrorState({ message = 'Something went wrong. Please try again.', onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <View className="gap-4 py-6">
      <Text accessibilityRole="alert">{message}</Text>
      {onRetry ? <Button label="Try again" onPress={onRetry} /> : null}
    </View>
  );
}
