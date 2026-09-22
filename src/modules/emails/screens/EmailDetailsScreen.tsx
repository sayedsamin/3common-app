import { useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { View } from 'react-native';
import { Button, Input, OptionSheet, QueryFeedback, Screen, Text } from '@/components/ui';
import { PagePreview } from '@/modules/pages';
import { emailQueryOptions } from '../queries';
import { useEmailAction, type EmailAction } from '../mutations';
import { emailError, emailStatus, localScheduleToISO } from '../utils';

export function InvalidEmailScreen() { return <Screen><Text accessibilityRole="alert">This email link is invalid.</Text><Button label="Back to emails" onPress={() => router.replace('/marketing/emails')} /></Screen>; }
export function EmailDetailsScreen({ emailId }: { emailId: string }) {
  const query = useQuery(emailQueryOptions(emailId)); const mutation = useEmailAction(emailId); const [confirmation, setConfirmation] = useState<'send' | 'delete' | null>(null); const [schedule, setSchedule] = useState(''); const [error, setError] = useState(''); const [notice, setNotice] = useState(''); const lock = useRef(false);
  async function run(action: EmailAction) { if (lock.current) return; lock.current = true; setError(''); setNotice(''); try { await mutation.mutateAsync(action); setConfirmation(null); if (action.type === 'delete') router.replace('/marketing/emails'); else setNotice(action.type === 'cancel' ? 'Schedule cancelled. The email is now a draft.' : action.type === 'send' ? 'Send request completed.' : 'Email scheduled.'); } catch (e) { setError(emailError(e)); } finally { lock.current = false; } }
  const email = query.data; const status = email ? emailStatus(email) : ''; const disabled = mutation.isPending || query.isFetching || Boolean(query.error) || query.fetchStatus === 'paused';
  return <Screen edges={['left', 'right', 'bottom']} className="gap-4"><QueryFeedback query={query} label="email" />
    {email ? <><Text variant="label">{email.subject || 'Untitled email'}</Text><Text>{status}</Text><Text>From: {email.display_name || 'Default sender'}</Text><Text>Reply-to: {email.reply_to_email || 'System default'}</Text><Text>Recipients: {email.recipient_emails?.join(', ') || 'No typed recipients'}</Text><Text>Event audiences: {email.event_refs?.length ?? 0}</Text>{email.date_sent ? <Text>Delivery: {new Date(email.date_sent).toLocaleString()}</Text> : null}
      <Text>Content: {email.page_id ? 'Saved Page' : (email.data_version ?? 0) === 0 ? 'Legacy content blocks' : 'Embedded content'}</Text>
      {email.page_id ? <PagePreview pageId={email.page_id} /> : null}
      {email.attachments?.map((attachment, index) => <Text key={`${attachment.name}-${index}`}>Attachment: {attachment.name} ({attachment.size} bytes)</Text>)}
      {email.sparkpost_metrics ? <View className="gap-2"><Text variant="label">Campaign metrics</Text>{Object.entries(email.sparkpost_metrics).map(([key, value]) => <Text key={key}>{key.replace(/_/g, ' ')}: {value}</Text>)}</View> : null}
      <View className="flex-row flex-wrap gap-2"><Button label="Refresh email" variant="secondary" disabled={mutation.isPending} onPress={() => { void query.refetch(); }} />
        {!email.sent && (email.data_version ?? 0) !== 0 ? <Button label="Edit email" disabled={disabled} onPress={() => router.push({ pathname: '/marketing/emails/[emailId]/edit', params: { emailId } })} /> : null}
        {!email.sent ? <Button label="Send now" disabled={disabled} onPress={() => setConfirmation('send')} /> : null}
        {status === 'Scheduled' ? <Button label="Cancel schedule" disabled={disabled} onPress={() => { void run({ type: 'cancel' }); }} /> : null}
        <Button label="Delete email" variant="destructive" disabled={disabled} onPress={() => setConfirmation('delete')} />
      </View>
      {!email.sent ? <View className="gap-3"><Input label="Schedule delivery (YYYY-MM-DDTHH:mm)" helperText={`Timezone: ${Intl.DateTimeFormat().resolvedOptions().timeZone}. Review the local time before scheduling.`} value={schedule} onChangeText={setSchedule} disabled={disabled} /><Button label="Schedule email" disabled={disabled || !schedule} onPress={() => { try { const sendAt = localScheduleToISO(schedule); void run({ type: 'schedule', sendAt }); } catch (e) { setError(e instanceof Error ? e.message : 'Choose a valid delivery time.'); } }} /></View> : null}
      {status === 'Sent' ? <View className="gap-2"><Button label="Open and bounce events" onPress={() => router.push({ pathname: '/marketing/emails/[emailId]/events', params: { emailId } })} /><Button label="Campaign activity" onPress={() => router.push({ pathname: '/marketing/emails/[emailId]/activity', params: { emailId } })} /></View> : null}
    </> : null}
    {notice ? <Text accessibilityRole="alert">{notice}</Text> : null}{error ? <Text accessibilityRole="alert">{error}</Text> : null}
    <OptionSheet visible={confirmation !== null} title={confirmation === 'send' ? 'Send this campaign now?' : 'Permanently delete this email?'} onClose={() => { if (!mutation.isPending) setConfirmation(null); }} footer={<View className="gap-2"><Button label={confirmation === 'send' ? 'Confirm send' : 'Confirm delete'} variant={confirmation === 'send' ? 'primary' : 'destructive'} loading={mutation.isPending} disabled={disabled} onPress={() => { if (confirmation) void run({ type: confirmation }); }} /><Button label="Cancel" variant="secondary" disabled={mutation.isPending} onPress={() => setConfirmation(null)} /></View>}><Text>{confirmation === 'send' ? 'The saved campaign will be sent to its recipients and configured audiences.' : 'This permanently removes the email record.'}</Text>{error ? <Text accessibilityRole="alert">{error}</Text> : null}</OptionSheet>
  </Screen>;
}
