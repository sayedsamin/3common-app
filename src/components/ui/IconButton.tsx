import { ActivityIndicator, Pressable, type PressableProps } from 'react-native';
import { cn } from '@/lib/cn';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Icon, type IconProps } from './Icon';
export type IconButtonProps = Omit<PressableProps, 'children'> & {
  label: string; icon: IconProps['name']; variant?: 'ghost' | 'secondary'; isActive?: boolean; loading?: boolean;
};
export function IconButton({ label, icon, variant = 'ghost', isActive = false, loading = false, disabled, accessibilityState, className, ...props }: IconButtonProps) {
  const color = useThemeColor('muted');
  return <Pressable {...props} accessibilityRole="button" accessibilityLabel={label} disabled={disabled || loading}
    accessibilityState={{ ...accessibilityState, disabled: Boolean(disabled || loading), busy: loading }}
    className={cn('min-h-12 min-w-12 items-center justify-center rounded-control active:opacity-60 web:focus-visible:outline-2 web:focus-visible:outline-offset-2 web:focus-visible:outline-focus',
      variant === 'secondary' && 'bg-surface-muted', isActive && 'bg-success-soft', (disabled || loading) && 'opacity-45', className)}>
    {loading ? <ActivityIndicator color={color} /> : <Icon name={icon} size={20} tone={isActive ? 'success' : 'muted'} />}
  </Pressable>;
}
