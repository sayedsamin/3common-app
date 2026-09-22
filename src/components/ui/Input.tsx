import { useId, useState } from 'react';
import { TextInput, View, type TextInputProps } from 'react-native';
import { cn } from '@/lib/cn';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useFontStyle } from '@/providers/TypographyProvider';
import { Icon, type IconProps } from './Icon';
import { IconButton } from './IconButton';
import { Text } from './Text';

export type InputProps = TextInputProps & {
  label: string; error?: string; helperText?: string; disabled?: boolean; hideLabel?: boolean;
  leadingIcon?: IconProps['name']; onClear?: () => void; clearLabel?: string;
};
export function Input({ label, error, helperText, disabled = false, editable = true, hideLabel = false, leadingIcon, onClear, clearLabel = 'Clear input', className, style,
  accessibilityLabel, accessibilityHint, accessibilityState, onFocus, onBlur, placeholderTextColor, selectionColor, ...props }: InputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const descriptionId = useId();
  const muted = useThemeColor('muted');
  const focus = useThemeColor('focus');
  const font = useFontStyle();
  const isDisabled = disabled || !editable;
  const description = error || helperText;
  return <View className="gap-2">
    {!hideLabel ? <Text variant="label">{label}</Text> : null}
    <View className={cn('min-h-12 flex-row items-center rounded-control border border-transparent bg-surface-muted', isFocused && 'border-focus bg-surface', error && 'border-danger', isDisabled && 'opacity-45')}>
      {leadingIcon ? <View className="pl-3"><Icon name={leadingIcon} tone="muted" size={20} /></View> : null}
      <TextInput {...props} editable={!isDisabled} accessibilityLabel={accessibilityLabel ?? label}
        accessibilityHint={[description, accessibilityHint].filter(Boolean).join('. ') || undefined}
        accessibilityState={{ ...accessibilityState, disabled: isDisabled }} aria-invalid={Boolean(error)} aria-describedby={description ? descriptionId : undefined}
        onFocus={event => { setIsFocused(true); onFocus?.(event); }} onBlur={event => { setIsFocused(false); onBlur?.(event); }}
        placeholderTextColor={placeholderTextColor ?? muted} selectionColor={selectionColor ?? focus}
        className={cn('min-h-12 min-w-0 flex-1 bg-transparent px-3 py-3 text-[16px] leading-[24px] text-body web:outline-none', className)} style={[font, style]} />
      {onClear && props.value ? <IconButton label={clearLabel} icon="close" disabled={isDisabled} onPress={onClear} /> : null}
    </View>
    {description ? <Text nativeID={descriptionId} variant="caption" accessibilityRole={error ? 'alert' : undefined} accessibilityLiveRegion={error ? 'polite' : undefined} className={error ? 'text-danger' : undefined}>{description}</Text> : null}
  </View>;
}
