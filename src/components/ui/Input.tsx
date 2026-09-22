import { useId, useState } from 'react';
import { TextInput, View, type TextInputProps } from 'react-native';
import { cn } from '@/lib/cn';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useFontStyle } from '@/providers/TypographyProvider';
import { Text } from './Text';

export type InputProps = TextInputProps & { label: string; error?: string; helperText?: string; disabled?: boolean };
export function Input({ label, error, helperText, disabled = false, editable = true, className, style, accessibilityLabel, accessibilityHint, accessibilityState, onFocus, onBlur, placeholderTextColor, selectionColor, ...props }: InputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const descriptionId = useId();
  const muted = useThemeColor('muted');
  const focus = useThemeColor('focus');
  const font = useFontStyle();
  const isDisabled = disabled || !editable;
  const description = error || helperText;
  return (
    <View className="gap-2">
      <Text variant="label">{label}</Text>
      <TextInput {...props} editable={!isDisabled}
        accessibilityLabel={accessibilityLabel ?? label}
        accessibilityHint={[description, accessibilityHint].filter(Boolean).join('. ') || undefined}
        accessibilityState={{ ...accessibilityState, disabled: isDisabled }}
        aria-invalid={Boolean(error)} aria-describedby={description ? descriptionId : undefined}
        onFocus={(event) => { setIsFocused(true); onFocus?.(event); }}
        onBlur={(event) => { setIsFocused(false); onBlur?.(event); }}
        placeholderTextColor={placeholderTextColor ?? muted} selectionColor={selectionColor ?? focus}
        className={cn('min-h-12 rounded-control border border-control-border bg-surface px-4 py-3 text-[16px] leading-[24px] text-body web:focus-visible:outline-2 web:focus-visible:outline-offset-2 web:focus-visible:outline-focus', isFocused && 'border-focus', error && 'border-danger', isDisabled && 'bg-surface-muted opacity-50', className)}
        style={[font, style]} />
      {description ? <Text nativeID={descriptionId} variant="caption" accessibilityRole={error ? 'alert' : undefined} accessibilityLiveRegion={error ? 'polite' : undefined} className={error ? 'text-danger' : undefined}>{description}</Text> : null}
    </View>
  );
}
