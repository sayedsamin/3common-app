import { cva, type VariantProps } from 'class-variance-authority';
import { Text as NativeText, type TextProps as NativeTextProps } from 'react-native';
import { cn } from '@/lib/cn';
import { useFontStyle } from '@/providers/TypographyProvider';

const textVariants = cva('text-body', {
  variants: { variant: {
    body: 'text-[15px] leading-[22px]',
    title: 'text-[24px] leading-[30px] text-foreground',
    heading: 'text-[18px] leading-[24px] text-foreground',
    cardTitle: 'text-[16px] leading-[22px] text-foreground',
    muted: 'text-[15px] leading-[22px] text-muted',
    label: 'text-[14px] leading-[20px] text-foreground',
    caption: 'text-[12px] leading-[16px] text-muted',
  } },
  defaultVariants: { variant: 'body' },
});
export type TextProps = NativeTextProps & VariantProps<typeof textVariants>;
export function Text({ variant = 'body', className, style, ...props }: TextProps) {
  const weight = variant === 'title' ? 'bold' : variant === 'heading' || variant === 'cardTitle' ? 'semibold' : variant === 'label' ? 'medium' : 'regular';
  const font = useFontStyle(weight);
  return <NativeText {...props} className={cn(textVariants({ variant }), className)} style={[font, style]} />;
}
