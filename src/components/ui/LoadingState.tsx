import { ActivityIndicator, View } from 'react-native';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Text } from './Text';
export function LoadingState({ label = 'Loading...' }: { label?: string }) {
  const color = useThemeColor('focus');
  return <View accessibilityState={{ busy: true }} className="flex-row items-center justify-center gap-3 py-3"><ActivityIndicator color={color} accessible={false} /><Text accessibilityLiveRegion="polite" variant="caption" className="shrink">{label}</Text></View>;
}
