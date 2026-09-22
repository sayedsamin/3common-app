import { cva, type VariantProps } from 'class-variance-authority';
import { useState } from 'react';
import { ActivityIndicator, Pressable, View, type PressableProps } from 'react-native';
import { cn } from '@/lib/cn';
import { useThemeColor, type ColorTone } from '@/hooks/useThemeColor';
import { Text } from './Text';

const buttonVariants = cva('min-h-12 min-w-12 justify-center rounded-control border px-4 py-3', {
  variants: { variant: {
    primary: 'border-transparent bg-primary',
    positive: 'border-transparent bg-accent',
    secondary: 'border-control-border bg-surface',
    ghost: 'border-transparent bg-transparent',
    destructive: 'border-transparent bg-danger',
  } }, defaultVariants: { variant: 'primary' },
});
const labelClasses = { primary: 'text-on-primary', positive: 'text-on-accent', secondary: 'text-foreground', ghost: 'text-foreground', destructive: 'text-on-danger' };
const labelTones = { primary: 'on-primary', positive: 'on-accent', secondary: 'foreground', ghost: 'foreground', destructive: 'on-danger' } satisfies Record<string, ColorTone>;
export type ButtonProps = Omit<PressableProps, 'children'> & VariantProps<typeof buttonVariants> & { label: string; loading?: boolean };
export function Button({ label, variant, loading = false, className, disabled, accessibilityState, onFocus, onBlur, ...props }: ButtonProps) {
  const selectedVariant = variant ?? 'primary';
  const [isFocused, setIsFocused] = useState(false);
  const isDisabled = Boolean(disabled || loading);
  const color = useThemeColor(labelTones[selectedVariant]);
  return (
    <Pressable {...props} accessibilityRole="button"
      accessibilityState={{ ...accessibilityState, disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      onFocus={(event) => { setIsFocused(true); onFocus?.(event); }}
      onBlur={(event) => { setIsFocused(false); onBlur?.(event); }}
      className={cn(buttonVariants({ variant: selectedVariant }), 'active:opacity-80 web:focus-visible:outline-2 web:focus-visible:outline-offset-2 web:focus-visible:outline-focus', isFocused && 'border-focus', isDisabled && 'opacity-50', className)}>
      <View className="flex-row items-center justify-center gap-2">
        {loading ? <ActivityIndicator color={color} accessible={false} /> : null}
        <Text variant="label" className={cn('shrink text-center', labelClasses[selectedVariant])}>{label}</Text>
      </View>
    </Pressable>
  );
}
