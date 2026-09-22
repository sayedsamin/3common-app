import { Pressable, View } from 'react-native';
import { Uniwind, useUniwind } from 'uniwind';
import { cn } from '@/lib/cn';
import { Icon } from './Icon';
import { Text } from './Text';

export function AppearanceToggle() {
  const { theme } = useUniwind();
  const isDark = theme === 'dark';
  return <Pressable accessibilityRole="switch" accessibilityLabel="Dark mode" accessibilityState={{ checked: isDark }} aria-checked={isDark}
    accessibilityHint="Switch between light and dark appearance." onPress={() => Uniwind.setTheme(isDark ? 'light' : 'dark')}
    className="min-h-12 flex-row items-center gap-3 rounded-control px-3 py-3 active:bg-surface-muted web:hover:bg-surface-muted web:focus-visible:outline-2 web:focus-visible:outline-focus">
    <Icon name={isDark ? 'weather-night' : 'white-balance-sunny'} tone="muted" />
    <Text variant="label" className="min-w-0 flex-1">{isDark ? 'Dark mode' : 'Light mode'}</Text>
    <View className={cn('h-6 w-10 shrink-0 justify-center rounded-full px-1', isDark ? 'items-end bg-accent' : 'items-start bg-border')}><View className="h-4 w-4 rounded-full bg-surface" /></View>
  </Pressable>;
}
