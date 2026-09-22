import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { Button, Input, Text } from '@/components/ui';
import { simpleTextSchema, type PageElement, type ElementProps, type SimpleText } from '../schemas';
import { RichTextEditor } from './RichTextEditor';
import { ImagePicker } from './ImagePicker';

export function BlockEditor({ element, disabled, onSave, onDirty }: { element: PageElement; disabled: boolean; onSave: (props: ElementProps) => Promise<boolean>; onDirty: (dirty: boolean) => void }) {
  const parsed = element.type === 'text' ? simpleTextSchema.safeParse(element.richText) : undefined;
  const [richText, setRichText] = useState<SimpleText | undefined>(parsed?.success ? parsed.data : undefined);
  const [textDirty, setTextDirty] = useState(false);
  const form = useForm({ defaultValues: { label: element.type === 'button' ? element.label : '', href: element.type === 'button' || element.type === 'image' ? element.href : '', alt: element.type === 'image' ? element.alt : '', assetId: element.type === 'image' ? element.image?.assetId ?? '' : '' } });
  const dirty = form.formState.isDirty || textDirty;
  useEffect(() => { onDirty(dirty); return () => onDirty(false); }, [dirty, onDirty]);
  async function submit() { const values = form.getValues(); if (values.href && !/^(https?:\/\/|mailto:)/i.test(values.href)) { form.setError('href', { message: 'Enter an https, http, or mailto link.' }); return; } const props: ElementProps = element.type === 'text' ? { richText } : element.type === 'button' ? { label: values.label, href: values.href } : { alt: values.alt, href: values.href, ...(values.assetId ? { image: { assetId: values.assetId } } : {}) }; if (await onSave(props)) { form.reset(values); setTextDirty(false); } }
  return <View className="gap-3"><Text>{dirty ? 'Unsaved block changes' : 'Block saved'}</Text>
    {richText ? <RichTextEditor value={richText} disabled={disabled} onChange={value => { setRichText(value); setTextDirty(true); }} /> : null}
    {(element.type === 'button' ? ['label', 'href'] as const : element.type === 'image' ? ['alt', 'href'] as const : []).map(name => <Controller key={name} control={form.control} name={name} render={({ field, fieldState }) => <Input label={name === 'label' ? 'Button label' : name === 'alt' ? 'Image alternative text' : 'Destination link'} value={field.value} onChangeText={field.onChange} disabled={disabled} error={fieldState.error?.message} />} />)}
    {element.type === 'image' ? <Controller control={form.control} name="assetId" render={({ field }) => <ImagePicker value={field.value} onChange={field.onChange} disabled={disabled} />} /> : null}
    <Button label="Save block" disabled={disabled || !dirty} onPress={() => { void submit(); }} />
  </View>;
}
