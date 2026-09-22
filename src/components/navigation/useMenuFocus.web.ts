import { useEffect, type RefObject } from 'react';
import type { View } from 'react-native';
export function useMenuFocus(isOpen: boolean, ref: RefObject<View | null>, close: () => void, focusTarget?: RefObject<View | null>) {
  useEffect(() => {
    const node = ref.current;
    if (!(node instanceof HTMLElement)) return;
    node.inert = !isOpen;
    if (!isOpen) return;
    const previous = document.activeElement;
    const hidden = Array.from(document.querySelectorAll<HTMLElement>('[aria-hidden="true"]')).filter(el => !el.contains(node) && !node.contains(el));
    const previousInert = hidden.map(el => el.inert);
    hidden.forEach(el => { el.inert = true; });
    const getTargets = () => Array.from(node.querySelectorAll<HTMLElement>('button:not([disabled]),a[href],[tabindex="0"]')).filter(el => el.getClientRects().length);
    getTargets()[0]?.focus();
    const keydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); close(); }
      if (event.key === 'Tab') {
        const targets = getTargets(); const first = targets[0]; const last = targets[targets.length - 1];
        if (event.shiftKey && (document.activeElement === first || !node.contains(document.activeElement))) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && (document.activeElement === last || !node.contains(document.activeElement))) { event.preventDefault(); first?.focus(); }
      }
    };
    document.addEventListener('keydown', keydown);
    return () => {
      document.removeEventListener('keydown', keydown);
      hidden.forEach((el, index) => { el.inert = previousInert[index]; });
      if (previous instanceof HTMLElement && previous.isConnected) previous.focus();
    };
  }, [isOpen, ref, close]);
}
