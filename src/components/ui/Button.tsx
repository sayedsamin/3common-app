import { cva, type VariantProps } from 'class-variance-authority';
import { Pressable, type PressableProps } from 'react-native';

import { cn } from '@/lib/cn';

import { Text } from './Text';

const buttonVariants = cva('min-h-12 min-w-12 items-center justify-center rounded-xl px-5 py-3', {
  variants: {
    variant: {
      primary: 'bg-primary dark:bg-primary-dark',
      secondary: 'border border-border dark:border-border-dark bg-surface dark:bg-surface-dark',
    },
  },
  defaultVariants: { variant: 'primary' },
});

type ButtonProps = Omit<PressableProps, 'children'> & VariantProps<typeof buttonVariants> & { label: string };

export function Button({ label, variant = 'primary', className, disabled, accessibilityState, ...props }: ButtonProps) {
  return (
    <Pressable
      {...props}
      accessibilityRole="button"
      accessibilityState={{ ...accessibilityState, disabled: Boolean(disabled) }}
      disabled={disabled}
      className={cn(buttonVariants({ variant }), disabled && 'opacity-50', className)}
    >
      <Text className={cn('font-semibold', variant === 'primary' && 'text-on-primary dark:text-on-primary-dark')}>
        {label}
      </Text>
    </Pressable>
  );
}
