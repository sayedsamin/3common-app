import { TextInput, View, type TextInputProps } from 'react-native';

import { cn } from '@/lib/cn';

import { Text } from './Text';

type InputProps = TextInputProps & { label: string; error?: string };

export function Input({ label, error, className, accessibilityLabel, accessibilityHint, ...props }: InputProps) {
  return (
    <View className="gap-2">
      <Text>{label}</Text>
      <TextInput
        {...props}
        accessibilityLabel={accessibilityLabel ?? label}
        accessibilityHint={error ?? accessibilityHint}
        className={cn('min-h-12 rounded-xl border border-border bg-surface px-4 py-3 text-base text-foreground dark:border-border-dark dark:bg-surface-dark dark:text-foreground-dark', className)}
      />
      {error ? <Text accessibilityRole="alert" className="text-danger dark:text-danger-dark">{error}</Text> : null}
    </View>
  );
}
