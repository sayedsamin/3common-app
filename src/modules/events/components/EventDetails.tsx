import { Image } from 'expo-image';
import { useState } from 'react';
import { Linking, View, useWindowDimensions } from 'react-native';
import { Badge, Button, Card, DetailRow as Field, Icon, Section, Text } from '@/components/ui';
import type { Event } from '../schemas';
import { eventDate, eventDetailsLayout, eventMoney, eventText, safeEventUrl, statusLabel } from '../utils';

function EventImage({ source, label }: { source: string; label: string }) {
  const [hasFailed, setHasFailed] = useState(false);
  const uri = safeEventUrl(source);
  return uri && !hasFailed
    ? <Image source={{ uri }} accessibilityLabel={label} style={{ width: '100%', aspectRatio: 16 / 9, maxHeight: 280, borderRadius: 12 }} contentFit="contain" onError={() => setHasFailed(true)} />
    : <Text variant="muted">{label}: image unavailable.</Text>;
}
function EventLink({ url, label }: { url?: string; label: string }) {
  const [hasFailed, setHasFailed] = useState(false);
  if (!url) return null;
  const href = safeEventUrl(url);
  return <View className="w-full min-w-0 gap-2">
    <Field label={label} value={url} />
    {href ? <Button label={`Open ${label.toLowerCase()}`} variant="secondary" onPress={() => { setHasFailed(false); void Linking.openURL(href).catch(() => setHasFailed(true)); }} /> : <Text variant="muted">This link cannot be opened.</Text>}
    {hasFailed ? <Text accessibilityRole="alert" className="text-danger">Unable to open this link. You can copy the address above.</Text> : null}
  </View>;
}

// The spec leaves contentBlocks open-ended. Render their structure without
// assuming undocumented FAQ field names or executing embedded HTML.
function StructuredValue({ value }: { value: unknown }) {
  if (value === null || value === undefined) return <Text variant="muted">Not provided</Text>;
  if (Array.isArray(value)) return <View className="w-full min-w-0 gap-3">{value.map((item, index) => <View key={index} className="w-full min-w-0 gap-2"><StructuredValue value={item} /></View>)}</View>;
  if (typeof value === 'object') return <View className="w-full min-w-0 gap-3">{Object.entries(value).map(([key, item]) => <View key={key} className="w-full min-w-0 gap-1"><Text variant="label" className="web:[overflow-wrap:anywhere]">{key.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/_/g, ' ')}</Text><StructuredValue value={item} /></View>)}</View>;
  return <Text selectable className="w-full min-w-0 web:[overflow-wrap:anywhere]">{typeof value === 'boolean' ? (value ? 'Yes' : 'No') : eventText(String(value))}</Text>;
}

export function EventDetails({ event }: { event: Event }) {
  const [contentWidth, setContentWidth] = useState(0);
  const { fontScale } = useWindowDimensions();
  const layout = eventDetailsLayout(contentWidth, fontScale);
  const columnStyle = { width: contentWidth ? layout.columnWidth : '100%', flexShrink: 0 } as const;
  const starts = event.multiDayStartTimes ?? [];
  const ends = event.multiDayEndTimes ?? [];
  const slotCount = Math.max(starts.length, ends.length);
  return <View className="w-full min-w-0 gap-5" onLayout={event => setContentWidth(event.nativeEvent.layout.width)}>
    <View className="gap-3 py-2">
      <Text variant="title" accessibilityRole="header" className="web:[overflow-wrap:anywhere]">{event.name || 'Untitled event'}</Text>
      <Badge label={statusLabel(event.status)} variant={event.status === 'open' ? 'success' : event.status === 'cancelled' ? 'danger' : 'neutral'} />
      <View className="flex-row items-center gap-2"><Icon name="calendar-blank-outline" tone="muted" size={18} /><Text variant="muted" className="flex-1">{eventDate(event.start, event.timeZone)}</Text></View>
      <View className="flex-row items-center gap-2"><Icon name={event.isVirtual ? 'video-outline' : 'map-marker-outline'} tone="muted" size={18} /><Text variant="muted" className="flex-1">{event.isVirtual ? 'Virtual event' : event.venueName || event.location?.address || 'Location to be announced'}</Text></View>
    </View>
    {event.image ? <EventImage key={event.image} source={event.image} label="Event cover" /> : null}
    <View className="flex-row flex-wrap gap-3">
      <Card style={{ width: contentWidth ? layout.statWidth : '100%', flexShrink: 0 }} className="min-w-0 gap-1"><Text variant="caption">ITEMS SOLD</Text><Text variant="heading" className="web:[overflow-wrap:anywhere]">{event.itemsSold ?? '—'}</Text></Card>
      <Card style={{ width: contentWidth ? layout.statWidth : '100%', flexShrink: 0 }} className="min-w-0 gap-1"><Text variant="caption">REVENUE</Text><Text variant="heading" className="web:[overflow-wrap:anywhere]">{eventMoney(event.revenueCents, event.currency)}</Text></Card>
    </View>
    <View className="w-full min-w-0 gap-5" style={{ flexDirection: layout.hasColumns ? 'row' : 'column', alignItems: 'flex-start' }}>
    <View className="min-w-0 gap-5" style={columnStyle}>
    <Section title="Overview">
      <Field label="Event type" value={event.type} /><Field label="Public event" value={event.isPublic} />
      <Field label="Virtual event" value={event.isVirtual} /><Field label="Cancelled" value={event.isCancelled} />
      <Field label="Language" value={event.language} />
    </Section>
    <Section title="Description">
      {event.descriptionBlocks?.length ? event.descriptionBlocks.map((block, index) => <View key={`${block.id}-${index}`} className="gap-3">
        {block.type === 'text' ? <Text selectable className="web:[overflow-wrap:anywhere]">{eventText(block.content)}</Text>
          : block.type === 'image' ? <EventImage source={block.content} label={`Description image ${index + 1}`} />
            : <EventLink url={block.content} label="Event video" />}
      </View>) : <Text selectable className="web:[overflow-wrap:anywhere]">{event.description ? eventText(event.description) : 'No description provided.'}</Text>}
    </Section>
    <Section title="Schedule">
      <Field label="Schedule type" value={event.schedule} />
      <Field label="Time zone" value={event.timeZone || 'Not provided; dates displayed in UTC'} />
      <Field label="Starts" value={eventDate(event.start, event.timeZone)} /><Field label="Ends" value={eventDate(event.end, event.timeZone)} />
      {Array.from({ length: slotCount }, (_, index) => <View key={index} className="gap-2 border-t border-border pt-3">
        <Text variant="cardTitle">Session {index + 1}</Text>
        <Field label="Starts" value={eventDate(starts[index], event.timeZone)} /><Field label="Ends" value={eventDate(ends[index], event.timeZone)} />
      </View>)}
    </Section>
    </View>
    <View className="min-w-0 gap-5" style={columnStyle}>
    <Section title="Location">
      <Field label="Venue" value={event.venueName} /><Field label="Address" value={event.location?.address} />
      <Field label="Location information" value={event.locationPlaceholder} />
      <Field label="Latitude" value={event.location?.lat} /><Field label="Longitude" value={event.location?.lng} />
      <EventLink url={event.virtualEventLink} label="Virtual event link" />
    </Section>
    <Section title="Pricing">
      <Field label="Minimum price (before fees)" value={eventMoney(event.minPriceCents, event.currency)} />
      <Field label="Maximum price (before fees)" value={eventMoney(event.maxPriceCents, event.currency)} /><Field label="Currency" value={event.currency} />
    </Section>
    {event.images?.length ? <Section title="Gallery">{event.images.map((source, index) => <EventImage key={`${source}-${index}`} source={source} label={`Gallery image ${index + 1}`} />)}</Section> : null}
    <Section title="Tags">
      <Field label="Tags" value={event.tags?.join(', ')} /><Field label="Custom tags" value={event.customTags?.join(', ')} />
    </Section>
    {event.contentBlocks?.length ? <Section title="Additional content"><StructuredValue value={event.contentBlocks} /></Section> : null}
    <Section title="Checkout" collapsible defaultExpanded={false}>
      <EventLink url={event.redirectUrl} label="Post-checkout redirect" />
      <Field label="Custom terms enabled" value={event.customTerms?.hasCustomTerms} />
      {event.customTerms ? <>
        <Field label="Terms type" value={event.customTerms.type} />
        <EventLink url={event.customTerms.url} label="Custom terms" />
        {event.customTerms.content ? <Field label="Terms" value={eventText(event.customTerms.content)} /> : null}
      </> : null}
    </Section>
    <Section title="Record information" collapsible defaultExpanded={false}>
      <Field label="Event ID" value={event.id} /><Field label="Created" value={eventDate(event.createdAt, event.timeZone)} /><Field label="Last updated" value={eventDate(event.updatedAt, event.timeZone)} />
    </Section>
    </View>
    </View>
  </View>;
}
