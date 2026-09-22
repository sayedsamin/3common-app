import { useEffect, type RefObject } from 'react';
import { AccessibilityInfo, findNodeHandle, type View } from 'react-native';
import { useMenu } from './MenuContext';
export function useMenuFocus(isOpen: boolean, ref: RefObject<View | null>, close: () => void, focusTarget?: RefObject<View | null>) {
  const { restoreFocus } = useMenu();
  useEffect(() => {
    if (!isOpen || !ref.current) return;
    const handle = findNodeHandle(focusTarget?.current ?? ref.current);
    if (handle) AccessibilityInfo.setAccessibilityFocus(handle);
    return restoreFocus;
  }, [isOpen, ref, focusTarget, restoreFocus]);
}
