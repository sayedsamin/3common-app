import { useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { View } from 'react-native';
import { Button, DetailRow, ErrorState, OptionSheet, Screen, Section, Text } from '@/components/ui';
import { contactQueryOptions } from '../queries';
import { useDeleteContact } from '../mutations';
import { contactDate, contactErrorMessage, contactLabel } from '../utils';
import { ContactQueryState } from '../components/ContactQueryState';

export function ContactDetailsScreen({ contactId }: { contactId: string }) {
  const query = useQuery(contactQueryOptions(contactId));
  const deletion = useDeleteContact(contactId);
  const [isConfirming, setIsConfirming] = useState(false);
  const deleting = useRef(false);
  const contact = query.data;
  async function confirmDelete() {
    if (deleting.current) return;
    deleting.current = true;
    try { await deletion.mutateAsync(); setIsConfirming(false); router.replace('/crm/contacts'); }
    catch { /* Mutation state presents the error and leaves confirmation open. */ }
    finally { deleting.current = false; }
  }
  return <Screen edges={['left', 'right', 'bottom']}>
    <ContactQueryState query={query} label="contact details" />
    {contact ? <>
      <View className="flex-row flex-wrap gap-2">
        <Button label="Edit contact" disabled={deletion.isPending} onPress={() => router.push({ pathname: '/crm/contacts/[contactId]/edit', params: { contactId } })} />
        <Button label="View activity" variant="secondary" disabled={deletion.isPending} onPress={() => router.push({ pathname: '/crm/contacts/[contactId]/activity', params: { contactId } })} />
      </View>
      <Section title={contact.fullName || contact.email}>
        <DetailRow label="Email" value={contact.email} /><DetailRow label="Billing email" value={contact.billingEmail} />
        <DetailRow label="First name" value={contact.firstName} /><DetailRow label="Last name" value={contact.lastName} />
        <DetailRow label="Phone" value={contact.phone} /><DetailRow label="Status" value={contactLabel(contact.status)} />
        <DetailRow label="Created" value={contactDate(contact.createdAt)} /><DetailRow label="First order" value={contactDate(contact.firstOrder)} />
        <DetailRow label="Most recent order" value={contactDate(contact.lastOrder)} />
        <DetailRow label="Order sum" value={contact.orderSum} /><DetailRow label="Gross sum" value={contact.grossSum} />
        <DetailRow label="Events attended" value={contact.eventsAttended_IDS.length} /><DetailRow label="Items purchased" value={contact.itemsPurchased_IDS.length} />
        <DetailRow label="Products purchased" value={contact.productsPurchased_IDS.length} />
      </Section>
      <Button label="Refresh contact" loading={query.isFetching} disabled={deletion.isPending} variant="secondary" onPress={() => { void query.refetch(); }} />
      <Button label="Delete contact" variant="destructive" disabled={deletion.isPending} onPress={() => { deletion.reset(); setIsConfirming(true); }} />
    </> : null}
    <Button label="Back to Contacts" variant="ghost" disabled={deletion.isPending} onPress={() => router.replace('/crm/contacts')} />
    <OptionSheet visible={isConfirming} title="Delete contact?" onClose={() => { if (!deletion.isPending) setIsConfirming(false); }} footer={<View className="gap-2">
      {deletion.error ? <Text accessibilityRole="alert">{contactErrorMessage(deletion.error)}</Text> : null}
      <Button label="Keep contact" variant="secondary" disabled={deletion.isPending} onPress={() => setIsConfirming(false)} />
      <Button label="Confirm delete" variant="destructive" loading={deletion.isPending} onPress={() => void confirmDelete()} />
    </View>}><Text>Delete {contact?.fullName || contact?.email || 'this contact'}{contact?.fullName ? ` (${contact.email})` : ''}? This action cannot be undone.</Text></OptionSheet>
  </Screen>;
}
export function InvalidContactScreen() {
  return <Screen><ErrorState message="This contact link is invalid." /><Button label="Back to Contacts" onPress={() => router.replace('/crm/contacts')} /></Screen>;
}
