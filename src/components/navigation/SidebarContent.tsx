import { router, usePathname, type Href } from 'expo-router';
import { useRef } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppearanceToggle, Icon, Text } from '@/components/ui';
import { useMenuFocus } from './useMenuFocus';
import { navigationSections, navigationUtilities } from '@/constants/navigation';
import type { IconProps } from '@/components/ui/Icon';
import { cn } from '@/lib/cn';

function MenuItem({ title, href, icon, close }: { title: string; href: Href; icon: IconProps['name']; close: () => void }) {
  const pathname = usePathname();
  const isSelected = pathname === href;
  return <Pressable accessibilityRole="button" accessibilityLabel={title} accessibilityState={{ selected: isSelected }}
    onPress={() => { close(); router.navigate(href); }}
    className={cn('min-h-12 flex-row items-center gap-3 rounded-control px-3 py-2 active:bg-surface-muted web:focus-visible:outline-2 web:focus-visible:outline-focus', isSelected && 'bg-success-soft')}>
    <Icon name={icon} size={19} tone={isSelected ? 'success' : 'muted'} /><Text variant="label" className={cn('shrink', isSelected && 'text-success')}>{title}</Text>
  </Pressable>;
}
export function SidebarContent({ isOpen, close }: { isOpen: boolean; close: () => void }) {
  const ref = useRef<View>(null);
  const closeRef = useRef<View>(null);
  useMenuFocus(isOpen, ref, close, closeRef);
  return <View ref={ref} testID="navigation-menu" className="flex-1 bg-surface" accessibilityViewIsModal={isOpen} aria-hidden={!isOpen}>
    <SafeAreaView style={{ flex: 1 }}>
      <View className="flex-row items-center justify-between gap-2 px-5 pt-4 pb-2">
        <Text variant="heading" className="shrink">3common<Text className="text-success">.</Text></Text>
        <Pressable ref={closeRef} accessibilityRole="button" accessibilityLabel="Close menu" onPress={close} className="min-h-12 min-w-12 items-center justify-center rounded-control active:bg-surface-muted web:focus-visible:outline-2 web:focus-visible:outline-focus"><Icon name="close" size={24} /></Pressable>
      </View>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 12, gap: 4 }}>
        {navigationSections.map(section => <View key={section.title} className="gap-1">
          <Text accessibilityRole="header" variant="caption" className="px-3 pt-5 pb-1 uppercase tracking-wider">{section.title}</Text>
          {section.items.map(item => <MenuItem key={item.href} {...item} close={close} />)}
        </View>)}
        <View className="mt-4 gap-1 border-t border-border pt-4">
          {navigationUtilities.map(item => <MenuItem key={item.href} {...item} close={close} />)}
        </View>
      </ScrollView>
      <View className="border-t border-border p-4">
        <AppearanceToggle />
      </View>
    </SafeAreaView>
  </View>;
}
