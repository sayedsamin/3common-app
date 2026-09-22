import { useEffect, useState } from 'react';
import { Controller } from 'react-hook-form';
import { View } from 'react-native';
import { router, useNavigation } from 'expo-router';
import { usePreventRemove } from 'expo-router/react-navigation';
import { Button, Input, OptionSheet, Screen, Text } from '@/components/ui';
import { useUnsavedPageWarning } from '@/hooks/useUnsavedPageWarning';
import { useContactEditor } from '../hooks';
import { contactStatusSchema, type Contact } from '../schemas';
import { contactLabel } from '../utils';

const fields = [{ name: 'email', label: 'Email' }, { name: 'billingEmail', label: 'Billing email' }, { name: 'firstName', label: 'First name' }, { name: 'lastName', label: 'Last name' }, { name: 'phone', label: 'Phone' }] as const;
export function ContactForm({ contact, notice }: { contact?: Contact; notice?: string }) {
  const { form, submit, savedId } = useContactEditor(contact);
  const { isDirty, isSubmitting, errors } = form.formState;
  const [leave, setLeave] = useState<(() => void) | null>(null);
  const navigation = useNavigation();
  usePreventRemove(!savedId && (isDirty || isSubmitting), ({ data }) => {
    if (!isSubmitting) setLeave(() => () => navigation.dispatch(data.action));
  });
  useUnsavedPageWarning(!savedId && (isDirty || isSubmitting));
  useEffect(() => { if (savedId && !isSubmitting) router.replace({ pathname: '/crm/contacts/[contactId]', params: { contactId: savedId } }); }, [savedId, isSubmitting]);
  return <Screen edges={['left', 'right', 'bottom']} className="max-w-[760px]">
    {notice ? <Text accessibilityRole="alert">{notice}</Text> : null}
    {fields.map(({ name, label }) => <Controller key={name} control={form.control} name={name} render={({ field, fieldState }) =>
      <Input label={label} value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} disabled={isSubmitting || Boolean(savedId)}
        keyboardType={name === 'phone' ? 'phone-pad' : name === 'email' || name === 'billingEmail' ? 'email-address' : 'default'}
        autoCapitalize={name === 'firstName' || name === 'lastName' ? 'words' : 'none'} autoCorrect={false} error={fieldState.error?.message}
        helperText={name === 'billingEmail' && !contact ? 'Leave blank to use the contact email.' : undefined} />
    } />)}
    {contact ? <Controller control={form.control} name="status" render={({ field }) => <View className="gap-2">
      <Text variant="label">Status</Text><View className="flex-row flex-wrap gap-2">{contactStatusSchema.options.map(status => <Button key={status} label={contactLabel(status)}
        accessibilityRole="radio" accessibilityState={{ checked: field.value === status }} variant={field.value === status ? 'primary' : 'secondary'}
        disabled={isSubmitting || Boolean(savedId)} onPress={() => field.onChange(status)} />)}</View>
    </View>} /> : null}
    {errors.root?.message ? <Text accessibilityRole="alert" className="text-danger">{errors.root.message}</Text> : null}
    <View className="flex-row flex-wrap gap-3">
      <Button label="Cancel" variant="secondary" disabled={isSubmitting} onPress={() => contact
        ? router.replace({ pathname: '/crm/contacts/[contactId]', params: { contactId: contact.id } }) : router.replace('/crm/contacts')} />
      <Button label={contact ? 'Save changes' : 'Create contact'} loading={isSubmitting} disabled={Boolean(savedId) || Boolean(contact && !isDirty)} onPress={() => void submit()} />
    </View>
    <OptionSheet visible={leave !== null} title="Discard changes?" onClose={() => setLeave(null)} footer={<View className="gap-2">
      <Button label="Keep editing" onPress={() => setLeave(null)} /><Button label="Discard changes" variant="destructive" onPress={() => { const action = leave; setLeave(null); action?.(); }} />
    </View>}><Text>Your unsaved contact changes will be lost.</Text></OptionSheet>
  </Screen>;
}
