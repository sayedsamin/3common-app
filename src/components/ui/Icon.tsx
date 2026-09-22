import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import type { ComponentProps } from 'react';
import { useThemeColor, type ColorTone } from '@/hooks/useThemeColor';
export type IconProps = { name: ComponentProps<typeof MaterialCommunityIcons>['name']; size?: number; tone?: ColorTone; accessibilityLabel?: string };
export function Icon({ name, size = 20, tone = 'foreground', accessibilityLabel }: IconProps) {
  const color = useThemeColor(tone);
  return <MaterialCommunityIcons name={name} size={size} color={color} accessible={Boolean(accessibilityLabel)} accessibilityRole="image" accessibilityLabel={accessibilityLabel} accessibilityElementsHidden={!accessibilityLabel} importantForAccessibility={accessibilityLabel ? 'auto' : 'no-hide-descendants'} />;
}
