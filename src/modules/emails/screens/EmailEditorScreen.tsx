import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useQuery } from '@tanstack/react-query';
import { router, useNavigation } from 'expo-router';
import { usePreventRemove } from 'expo-router/react-navigation';
import { View } from 'react-native';
import { Button, Input, OptionSheet, QueryFeedback, Screen, Text } from '@/components/ui';
import { useUnsavedPageWarning } from '@/hooks/useUnsavedPageWarning';
import { PageBuilder } from '@/modules/pages';
import { emailQueryOptions } from '../queries';
import { useSaveEmail } from '../mutations';
import { emailFormSchema, type Email, type EmailFormValues } from '../schemas';
import { emailError, formChanges, formValues } from '../utils';
import { EventRecipients } from '../components/EventRecipients';

function EmailForm({ email }: { email?: Email }) {
  const form = useForm<EmailFormValues>({ defaultValues: formValues(email) }); const save = useSaveEmail(email?.id); const [blockDirty, setBlockDirty] = useState(false); const [savedId, setSavedId] = useState<string>(); const [leave, setLeave] = useState<(() => void) | null>(null); const navigation = useNavigation();
  const isDirty = !savedId && (form.formState.isDirty || blockDirty); const isBusy = form.formState.isSubmitting || save.isPending;
  useUnsavedPageWarning(isDirty || isBusy); usePreventRemove(isDirty || isBusy, ({ data }) => { if (!isBusy) setLeave(() => () => navigation.dispatch(data.action)); });
  useEffect(() => { if (savedId && !isBusy) router.replace({ pathname: '/marketing/emails/[emailId]', params: { emailId: savedId } }); }, [savedId, isBusy]);
  const submit = form.handleSubmit(async values => { form.clearErrors(); const parsed = emailFormSchema.safeParse(values); if (!parsed.success) { for (const issue of parsed.error.issues) { const key = issue.path[0]; if (typeof key === 'string' && key in values) { const field = emailFormSchema.keyof().safeParse(key); if (field.success) form.setError(field.data, { message: issue.message }); } } return; } try { const result = await save.mutateAsync(formChanges(parsed.data, email)); if (result.id) { form.reset(parsed.data); setSavedId(result.id); } } catch (error) { form.setError('root', { message: emailError(error) }); } });
  if (email && (email.sent || (email.data_version ?? 0) === 0)) return <Screen><Text>{email.sent ? 'Only drafts can be edited. Cancel a scheduled send first.' : 'This legacy content format cannot be edited through this API.'}</Text></Screen>;
  return <Screen edges={['left', 'right', 'bottom']} className="max-w-[900px] gap-4"><Text variant="label">{email ? 'Edit email' : 'New email'}</Text><Text>{isDirty ? 'Unsaved campaign settings' : 'Campaign settings saved'}</Text>
    {(['subject', 'display_name', 'reply_to_email', 'recipients'] as const).map(name => <Controller key={name} control={form.control} name={name} render={({ field, fieldState }) => <Input label={{ subject: 'Subject', display_name: 'Sender name', reply_to_email: 'Reply-to email', recipients: 'Recipient email addresses' }[name]} value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} multiline={name === 'recipients'} autoCapitalize={name === 'recipients' || name === 'reply_to_email' ? 'none' : 'sentences'} disabled={isBusy || Boolean(savedId)} error={fieldState.error?.message} />} />)}
    <Controller control={form.control} name="event_refs" render={({ field }) => <EventRecipients value={field.value} onChange={field.onChange} disabled={isBusy || Boolean(savedId)} />} />
    <Controller control={form.control} name="sync_event_recipients" render={({ field }) => <Button label={`${field.value ? 'On' : 'Off'}: sync event recipients at send time`} accessibilityRole="switch" accessibilityState={{ checked: field.value }} variant="secondary" disabled={isBusy || Boolean(savedId)} onPress={() => field.onChange(!field.value)} />} />
    {email && !email.page_id ? <Text>Existing embedded content is preserved. This editor changes campaign settings only for this format.</Text> : <Controller control={form.control} name="page_id" render={({ field }) => <PageBuilder value={field.value} onChange={field.onChange} onDirtyChange={setBlockDirty} disabled={isBusy || Boolean(savedId)} />} />}
    {email?.attachments?.length ? <Text>{email.attachments.length} existing attachments will be preserved.</Text> : null}
    {form.formState.errors.root ? <Text accessibilityRole="alert">{form.formState.errors.root.message}</Text> : null}
    <Button label={email ? 'Save campaign settings' : 'Create draft'} loading={isBusy} disabled={blockDirty || Boolean(savedId)} onPress={() => { void submit(); }} />
    <OptionSheet visible={leave !== null} title="Discard unsaved changes?" onClose={() => setLeave(null)} footer={<View className="gap-2"><Button label="Keep editing" onPress={() => setLeave(null)} /><Button label="Discard changes" variant="destructive" onPress={() => { const action = leave; setLeave(null); action?.(); }} /></View>}><Text>Unsaved campaign and block edits will be lost. Page operations already saved remain saved.</Text></OptionSheet>
  </Screen>;
}
export function CreateEmailScreen() { return <EmailForm />; }
export function EditEmailScreen({ emailId }: { emailId: string }) { const query = useQuery({ ...emailQueryOptions(emailId), refetchOnMount: 'always' }); if (query.data && query.isFetchedAfterMount && !query.error) return <EmailForm key={emailId} email={query.data} />; return <Screen><QueryFeedback query={query} label="email to edit" /></Screen>; }
