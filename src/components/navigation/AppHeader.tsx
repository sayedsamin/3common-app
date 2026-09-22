import { router, useNavigation, type Href } from 'expo-router';
import { useRef } from 'react';
import { AccessibilityInfo, findNodeHandle, Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon, Text } from '@/components/ui';
import { useMenu } from './MenuContext';

export function AppHeader({ title, back = false, backHref = '/' }: { title: string; back?: boolean; backHref?: Href }) {
  const navigation = useNavigation();
  const menu = useMenu();
  const trigger = useRef<View>(null);
  const restoreFocus = () => {
    const handle = findNodeHandle(trigger.current);
    if (handle) AccessibilityInfo.setAccessibilityFocus(handle);
  };
  return <View className="bg-background"><SafeAreaView edges={['top', 'left', 'right']}>
    <View className="min-h-16 w-full max-w-[1120px] flex-row items-center gap-2 self-center px-2 md:px-4">
      <Pressable ref={trigger} accessibilityRole="button" accessibilityLabel={back ? 'Back' : 'Open menu'}
        onPress={() => back ? (router.canGoBack() ? router.back() : router.replace(backHref)) : menu.open(() => navigation.dispatch({ type: 'OPEN_DRAWER' }), restoreFocus)}
        className="min-h-12 min-w-12 items-center justify-center rounded-control active:bg-surface-muted web:focus-visible:outline-2 web:focus-visible:outline-focus">
        <Icon name={back ? 'arrow-left' : 'menu'} size={24} />
      </Pressable>
      <Text accessibilityRole="header" variant="heading" className="flex-1 py-3">{title}</Text>
    </View>
  </SafeAreaView></View>;
}
