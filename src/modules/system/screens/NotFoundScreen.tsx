import { Link } from 'expo-router';

import { Screen, Text } from '@/components/ui';

export function NotFoundScreen() {
  return (
    <Screen className="justify-center">
      <Text accessibilityRole="header" variant="title">Page not found</Text>
      <Text variant="muted">This page is not available.</Text>
      <Link href="/" className="min-h-12 py-3 text-lg text-primary dark:text-primary-dark">Go home</Link>
    </Screen>
  );
}
