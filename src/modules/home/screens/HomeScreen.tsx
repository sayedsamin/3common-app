import { Screen, Text } from '@/components/ui';

export function HomeScreen() {
  return (
    <Screen className="justify-center">
      <Text accessibilityRole="header" variant="title">3common</Text>
      <Text variant="muted">Your pages will appear here.</Text>
    </Screen>
  );
}
