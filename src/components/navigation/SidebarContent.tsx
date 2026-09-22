import { router, usePathname, type Href } from 'expo-router';
import { useRef } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon, Text } from '@/components/ui';
import { useMenuFocus } from './useMenuFocus';
import { navigationSections } from '@/constants/navigation';
import type { IconProps } from '@/components/ui/Icon';
import { cn } from '@/lib/cn';

const destinations = [
  { title: 'Settings', href: '/settings', icon: 'cog-outline' },
  { title: 'Help', href: '/help', icon: 'help-circle-outline' },
  { title: 'About', href: '/about', icon: 'information-outline' },
] as const;
function MenuItem({ title, href, icon, close }: { title: string; href: Href; icon: IconProps['name']; close: () => void }) {
  const pathname = usePathname();
  const isSelected = pathname === href;
  return <Pressable accessibilityRole="button" accessibilityLabel={title} accessibilityState={{ selected: isSelected }}
    onPress={() => { close(); router.navigate(href); }}
    className={cn('min-h-12 flex-row items-center gap-3 rounded-control px-3 py-3 active:bg-success-soft web:focus-visible:outline-2 web:focus-visible:outline-focus', isSelected && 'bg-success-soft')}>
    <Icon name={icon} /><Text className="shrink">{title}</Text>
  </Pressable>;
}
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
        <MenuItem title="Home" href="/" icon="home-outline" close={close} />
        {navigationSections.map(section => <View key={section.title} className="gap-1">
          <Text accessibilityRole="header" variant="label" className="px-3 pt-5 pb-2 text-muted">{section.title}</Text>
          {section.items.map(item => <MenuItem key={item.href} {...item} close={close} />)}
        </View>)}
        <View className="mt-4 gap-1 border-t border-border pt-4">
          {destinations.map(item => <MenuItem key={item.href} {...item} close={close} />)}
        </View>
      </ScrollView>
    </SafeAreaView>
  </View>;
}
