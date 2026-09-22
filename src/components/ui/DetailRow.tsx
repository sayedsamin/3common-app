import { View } from 'react-native';
import { Text } from './Text';
export function DetailRow({ label, value }: { label: string; value?: string | number | boolean | null }) {
  const display = typeof value === 'boolean' ? value ? 'Yes' : 'No' : value;
  return <View className="w-full min-w-0 gap-1 py-2">
    <Text variant="caption" className="w-full min-w-0 web:[overflow-wrap:anywhere]">{label}</Text>
    <Text selectable className="w-full min-w-0 text-foreground web:[overflow-wrap:anywhere]">{display === undefined || display === null || display === '' ? 'Not provided' : display}</Text>
  </View>;
}
