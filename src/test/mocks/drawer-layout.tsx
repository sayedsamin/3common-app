import type { Drawer as NativeDrawer } from 'react-native-drawer-layout';
import type { ComponentProps } from 'react';
import { View } from 'react-native';

// Exercise router state without running native gesture/animation machinery in Jest.
export function Drawer({ open, renderDrawerContent, children }: ComponentProps<typeof NativeDrawer>) {
  return <View>{open ? renderDrawerContent() : children}</View>;
}
