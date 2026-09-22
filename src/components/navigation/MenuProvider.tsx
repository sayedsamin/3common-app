import { useCallback, useRef, useState, type PropsWithChildren } from 'react';
import { Modal, Pressable, View, useWindowDimensions } from 'react-native';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { SidebarContent } from './SidebarContent';
import { MenuContext } from './MenuContext';
export function MenuProvider({ children }: PropsWithChildren) {
  const isReduced = useReducedMotion();
  const [isOpen, setOpen] = useState(false);
  const focusReturn = useRef<(() => void) | undefined>(undefined);
  const restoreFocus = useCallback(() => focusReturn.current?.(), []);
  const { width } = useWindowDimensions();
  const close = useCallback(() => setOpen(false), []);
  return <MenuContext.Provider value={{ isReduced, restoreFocus, open: (openDrawer, restore) => { focusReturn.current = restore; if (isReduced) setOpen(true); else openDrawer(); } }}>
    {children}
    <Modal visible={isOpen} transparent animationType="none" onRequestClose={close}>
      <View style={{ flex: 1 }}>
        <Pressable accessibilityRole="button" accessibilityLabel="Close drawer" onPress={close} style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)' }} />
        <View style={{ width: Math.min(320, width * 0.85), flex: 1 }}><SidebarContent isOpen={isOpen} close={close} /></View>
      </View>
    </Modal>
  </MenuContext.Provider>;
}
