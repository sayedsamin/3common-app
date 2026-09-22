import { View, type ViewProps } from 'react-native';
import { cn } from '@/lib/cn';
export function Card({ className, ...props }: ViewProps) {
  return <View {...props} className={cn('gap-4 rounded-card border border-border bg-surface p-4', className)} />;
}
