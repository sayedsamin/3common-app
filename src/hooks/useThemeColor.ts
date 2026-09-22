import { useCSSVariable } from 'uniwind';

export type ColorTone = 'foreground' | 'body' | 'muted' | 'primary' | 'on-primary' | 'accent' | 'on-accent' | 'danger' | 'on-danger' | 'success' | 'warning' | 'insight' | 'focus';

export function useThemeColor(tone: ColorTone) {
  const color = useCSSVariable(`--color-${tone}`);
  return typeof color === 'string' ? color : undefined;
}
