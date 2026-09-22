import { useMemo, useState } from 'react';
import { Linking, Platform, ScrollView, Text as NativeText, View } from 'react-native';
import { Text } from '@/components/ui';
import { useFontStyle } from '@/providers/TypographyProvider';
import { parseInline, parseMarkdown } from '../markdown';

const monospace = Platform.OS === 'ios' ? 'Menlo' : 'monospace';
function InlineText({ value, heading = false, onLink }: { value: string; heading?: boolean; onLink: (url: string) => void }) {
  const bold = useFontStyle('semibold');
  return <Text selectable variant={heading ? 'heading' : 'body'} accessibilityRole={heading ? 'header' : undefined} className="leading-6">
    {parseInline(value).map((part, index) => {
      if (part.kind === 'link') return <NativeText key={index} accessibilityRole="link" accessibilityLabel={part.text} className="text-primary underline" onPress={() => onLink(part.url)}>{part.text}</NativeText>;
      return <NativeText key={index} style={part.kind === 'bold' ? bold : part.kind === 'italic' ? { fontStyle: 'italic' } : part.kind === 'code' ? { fontFamily: monospace } : undefined} className={part.kind === 'code' ? 'bg-surface-muted' : undefined}>{part.text}</NativeText>;
    })}
  </Text>;
}

export function AssistantMessage({ content }: { content: string }) {
  const blocks = useMemo(() => parseMarkdown(content), [content]);
  const [linkError, setLinkError] = useState('');
  const openLink = (url: string) => { setLinkError(''); void Linking.openURL(url).catch(() => setLinkError('This link could not be opened.')); };
  return <View className="gap-3">
    {blocks.map((block, index) => {
      if (block.kind === 'rule') return <View key={index} className="my-1 border-t border-border" />;
      if (block.kind === 'code') return <View key={index} className="gap-2 rounded-control bg-surface-muted p-3">
        {block.language ? <Text variant="caption">{block.language}</Text> : null}
        <ScrollView horizontal><Text selectable style={{ fontFamily: monospace }}>{block.text}</Text></ScrollView>
      </View>;
      if (block.kind === 'list') return <View key={index} className="gap-2">{block.items.map((item, row) => <View key={row} className="flex-row gap-2" style={{ paddingLeft: item.indent * 12 }}>
        <Text className="min-w-4 leading-6">{item.marker}</Text><View className="min-w-0 flex-1"><InlineText value={item.text} onLink={openLink} /></View>
      </View>)}</View>;
      if (block.kind === 'table') return <View key={index} className="gap-1">
        <Text variant="caption">Swipe across to see all columns</Text>
        <ScrollView horizontal accessibilityLabel="Assistant result table" showsHorizontalScrollIndicator>
          <View className="overflow-hidden rounded-control border border-border">
            <View className="flex-row bg-surface-muted">{block.headers.map((header, col) => <View key={col} style={{ width: 180 }} className="p-3"><InlineText value={`**${header}**`} onLink={openLink} /></View>)}</View>
            {block.rows.map((row, rowIndex) => <View key={rowIndex} className="flex-row border-t border-border">{block.headers.map((_, col) => <View key={col} style={{ width: 180 }} className="p-3"><InlineText value={row[col] ?? ''} onLink={openLink} /></View>)}</View>)}
          </View>
        </ScrollView>
      </View>;
      return <View key={index} className={block.kind === 'quote' ? 'border-l-2 border-primary pl-3' : undefined}><InlineText value={block.text} heading={block.kind === 'heading'} onLink={openLink} /></View>;
    })}
    {linkError ? <Text accessibilityRole="alert" variant="caption">{linkError}</Text> : null}
  </View>;
}
