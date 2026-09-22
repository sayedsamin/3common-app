import { cva, type VariantProps } from 'class-variance-authority';
import { View, type ViewProps } from 'react-native';
import { cn } from '@/lib/cn';
const variants = cva('rounded-card', { variants: {
  variant: { surface: 'bg-surface', muted: 'bg-surface-muted', outline: 'border border-border bg-surface' },
  padding: { none: '', default: 'gap-4 p-4' },
}, defaultVariants: { variant: 'surface', padding: 'default' } });
export function Card({ className, variant, padding, ...props }: ViewProps & VariantProps<typeof variants>) {
  return <View {...props} className={cn(variants({ variant, padding }), className)} />;
}
