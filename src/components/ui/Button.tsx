import { cva, type VariantProps } from 'class-variance-authority';
import { ActivityIndicator, Pressable, View, type PressableProps } from 'react-native';
import { cn } from '@/lib/cn';
import { useThemeColor, type ColorTone } from '@/hooks/useThemeColor';
import { Icon, type IconProps } from './Icon';
import { Text } from './Text';

const buttonVariants = cva('min-h-12 min-w-12 items-center justify-center rounded-control', {
  variants: {
    variant: { primary: 'bg-primary', positive: 'bg-accent', secondary: 'bg-surface-muted', ghost: 'bg-transparent', destructive: 'bg-danger' },
    size: { compact: 'px-3 py-2', default: 'px-4 py-3', large: 'min-h-14 px-6 py-4' },
  },
  defaultVariants: { variant: 'primary', size: 'default' },
});
const tones = { primary: 'on-primary', positive: 'on-accent', secondary: 'foreground', ghost: 'foreground', destructive: 'on-danger' } satisfies Record<string, ColorTone>;
const labels = { primary: 'text-on-primary', positive: 'text-on-accent', secondary: 'text-foreground', ghost: 'text-foreground', destructive: 'text-on-danger' };
export type ButtonProps = Omit<PressableProps, 'children'> & VariantProps<typeof buttonVariants> & {
  label: string; loading?: boolean; leadingIcon?: IconProps['name']; trailingIcon?: IconProps['name'];
};
export function Button({ label, variant, size, loading = false, leadingIcon, trailingIcon, className, disabled, accessibilityLabel, accessibilityRole = 'button', accessibilityState, ...props }: ButtonProps) {
  const selected = variant ?? 'primary';
  const isDisabled = Boolean(disabled || loading);
  const color = useThemeColor(tones[selected]);
  return <Pressable {...props} accessibilityRole={accessibilityRole} accessibilityLabel={accessibilityLabel ?? label} accessibilityState={{ ...accessibilityState, disabled: isDisabled, busy: loading }} disabled={isDisabled}
    className={cn(buttonVariants({ variant: selected, size }), 'active:opacity-70 web:focus-visible:outline-2 web:focus-visible:outline-offset-2 web:focus-visible:outline-focus', isDisabled && 'opacity-45', className)}>
    <View className="flex-row items-center justify-center gap-2">
      {loading ? <ActivityIndicator color={color} accessible={false} /> : leadingIcon ? <Icon name={leadingIcon} tone={tones[selected]} size={18} /> : null}
      <Text variant="label" className={cn('shrink text-center', labels[selected])}>{label}</Text>
      {trailingIcon ? <Icon name={trailingIcon} tone={tones[selected]} size={18} /> : null}
    </View>
  </Pressable>;
}
