import { useState } from 'react';
import { View, useWindowDimensions } from 'react-native';
import { AppearanceToggle, Card, Screen, Text } from '@/components/ui';
import { navigationSections, navigationUtilities } from '@/constants/navigation';
import { DestinationCard } from '../components/DestinationCard';

export function HomeScreen() {
  const [contentWidth, setContentWidth] = useState(0);
  const { fontScale } = useWindowDimensions();
  const columnWidth = contentWidth >= 720 && fontScale <= 1.2 ? (contentWidth - 16) / 2 : '100%';
  return <Screen edges={['left', 'right']} className="gap-6 pb-6">
    <View className="gap-2 pt-1">
      <Text variant="title" accessibilityRole="header">Your workspace</Text>
      <Text variant="muted">Choose where you’d like to go.</Text>
    </View>
    <View onLayout={event => setContentWidth(event.nativeEvent.layout.width)} className="flex-row flex-wrap items-stretch gap-4">
      {navigationSections.map(section => <Card key={section.title} padding="none" style={{ width: columnWidth }} className="min-w-0 border border-border p-2">
        <Text accessibilityRole="header" variant="caption" className="px-3 pt-3 pb-1 font-medium uppercase tracking-wider">{section.title}</Text>
        {section.items.map((item, index) => <View key={item.href}>
          {index > 0 ? <View className="mx-3 h-px bg-border" /> : null}
          <DestinationCard destination={item} />
        </View>)}
      </Card>)}
      <Card padding="none" style={{ width: columnWidth }} className="min-w-0 border border-border p-2">
        <Text accessibilityRole="header" variant="caption" className="px-3 pt-3 pb-1 font-medium uppercase tracking-wider">Workspace</Text>
        {navigationUtilities.map(destination => <DestinationCard key={destination.href} destination={destination} />)}
        <View className="mx-3 h-px bg-border" />
        <AppearanceToggle />
      </Card>
    </View>
  </Screen>;
}
