import { cva, type VariantProps } from 'class-variance-authority';
import { View } from 'react-native';
import { Text } from './Text';
const badgeVariants = cva('self-start rounded-full px-2 py-0.5', {
  variants: { variant: { neutral: 'bg-surface-muted', success: 'bg-success-soft', warning: 'bg-warning-soft', danger: 'bg-danger-soft', insight: 'bg-insight-soft' } },
  defaultVariants: { variant: 'neutral' },
});
const tones = { neutral: 'text-body', success: 'text-success', warning: 'text-warning', danger: 'text-danger', insight: 'text-insight' };
export type BadgeProps = VariantProps<typeof badgeVariants> & { label: string };
export function Badge({ label, variant }: BadgeProps) {
  const selectedVariant = variant ?? 'neutral';
  return <View className={badgeVariants({ variant: selectedVariant })}><Text variant="caption" className={tones[selectedVariant]}>{label}</Text></View>;
}
