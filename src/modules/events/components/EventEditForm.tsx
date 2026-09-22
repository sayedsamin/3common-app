import { useState } from 'react';
import { Controller, useFieldArray, useWatch, type Control, type FieldPathByValue } from 'react-hook-form';
import { ScrollView, View } from 'react-native';
import { router, useNavigation } from 'expo-router';
import { usePreventRemove } from 'expo-router/react-navigation';
import { Button, Input, OptionSheet, Screen, Section, Text } from '@/components/ui';
import { useEventEditor } from '../edit-hooks';
import type { EventEditValues } from '../edit-schemas';
import { eventStatusSchema, type Event } from '../schemas';
import { statusLabel } from '../utils';
import { useUnsavedPageWarning } from '../useUnsavedPageWarning';
import { EventSelectInput } from './EventSelectInput';

function EditText({ control, name, label, disabled, multiline, helperText }: {
  control: Control<EventEditValues>; name: FieldPathByValue<EventEditValues, string>; label: string;
  disabled: boolean; multiline?: boolean; helperText?: string;
}) {
  return <Controller control={control} name={name} render={({ field, fieldState }) => <Input label={label} value={field.value} onChangeText={field.onChange}
    onBlur={field.onBlur} disabled={disabled} multiline={multiline} style={multiline ? { minHeight: 112, textAlignVertical: 'top' } : undefined}
    autoCapitalize="none" autoCorrect={false} error={fieldState.error?.message} helperText={helperText} />} />;
}
type ChoiceField = 'status' | 'privacy' | 'eventType' | 'hasEndDate' | 'collectEmails' | 'customTerms.type';
function EditChoice({ control, name, label, options, disabled, helperText }: {
  control: Control<EventEditValues>; name: ChoiceField; label: string; options: { value: string; label: string }[]; disabled: boolean; helperText?: string;
}) {
  return <Controller control={control} name={name} render={({ field, fieldState }) => <EventSelectInput label={label} value={field.value} onChange={field.onChange}
    disabled={disabled} options={options} error={fieldState.error?.message} helperText={helperText} />} />;
}
const unchanged = { value: '', label: 'Leave unchanged' };

export function EventEditForm({ event, notice }: { event: Event; notice?: string }) {
  const { form, onSubmit, saved } = useEventEditor(event);
  const { control } = form;
  const { isDirty, isSubmitting, errors } = form.formState;
  const blocks = useFieldArray({ control, name: 'descriptionBlocks', keyName: 'formKey' });
  const hasEndDate = useWatch({ control, name: 'hasEndDate' });
  const termsType = useWatch({ control, name: 'customTerms.type' });
  const hasTerms = useWatch({ control, name: 'customTerms.hasCustomTerms' });
  const [leave, setLeave] = useState<(() => void) | null>(null);
  const navigation = useNavigation();
  usePreventRemove(isDirty || isSubmitting, ({ data }) => {
    if (!isSubmitting) setLeave(() => () => navigation.dispatch(data.action));
  });
  useUnsavedPageWarning(isDirty || isSubmitting);
  const viewEvent = () => router.replace({ pathname: '/events/[eventId]', params: { eventId: event.id } });
  const inputProps = { control, disabled: isSubmitting };
  return <Screen scrollable={false} edges={['left', 'right', 'bottom']} className="max-w-[760px] gap-3">
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 16 }}>
      <View className="w-full min-w-0 gap-5">
        {notice ? <Text accessibilityRole="alert">{notice}</Text> : null}
        <Text variant="muted">{event.name || 'Untitled event'}</Text>
        <Section title="Basics">
          <EditText {...inputProps} name="name" label="Event name" />
          <EditChoice {...inputProps} name="status" label="Status" options={[unchanged, ...eventStatusSchema.options.map(value => ({ value, label: statusLabel(value) }))]} />
          <EditChoice {...inputProps} name="privacy" label="Visibility" options={[unchanged, { value: 'public', label: 'Public' }, { value: 'private', label: 'Private (link only)' }]} />
        </Section>
        <Section title="Description">
          <EditText {...inputProps} name="description" label="Description" multiline helperText="HTML is supported. This description appears when there are no description blocks." />
          {blocks.fields.map((block, index) => <View key={block.formKey} className="w-full min-w-0 gap-3 border-t border-border pt-3">
            <Text variant="label">Block {index + 1}</Text>
            <Controller control={control} name={`descriptionBlocks.${index}.type`} render={({ field }) => <EventSelectInput label={`Block ${index + 1} type`} value={field.value} onChange={field.onChange}
              disabled={isSubmitting} options={[{ value: 'text', label: 'Text' }, { value: 'image', label: 'Image URL' }, { value: 'video', label: 'Video URL' }]} />} />
            <EditText {...inputProps} name={`descriptionBlocks.${index}.content`} label={`Block ${index + 1} content`} multiline />
            <View className="flex-row flex-wrap gap-2">
              <Button label="Move up" accessibilityLabel={`Move block ${index + 1} up`} variant="ghost" disabled={isSubmitting || index === 0} onPress={() => blocks.move(index, index - 1)} />
              <Button label="Move down" accessibilityLabel={`Move block ${index + 1} down`} variant="ghost" disabled={isSubmitting || index === blocks.fields.length - 1} onPress={() => blocks.move(index, index + 1)} />
              <Button label="Remove" accessibilityLabel={`Remove block ${index + 1}`} variant="ghost" disabled={isSubmitting} onPress={() => blocks.remove(index)} />
            </View>
          </View>)}
          <Button label="Add description block" variant="secondary" leadingIcon="plus" disabled={isSubmitting}
            onPress={() => blocks.append({ type: 'text', content: '', id: Math.max(0, ...form.getValues('descriptionBlocks').map(block => block.id)) + 1 })} />
        </Section>
        <Section title="Schedule">
          <Text variant="caption">Enter times in UTC, or paste a timestamp with its timezone offset. The event time zone controls how times are shown to guests.</Text>
          <EditText {...inputProps} name="start" label="Start date and time (UTC)" helperText="For example: 2026-10-01 18:00" />
          <EditChoice {...inputProps} name="hasEndDate" label="End time" options={[unchanged, { value: 'true', label: 'Set an end time' }, { value: 'false', label: 'No end time' }]} />
          {hasEndDate === 'true' ? <EditText {...inputProps} name="end" label="End date and time (UTC)" helperText="For example: 2026-10-01 21:00" /> : null}
          <EditText {...inputProps} name="timeZone" label="Event time zone" helperText="For example: America/Winnipeg" />
          {event.schedule === 'Multiple dates' ? <Text variant="caption">These dates are the overall event bounds. Individual session times cannot be changed here.</Text> : null}
        </Section>
        <Section title="Location">
          <EditChoice {...inputProps} name="eventType" label="Attendance" options={[unchanged, { value: 'inperson', label: 'In person' }, { value: 'virtual', label: 'Virtual' }]} />
          <EditText {...inputProps} name="address" label="Address" multiline />
          <EditText {...inputProps} name="locationPlaceholder" label="Location placeholder" />
          <EditText {...inputProps} name="virtualEventLink" label="Virtual event link" />
        </Section>
        <Section title="Checkout">
          <EditChoice {...inputProps} name="collectEmails" label="Checkout" options={[unchanged, { value: 'true', label: 'Enabled' }, { value: 'false', label: 'Disabled' }]}
            helperText="The current checkout setting is not returned by the API. Disabling checkout prevents customers from ordering." />
          <EditText {...inputProps} name="redirectUrl" label="After-checkout redirect URL" />
          <Controller control={control} name="customTerms.hasCustomTerms" render={({ field }) => <Button label={field.value ? 'Custom terms enabled' : 'Custom terms disabled'}
            accessibilityRole="switch" accessibilityLabel="Custom terms" accessibilityState={{ checked: field.value }} variant="secondary" disabled={isSubmitting} onPress={() => field.onChange(!field.value)} />} />
          {hasTerms ? <>
            <EditChoice {...inputProps} name="customTerms.type" label="Terms format" options={[{ value: 'text', label: 'Text' }, { value: 'url', label: 'Link' }]} />
            {termsType === 'url' ? <EditText {...inputProps} name="customTerms.url" label="Terms URL" /> : <EditText {...inputProps} name="customTerms.content" label="Terms and conditions" multiline />}
          </> : null}
        </Section>
        <Section title="Custom tags"><EditText {...inputProps} name="customTags" label="Custom tags" multiline helperText="Enter one tag per line. Clear the field to remove all custom tags." /></Section>
      </View>
    </ScrollView>
    <View className="gap-2 border-t border-border pt-3">
      {errors.root?.message ? <Text accessibilityRole="alert" className="text-danger">{errors.root.message}</Text> : null}
      {saved && !isDirty ? <Text accessibilityRole="alert" className="text-success">Event saved.</Text> : null}
      <View className="flex-row gap-3">
        <Button label={saved && !isDirty ? 'View event' : 'Cancel'} variant="secondary" disabled={isSubmitting} onPress={viewEvent} />
        <Button label="Save changes" className="flex-1" loading={isSubmitting} disabled={!isDirty} onPress={() => void onSubmit()} />
      </View>
    </View>
    <OptionSheet visible={leave !== null} title="Discard changes?" onClose={() => setLeave(null)}
      footer={<View className="gap-2"><Button label="Keep editing" variant="secondary" onPress={() => setLeave(null)} />
        <Button label="Discard changes" variant="destructive" onPress={() => { const action = leave; setLeave(null); action?.(); }} /></View>}>
      <Text>Your unsaved event changes will be lost.</Text>
    </OptionSheet>
  </Screen>;
}
