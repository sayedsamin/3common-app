import { useState } from 'react';
import { Switch, View } from 'react-native';
import { ContactSelectInput } from '@/modules/crm';
import { Button, Input, OptionSheet, Text } from '@/components/ui';
import { ordersInputSchema, orderStatusSchema, orderTypeSchema, type OrdersInput } from '../schemas';

export function OrderFilters({ input, onChange }: { input: OrdersInput; onChange: (input: OrdersInput) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isAdvanced, setIsAdvanced] = useState(false);
  const [draft, setDraft] = useState(input);
  const [contactLabel, setContactLabel] = useState('');
  const [appliedContactLabel, setAppliedContactLabel] = useState('');
  const [error, setError] = useState<string>();
  const update = (changes: Partial<OrdersInput>) => setDraft(previous => ({ ...previous, ...changes }));
  function apply() {
    const result = ordersInputSchema.safeParse({ ...draft, page: 0 });
    if (!result.success) { setError('Check your filters and try again.'); return; }
    onChange(result.data); setAppliedContactLabel(contactLabel); setIsOpen(false);
  }
  return <View className="gap-2">
    <Button label="Order filters" variant="secondary" accessibilityState={{ expanded: isOpen }} onPress={() => { setDraft(input); setContactLabel(appliedContactLabel); setError(undefined); setIsOpen(true); }} />
    {input.contactId ? <Text>Customer: {appliedContactLabel || 'Selected customer'}</Text> : null}
    <OptionSheet title="Order filters" visible={isOpen} onClose={() => setIsOpen(false)} footer={<View className="flex-row flex-wrap gap-3"><Button label="Apply filters" onPress={apply} /><Button label="Reset filters" variant="secondary" onPress={() => { const reset = { page: 0, pageSize: input.pageSize, sortDirection: input.sortDirection }; onChange(reset); setDraft(reset); setAppliedContactLabel(''); setContactLabel(''); setIsOpen(false); }} /></View>}>
      <View className="gap-4">
        <Text variant="label">Lifecycle status</Text>
        <View className="flex-row flex-wrap gap-2"><Button label="All statuses" variant={draft.orderStatus === undefined ? 'primary' : 'secondary'} onPress={() => update({ orderStatus: undefined })} />{orderStatusSchema.options.map(status => <Button key={status} label={status} accessibilityLabel={`Order status: ${status}`} accessibilityRole="radio" accessibilityState={{ checked: draft.orderStatus === status }} variant={draft.orderStatus === status ? 'primary' : 'secondary'} onPress={() => update({ orderStatus: status })} />)}</View>
        <Text variant="label">Order type</Text>
        <View className="flex-row flex-wrap gap-2"><Button label="All types" variant={draft.type === undefined ? 'primary' : 'secondary'} onPress={() => update({ type: undefined })} />{orderTypeSchema.options.map(type => <Button key={type} label={type} accessibilityLabel={`Order type: ${type}`} accessibilityRole="radio" accessibilityState={{ checked: draft.type === type }} variant={draft.type === type ? 'primary' : 'secondary'} onPress={() => update({ type })} />)}</View>
        <Input label="Exact order number" value={draft.orderNumber ?? ''} onChangeText={orderNumber => update({ orderNumber })} autoCapitalize="none" />
        <Text variant="label">Refunds</Text>
        <View className="flex-row flex-wrap gap-2">{([{ label: 'All refunds', value: undefined }, { label: 'Refunded only', value: true }, { label: 'Non-refunded only', value: false }] as const).map(option => <Button key={option.label} label={option.label} accessibilityRole="radio" accessibilityState={{ checked: draft.refunded === option.value }} variant={draft.refunded === option.value ? 'primary' : 'secondary'} onPress={() => update({ refunded: option.value })} />)}</View>
        <View><Text>Paid/completed only</Text><Switch accessibilityLabel="Paid/completed only" value={draft.status === true} onValueChange={value => update({ status: value ? true : undefined })} /></View>
        <View><Text>Box-office only</Text><Switch accessibilityLabel="Box-office only" value={draft.isBoxOffice === true} onValueChange={value => update({ isBoxOffice: value ? true : undefined })} /></View>
        <ContactSelectInput value={draft.contactId ?? ''} selectedLabel={contactLabel} disabled={!isOpen} onSelect={contact => { update({ contactId: contact.id }); setContactLabel(contact.fullName || contact.email); }} onClear={() => { update({ contactId: undefined }); setContactLabel(''); }} />
        <Button label="Advanced filters" variant="secondary" accessibilityState={{ expanded: isAdvanced }} onPress={() => setIsAdvanced(previous => !previous)} />
        {isAdvanced ? <View className="gap-3">{([{ key: 'eventId', label: 'Event ID' }, { key: 'productSetId', label: 'Product set ID' }, { key: 'timeslotId', label: 'Timeslot ID' }, { key: 'purchaserId', label: 'Purchaser ID' }] as const).map(({ key, label }) => <Input key={key} label={label} value={draft[key] ?? ''} autoCapitalize="none" onChangeText={value => update({ [key]: value })} />)}</View> : null}
        {error ? <Text accessibilityRole="alert">{error}</Text> : null}
      </View>
    </OptionSheet>
  </View>;
}
