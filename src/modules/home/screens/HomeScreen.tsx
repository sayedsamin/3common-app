import { useState } from 'react';
import { View } from 'react-native';
import { Uniwind, useUniwind } from 'uniwind';
import { Badge, Button, Card, EmptyState, ErrorState, Icon, Input, LoadingState, Screen, Text } from '@/components/ui';

const modes = ['system', 'light', 'dark'] as const;
const modeLabels = { system: 'System', light: 'Light', dark: 'Dark' };

export function HomeScreen() {
  const { theme, hasAdaptiveThemes } = useUniwind();
  const selectedMode = hasAdaptiveThemes ? 'system' : theme;
  const [sampleName, setSampleName] = useState('Community gathering');
  const [actionMessage, setActionMessage] = useState('Sample controls only. Nothing is saved or sent.');
  const showAction = (label: string) => setActionMessage(label + ' preview selected. No changes were saved.');

  return (
    <Screen>
      <View className="gap-2">
        <Text variant="label" className="text-success">Mobile design preview</Text>
        <Text accessibilityRole="header" variant="title">3common</Text>
        <Text variant="muted">A shared foundation for the pages ahead.</Text>
      </View>
      <Card>
        <Text accessibilityRole="header" variant="cardTitle">Appearance</Text>
        <Text variant="muted">Follow your device or preview a theme. This choice resets when the app restarts.</Text>
        <View className="flex-row flex-wrap gap-2">
          {modes.map((mode) => <Button key={mode} label={modeLabels[mode]} accessibilityLabel={modeLabels[mode] + ' theme'} accessibilityState={{ selected: selectedMode === mode }} variant={selectedMode === mode ? 'primary' : 'secondary'} onPress={() => Uniwind.setTheme(mode)} />)}
        </View>
        <Text variant="caption">Current theme: {theme === 'dark' ? 'Dark' : 'Light'}</Text>
      </Card>
      <View className="gap-3">
        <Text accessibilityRole="header" variant="heading">Typography</Text>
        <Text variant="title">Made for community</Text>
        <Text variant="heading">Bring people together</Text>
        <Text variant="cardTitle">Every detail matters</Text>
        <Text>Inter keeps everyday content clear and easy to read.</Text>
        <Text variant="label">A clear, helpful label</Text>
        <Text variant="caption">Supporting details and metadata</Text>
      </View>
      <Card>
        <Text accessibilityRole="header" variant="cardTitle">Actions</Text>
        <Button label="Create event (sample)" onPress={() => showAction('Create event')} />
        <Button label="Save and publish (sample)" variant="positive" onPress={() => showAction('Save and publish')} />
        <Button label="View details (sample)" variant="secondary" onPress={() => showAction('View details')} />
        <Button label="Learn more (sample)" variant="ghost" onPress={() => showAction('Learn more')} />
        <Button label="Delete draft (sample)" variant="destructive" onPress={() => showAction('Delete draft')} />
        <View className="flex-row flex-wrap gap-3">
          <Button label="Disabled" disabled />
          <Button label="Saving" loading />
        </View>
        <Text variant="caption" accessibilityLiveRegion="polite">{actionMessage}</Text>
      </Card>
      <Card>
        <Text accessibilityRole="header" variant="cardTitle">Form fields</Text>
        <Input label="Sample event name" value={sampleName} onChangeText={setSampleName} helperText="Try editing this field. It stays on this screen only." />
        <Input label="Sample email" placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" error="Example error: enter a valid email address." />
        <Input label="Disabled field" value="Read-only sample" disabled />
      </Card>
      <Card>
        <View className="flex-row items-center gap-3">
          <Icon name="calendar-outline" tone="success" />
          <Text variant="cardTitle" className="shrink">A simple content card</Text>
        </View>
        <Text variant="muted">Thin borders, gentle corners, and room for the things that matter.</Text>
        <View className="flex-row flex-wrap gap-2">
          <Badge label="Neutral" />
          <Badge label="Live" variant="success" />
          <Badge label="Draft" variant="warning" />
          <Badge label="Needs attention" variant="danger" />
          <Badge label="Insight" variant="insight" />
        </View>
        <View className="flex-row flex-wrap gap-6">
          <Icon name="pencil-outline" accessibilityLabel="Edit icon" />
          <Icon name="share-variant-outline" accessibilityLabel="Share icon" />
          <Icon name="cog-outline" accessibilityLabel="Settings icon" />
          <Icon name="check-circle-outline" tone="success" accessibilityLabel="Success icon" />
        </View>
      </Card>
      <View className="gap-2">
        <Text accessibilityRole="header" variant="heading">Feedback states</Text>
        <EmptyState title="No items yet" description="This is how an empty collection could look." />
        <LoadingState label="Loading sample content..." />
        <ErrorState message="Example error: content could not be loaded." onRetry={() => showAction('Retry')} />
      </View>
      <Text variant="caption">Temporary component showcase. Product pages will replace this preview.</Text>
    </Screen>
  );
}
