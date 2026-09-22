import { router } from 'expo-router';
import { useRef } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon, Text } from '@/components/ui';
import { useMenuFocus } from './useMenuFocus';

const destinations = [
  { title: 'Settings', href: '/settings', icon: 'cog-outline' },
  { title: 'Help', href: '/help', icon: 'help-circle-outline' },
  { title: 'About', href: '/about', icon: 'information-outline' },
] as const;
export function SidebarContent({ isOpen, close }: { isOpen: boolean; close: () => void }) {
  const ref = useRef<View>(null);
  const closeRef = useRef<View>(null);
  useMenuFocus(isOpen, ref, close, closeRef);
  return <View ref={ref} className="flex-1 bg-surface" accessibilityViewIsModal={isOpen} aria-hidden={!isOpen}>
    <SafeAreaView style={{ flex: 1 }}>
      <View className="flex-row items-center justify-between gap-2 border-b border-border px-4 py-2">
        <Text variant="cardTitle" className="shrink">3common</Text>
        <Pressable ref={closeRef} accessibilityRole="button" accessibilityLabel="Close menu" onPress={close} className="min-h-12 min-w-12 items-center justify-center rounded-control active:bg-surface-muted web:focus-visible:outline-2 web:focus-visible:outline-focus"><Icon name="close" size={24} /></Pressable>
      </View>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 8 }}>
        {destinations.map(item => <Pressable key={item.href} accessibilityRole="button" accessibilityLabel={item.title}
          onPress={() => { close(); router.push(item.href); }}
          className="min-h-12 flex-row items-center gap-3 rounded-control px-3 py-3 active:bg-success-soft web:focus-visible:outline-2 web:focus-visible:outline-focus">
          <Icon name={item.icon} /><Text className="shrink">{item.title}</Text>
        </Pressable>)}
      </ScrollView>
    </SafeAreaView>
  </View>;
}
