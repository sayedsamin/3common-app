import { router, useNavigation } from 'expo-router';
import { useRef } from 'react';
import { AccessibilityInfo, findNodeHandle, Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon, Text } from '@/components/ui';
import { useMenu } from './MenuContext';

export function AppHeader({ title, back = false }: { title: string; back?: boolean }) {
  const navigation = useNavigation();
  const menu = useMenu();
  const trigger = useRef<View>(null);
  const restoreFocus = () => {
    const handle = findNodeHandle(trigger.current);
    if (handle) AccessibilityInfo.setAccessibilityFocus(handle);
  };
  return <View className="border-b border-border bg-surface"><SafeAreaView edges={['top', 'left', 'right']}>
    <View className="min-h-14 flex-row items-center gap-2 px-2">
      <Pressable ref={trigger} accessibilityRole="button" accessibilityLabel={back ? 'Back' : 'Open menu'}
        onPress={() => back ? (router.canGoBack() ? router.back() : router.replace('/')) : menu.open(() => navigation.dispatch({ type: 'OPEN_DRAWER' }), restoreFocus)}
        className="min-h-12 min-w-12 items-center justify-center rounded-control active:bg-surface-muted web:focus-visible:outline-2 web:focus-visible:outline-focus">
        <Icon name={back ? 'arrow-left' : 'menu'} size={24} />
      </Pressable>
      <Text variant="cardTitle" className="flex-1 py-3">{title}</Text>
    </View>
  </SafeAreaView></View>;
}
