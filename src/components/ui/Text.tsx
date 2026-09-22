import { cva, type VariantProps } from 'class-variance-authority';
import { Text as NativeText, type TextProps as NativeTextProps } from 'react-native';

import { cn } from '@/lib/cn';

const textVariants = cva('text-foreground dark:text-foreground-dark', {
  variants: {
    variant: {
      body: 'text-base leading-6',
      title: 'text-3xl font-bold',
      muted: 'text-base leading-6 text-muted dark:text-muted-dark',
    },
  },
  defaultVariants: { variant: 'body' },
});

type TextProps = NativeTextProps & VariantProps<typeof textVariants>;

export function Text({ variant, className, ...props }: TextProps) {
  return <NativeText className={cn(textVariants({ variant }), className)} {...props} />;
}
