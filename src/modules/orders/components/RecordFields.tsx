import { useState } from 'react';
import { View } from 'react-native';
import { Button, Text } from '@/components/ui';
import type { JsonRecord, JsonValue } from '../schemas';
import { fieldLabel } from '../utils';

function ValueField({ label, value }: { label: string; value: JsonValue }) {
  const [isExpanded, setIsExpanded] = useState(false);
  if (value === null || typeof value !== 'object') return <View className="gap-1">
    <Text variant="label">{label}</Text><Text selectable>{value === null ? 'Unavailable' : value === '' ? 'Empty' : typeof value === 'boolean' ? value ? 'Yes' : 'No' : String(value)}</Text>
  </View>;
  const count = Array.isArray(value) ? value.length : Object.keys(value).length;
  return <View className="gap-2">
    <Button label={`${label} (${count})`} variant="secondary" accessibilityState={{ expanded: isExpanded }} onPress={() => setIsExpanded(previous => !previous)} />
    {isExpanded ? <View className="gap-3 border-l border-border pl-3"><RecordFields value={value} /></View> : null}
  </View>;
}
export function RecordFields({ value }: { value: JsonRecord | JsonValue[] }) {
  const [visibleCount, setVisibleCount] = useState(20);
  const entries = Array.isArray(value) ? value.map((item, index) => [String(index), item] as const) : Object.entries(value);
  return <View className="min-w-0 gap-3">
    {entries.length === 0 ? <Text variant="muted">No fields to display.</Text> : null}
    {entries.slice(0, visibleCount).map(([key, item]) => <ValueField key={key} label={Array.isArray(value) ? `Item ${Number(key) + 1}` : fieldLabel(key)} value={item} />)}
    {entries.length > visibleCount ? <Button label={`Show more fields (${entries.length - visibleCount} remaining)`} variant="secondary" onPress={() => setVisibleCount(previous => previous + 20)} /> : null}
  </View>;
}
