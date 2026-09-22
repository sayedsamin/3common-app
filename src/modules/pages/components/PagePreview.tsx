import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { View } from 'react-native';
import { QueryFeedback, Text } from '@/components/ui';
import { pageQueryOptions } from '../queries';
import { simpleTextSchema, type PageElement } from '../schemas';
export function ElementPreview({ element }: { element: PageElement }) {
  if (element.type === 'image' && element.image) return <Image source={{ uri: element.image.src }} style={{ width: '100%', maxWidth: 480, aspectRatio: element.image.width / element.image.height }} contentFit="contain" accessibilityLabel={element.alt || 'Email image'} />;
  if (element.type === 'button') return <Text>{element.label}{element.href ? ` (${element.href})` : ''}</Text>;
  if (element.type === 'text') { const parsed = simpleTextSchema.safeParse(element.richText); if (parsed.success) return <View className="gap-2">{parsed.data.content.map((block, index) => <Text key={index} style={{ fontSize: block.type === 'heading' ? 28 - (block.attrs?.level ?? 1) * 3 : 16, textAlign: block.attrs?.textAlign }}>{block.content?.map((run, i) => <Text key={i} style={{ fontWeight: run.marks?.some(mark => mark.type === 'bold') ? '700' : '400', fontStyle: run.marks?.some(mark => mark.type === 'italic') ? 'italic' : 'normal', textDecorationLine: run.marks?.some(mark => mark.type === 'link') ? 'underline' : 'none' }}>{run.text}</Text>)}</Text>)}</View>; }
  return <Text variant="muted">Saved {element.type} content</Text>;
}
export function PagePreview({ pageId }: { pageId: string }) { const query = useQuery(pageQueryOptions(pageId)); return <View className="gap-3"><QueryFeedback query={query} label="page preview" />{query.data ? <><Text variant="label">{query.data.name}</Text><Text variant="muted">Content preview. Delivery layout may differ.</Text>{query.data.sections.map(section => <View key={section.id} className="gap-3">{section.elements.map(element => <ElementPreview key={element.id} element={element} />)}</View>)}</> : null}</View>; }
