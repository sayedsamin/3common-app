import { useState } from 'react';
import { View } from 'react-native';
import { Button, Text } from '@/components/ui';

export function EventSelectInput<T extends string>({ label, value, options, onChange, disabled, error, helperText }: {
  label: string; value: T; options: readonly { value: T; label: string }[]; onChange: (value: T) => void;
  disabled?: boolean; error?: string; helperText?: string;
}) {
  const [open, setOpen] = useState(false);
  return <View className="w-full min-w-0 gap-2">
    <Text variant="label">{label}</Text>
    <Button label={options.find(item => item.value === value)?.label ?? value} accessibilityLabel={`${label}: ${options.find(item => item.value === value)?.label ?? value}`}
      variant="secondary" trailingIcon={open ? 'chevron-up' : 'chevron-down'} disabled={disabled} accessibilityState={{ expanded: open }} onPress={() => setOpen(!open)} />
    {open ? <View className="gap-1">{options.map(option => <Button key={option.value} label={option.label} variant={option.value === value ? 'secondary' : 'ghost'}
      disabled={disabled} accessibilityRole="radio" accessibilityLabel={`${label}: ${option.label}`} accessibilityState={{ checked: option.value === value }}
      onPress={() => { onChange(option.value); setOpen(false); }} />)}</View> : null}
    {error || helperText ? <Text variant="caption" accessibilityRole={error ? 'alert' : undefined} className={error ? 'text-danger' : undefined}>{error || helperText}</Text> : null}
  </View>;
}
