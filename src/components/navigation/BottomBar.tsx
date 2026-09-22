import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { Pressable, View } from 'react-native';
import { Icon, Text } from '@/components/ui';
import { cn } from '@/lib/cn';
const items = { index: { label: 'Home', icon: 'home-outline' }, profile: { label: 'Profile', icon: 'account-outline' }, ai: { label: 'AI', icon: 'creation' } } as const;
export function BottomBar({ state, navigation, insets }: BottomTabBarProps) {
  return <View className="border-t border-border bg-surface" style={{ paddingBottom: insets.bottom, paddingLeft: insets.left, paddingRight: insets.right }}>
    <View accessibilityRole="tablist" className="min-h-14 flex-row gap-1 px-2 py-1">
      {state.routes.map((route, index) => {
        if (!(route.name === 'index' || route.name === 'profile' || route.name === 'ai')) return null;
        const item = items[route.name]; const selected = index === state.index;
        return <Pressable key={route.key} accessibilityRole="tab" accessibilityLabel={item.label} accessibilityState={{ selected }} aria-selected={selected}
          onPress={() => { const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true }); if (!selected && !event.defaultPrevented) navigation.navigate(route.name); }}
          onLongPress={() => navigation.emit({ type: 'tabLongPress', target: route.key })}
          className={cn('min-h-12 min-w-12 flex-1 items-center justify-center gap-1 rounded-control px-1 py-1 active:bg-surface-muted web:focus-visible:outline-2 web:focus-visible:outline-focus', selected && 'bg-success-soft')}>
          <Icon name={item.icon} tone={selected ? 'success' : 'muted'} size={22} />
          <Text variant="label" className={cn('text-center text-muted', selected && 'text-success')}>{item.label}</Text>
        </Pressable>;
      })}
    </View>
  </View>;
}
