import { useState } from 'react';
import { router } from 'expo-router';
import { Pressable, View } from 'react-native';
import { Button, Icon, Text } from '@/components/ui';
import { useChatResults } from '../hooks';
import { describeQuery } from '../utils';

export function ResultCards({ resultId }: { resultId: string }) {
  const { result, error, isLoading, loadMore } = useChatResults(resultId);
  const [offset, setOffset] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [isExpanded, setExpanded] = useState(false);
  if (!result) return null;
  const count = Math.min(20, result.cards.length - offset);
  const label = result.query.tool === 'contact_activity' ? 'Contact activity' : result.query.tool.includes('event') ? 'Events' : 'Contacts';
  return <View className="gap-2 rounded-xl border border-border bg-surface p-3">
    <View className="flex-row items-center justify-between gap-2"><View className="min-w-0 flex-1"><Text variant="label">{label}</Text><Text variant="caption">{result.cards.length} loaded{result.hasMore ? ' · More available' : ''}</Text></View>
      <Button label={showFilters ? 'Hide filters' : 'Filters'} variant="ghost" size="compact" accessibilityState={{ expanded: showFilters }} onPress={() => setShowFilters(v => !v)} />
    </View>
    {showFilters ? <View className="rounded-control bg-surface-muted p-3"><Text variant="caption" selectable>{describeQuery(result.query)}</Text><Text variant="caption">Results reflect the query time.</Text></View> : null}
    {!result.cards.length ? <Text>No matching records. Try changing your filters.</Text> : null}
    {result.cards.slice(offset, offset + (isExpanded ? 20 : 3)).map(card => <Pressable key={card.id} accessibilityRole="button" accessibilityLabel={`${card.kind === 'event' ? 'View event' : 'View contact'}: ${card.title}`} className="min-h-12 flex-row items-center gap-3 rounded-control bg-surface-muted p-3 active:opacity-70" onPress={() => {
        if (card.kind === 'event') router.push({ pathname: '/events/[eventId]', params: { eventId: card.id } });
        else router.push({ pathname: '/crm/contacts/[contactId]', params: { contactId: card.contactId ?? card.id } });
      }}>
      <View className="min-w-0 flex-1 gap-1"><Text variant="label">{card.title}</Text><Text variant="caption">{card.subtitle}</Text>
        {card.status ? <Text variant="caption" className="text-primary">{card.status}</Text> : null}
      </View><Icon name="chevron-right" size={18} tone="muted" />
    </Pressable>)}
    {count > 3 ? <Button variant="ghost" label={isExpanded ? 'Show fewer' : `Show all ${count} results on this page`} accessibilityState={{ expanded: isExpanded }} onPress={() => setExpanded(v => !v)} /> : null}
    {error ? <Text accessibilityRole="alert">{error}</Text> : null}
    {offset > 0 ? <Button variant="secondary" label="Previous results" onPress={() => setOffset(v => Math.max(0, v - 20))} /> : null}
    {offset + 20 < result.cards.length ? <Button variant="secondary" label="Next loaded results" onPress={() => setOffset(v => v + 20)} /> : result.hasMore ? <Button variant="secondary" label="Load more" loading={isLoading} onPress={() => { void loadMore().then(loaded => { if (loaded && result.cards.length >= offset + 20) setOffset(v => v + 20); }); }} /> : null}
  </View>;
}
