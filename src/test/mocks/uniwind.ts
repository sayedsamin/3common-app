import { useSyncExternalStore } from 'react';

let snapshot = { theme: 'light', hasAdaptiveThemes: true };
const listeners = new Set<() => void>();
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
};
const getSnapshot = () => snapshot;

// Native unit tests do not run Metro's CSS compiler. Browser checks cover real themes.
export const Uniwind = {
  setTheme: jest.fn((theme: 'system' | 'light' | 'dark') => {
    snapshot = { theme: theme === 'system' ? 'light' : theme, hasAdaptiveThemes: theme === 'system' };
    listeners.forEach((listener) => listener());
  }),
};
export function useUniwind() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
export function useCSSVariable() { return '#10242C'; }
