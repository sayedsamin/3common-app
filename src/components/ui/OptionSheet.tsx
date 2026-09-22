import { useRef, type PropsWithChildren } from 'react';
import { AccessibilityInfo, findNodeHandle, Modal, Platform, Pressable, ScrollView, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { cn } from '@/lib/cn';
import { IconButton } from './IconButton';
import { Text } from './Text';
export type OptionSheetProps = PropsWithChildren<{ title: string; visible: boolean; onClose: () => void; footer?: React.ReactNode }>;
export function OptionSheet({ title, visible, onClose, children, footer }: OptionSheetProps) {
  const { width } = useWindowDimensions();
  const isReduced = useReducedMotion();
  const heading = useRef<View>(null);
  return <Modal visible={visible} transparent animationType={isReduced ? 'none' : 'fade'} onRequestClose={onClose}
    onShow={() => { if (Platform.OS !== 'web') { const node = findNodeHandle(heading.current); if (node) AccessibilityInfo.setAccessibilityFocus(node); } }}>
    <View className={cn('flex-1 justify-end', width >= 768 && 'items-center justify-center p-6')}>
      <Pressable accessibilityLabel="Dismiss options" accessibilityRole="button" onPress={onClose} className="absolute inset-0 bg-overlay" />
      <View accessibilityViewIsModal accessibilityLabel={title} className={cn('max-h-[85%] w-full overflow-hidden rounded-t-[24px] bg-surface', width >= 768 && 'max-w-lg rounded-[20px]')}>
        <SafeAreaView edges={['bottom', 'left', 'right']}>
          <View ref={heading} className="flex-row items-center justify-between gap-3 px-5 pt-4 pb-2">
            <Text accessibilityRole="header" variant="heading">{title}</Text><IconButton label="Close options" icon="close" onPress={onClose} />
          </View>
        </SafeAreaView>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 16 }}>{children}</ScrollView>
        {footer ? <SafeAreaView edges={['bottom']}><View className="border-t border-border px-5 pt-3 pb-4">{footer}</View></SafeAreaView> : null}
      </View>
    </View>
  </Modal>;
}
