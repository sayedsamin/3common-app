import { useId, useState, type PropsWithChildren } from 'react';
import { Pressable, View } from 'react-native';
import { Card } from './Card';
import { Icon } from './Icon';
import { Text } from './Text';
export function Section({ title, children, collapsible = false, defaultExpanded = true }: PropsWithChildren<{ title: string; collapsible?: boolean; defaultExpanded?: boolean }>) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const id = useId();
  return <Card padding="none" className="w-full min-w-0">
    {collapsible ? <Pressable accessibilityRole="button" accessibilityLabel={title} accessibilityState={{ expanded: isExpanded }} aria-controls={id}
      onPress={() => setIsExpanded(value => !value)} className="min-h-14 flex-row items-center justify-between gap-3 rounded-card px-4 py-4 web:focus-visible:outline-2 web:focus-visible:outline-focus">
      <Text variant="heading" className="min-w-0 flex-1">{title}</Text><Icon name={isExpanded ? 'chevron-up' : 'chevron-down'} tone="muted" />
    </Pressable> : <Text accessibilityRole="header" variant="heading" className="px-4 pt-4 pb-2">{title}</Text>}
    {!collapsible || isExpanded ? <View nativeID={id} className="w-full min-w-0 gap-2 px-4 pb-4">{children}</View> : null}
  </Card>;
}
