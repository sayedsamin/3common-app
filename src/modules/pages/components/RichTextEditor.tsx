import { useState } from 'react';
import { View } from 'react-native';
import { Button, Input, Text } from '@/components/ui';
import type { SimpleText, TextMark } from '../schemas';
import { formatSelection, paragraphText, replaceText } from '../utils';

export function RichTextEditor({ value, onChange, disabled }: { value: SimpleText; onChange: (value: SimpleText) => void; disabled: boolean }) {
  const [active, setActive] = useState(0); const [selection, setSelection] = useState({ start: 0, end: 0 }); const [link, setLink] = useState('');
  function update(index: number, block: SimpleText['content'][number]) { onChange({ ...value, content: value.content.map((item, i) => i === index ? block : item) }); }
  function format(mark: TextMark) { const block = value.content[active]; if (block) update(active, formatSelection(block, selection.start, selection.end, mark)); }
  return <View className="gap-3">
    <Text variant="muted">Select text, then apply formatting. New text uses plain formatting.</Text>
    {value.content.map((block, index) => <View key={index} className="gap-2">
      <Input label={`Paragraph ${index + 1}`} multiline value={paragraphText(block)} disabled={disabled} onFocus={() => { setActive(index); setSelection({ start: 0, end: 0 }); }} onSelectionChange={event => { setActive(index); setSelection(event.nativeEvent.selection); }} onChangeText={text => update(index, replaceText(block, text))} />
      <View className="flex-row flex-wrap gap-2">{(['paragraph', 'h1', 'h2', 'h3'] as const).map(kind => <Button key={kind} label={kind === 'paragraph' ? 'Paragraph' : kind.toUpperCase()} disabled={disabled} variant="secondary" onPress={() => update(index, { ...block, type: kind === 'paragraph' ? 'paragraph' : 'heading', attrs: kind === 'paragraph' ? { textAlign: block.attrs?.textAlign ?? 'left' } : { textAlign: block.attrs?.textAlign ?? 'left', level: kind === 'h1' ? 1 : kind === 'h2' ? 2 : 3 } })} />)}</View>
    </View>)}
    <View className="flex-row flex-wrap gap-2"><Button label="Bold" variant="secondary" disabled={disabled || selection.start === selection.end} onPress={() => format({ type: 'bold' })} /><Button label="Italic" variant="secondary" disabled={disabled || selection.start === selection.end} onPress={() => format({ type: 'italic' })} /><Button label="Add paragraph" variant="secondary" disabled={disabled} onPress={() => onChange({ ...value, content: [...value.content, { type: 'paragraph', attrs: { textAlign: 'left' }, content: [] }] })} /></View>
    <Input label="Link URL for selected text" value={link} onChangeText={setLink} autoCapitalize="none" disabled={disabled} /><Button label="Apply link" disabled={disabled || selection.start === selection.end || !/^https?:\/\//i.test(link)} onPress={() => format({ type: 'link', attrs: { href: link } })} />
    <Text variant="label">Formatted preview</Text>
    {value.content.map((block, index) => <Text key={index} style={{ fontSize: block.type === 'heading' ? 28 - (block.attrs?.level ?? 1) * 3 : 16, textAlign: block.attrs?.textAlign }}>{block.content?.map((run, i) => <Text key={i} style={{ fontWeight: run.marks?.some(m => m.type === 'bold') ? '700' : '400', fontStyle: run.marks?.some(m => m.type === 'italic') ? 'italic' : 'normal', textDecorationLine: run.marks?.some(m => m.type === 'link') ? 'underline' : 'none' }}>{run.text}</Text>)}</Text>)}
  </View>;
}
