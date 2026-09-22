import { useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Switch, View } from 'react-native';
import { router } from 'expo-router';
import { Button, Input, OptionSheet, Text } from '@/components/ui';
import { paymentFormSchema } from '../form-schemas';
import { useInvoiceMutation, type InvoiceAction } from '../mutations';
import type { Invoice } from '../schemas';
import { decimalToCents, invoiceActions, invoiceErrorMessage } from '../utils';

type ActionName = 'delete' | 'finalize' | 'void' | 'send' | 'payment';
export function InvoiceActions({ invoice, disabled = false }: { invoice: Invoice; disabled?: boolean }) {
  const allowed = invoiceActions(invoice);
  const mutation = useInvoiceMutation();
  const [action, setAction] = useState<ActionName>();
  const [sendEmail, setSendEmail] = useState(false);
  const [reason, setReason] = useState('');
  const [message, setMessage] = useState<string>();
  const [error, setError] = useState<string>();
  const payment = useForm({ defaultValues: { amount: '', note: '' } });
  const intent = useRef<{ signature: string; key: string } | undefined>(undefined);
  const lock = useRef(false);
  const isBusy = mutation.isPending;
  const canRun = action === 'delete' ? allowed.canDelete : action === 'finalize' ? allowed.canFinalize : action === 'void' ? allowed.canVoid : action === 'send' ? allowed.canSend : action === 'payment' ? allowed.canPay : false;
  const close = () => { if (!lock.current) setAction(undefined); };
  async function execute() {
    if (!action || disabled || !canRun || lock.current) return;
    setError(undefined);
    let operation: InvoiceAction;
    if (action === 'payment') {
      const parsed = paymentFormSchema.safeParse(payment.getValues());
      if (!parsed.success) { setError(parsed.error.issues.map(issue => issue.message).join('\n')); return; }
      const amount = decimalToCents(parsed.data.amount);
      if (amount === undefined) return;
      const signature = JSON.stringify([invoice.id, amount, parsed.data.note]);
      if (intent.current?.signature !== signature) intent.current = { signature, key: `invoice-${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}` };
      operation = { type: 'payment', id: invoice.id, input: { payment: amount, note: parsed.data.note || undefined, idempotencyKey: intent.current.key } };
    } else if (action === 'finalize') operation = { type: action, id: invoice.id, sendEmail };
    else if (action === 'void') operation = { type: action, id: invoice.id, reason: reason.trim() || undefined };
    else operation = { type: action, id: invoice.id };
    lock.current = true;
    try {
      await mutation.mutateAsync(operation);
      setMessage(action === 'send' ? 'Invoice email sent.' : action === 'payment' ? 'Payment recorded.' : action === 'finalize' ? 'Invoice finalized.' : action === 'void' ? 'Invoice voided.' : 'Draft deleted.');
      if (action === 'payment') { payment.reset(); intent.current = undefined; }
      setAction(undefined);
      if (action === 'delete') router.replace('/commerce/invoices');
    } catch (failure) { setError(invoiceErrorMessage(failure)); }
    finally { lock.current = false; }
  }
  const buttons: { type: ActionName; label: string; visible: boolean }[] = [
    { type: 'finalize', label: 'Finalize invoice', visible: allowed.canFinalize },
    { type: 'send', label: invoice.status === 'paid' ? 'Send receipt' : 'Send invoice email', visible: allowed.canSend },
    { type: 'payment', label: 'Record payment', visible: allowed.canPay },
    { type: 'void', label: 'Void invoice', visible: allowed.canVoid },
    { type: 'delete', label: 'Delete draft', visible: allowed.canDelete },
  ];
  return <View className="gap-3">
    {message ? <Text accessibilityRole="alert">{message}</Text> : null}
    {allowed.canEdit ? <Button label="Edit draft" variant="secondary" disabled={disabled || isBusy} onPress={() => router.push({ pathname: '/commerce/invoices/[invoiceId]/edit', params: { invoiceId: invoice.id } })} /> : null}
    {buttons.filter(button => button.visible).map(button => <Button key={button.type} label={button.label} variant={button.type === 'delete' || button.type === 'void' ? 'destructive' : 'secondary'} disabled={disabled || isBusy} onPress={() => { setError(undefined); setMessage(undefined); setSendEmail(false); setAction(button.type); }} />)}
    <OptionSheet title={buttons.find(button => button.type === action)?.label ?? 'Invoice action'} visible={action !== undefined} onClose={close} footer={<View className="gap-2"><Button label="Confirm" loading={isBusy} disabled={disabled || !canRun || (action === 'finalize' && sendEmail && !invoice.customerEmail?.trim())} onPress={() => { void execute(); }} /><Button label="Cancel action" variant="secondary" disabled={isBusy} onPress={close} /></View>}>
      <View className="gap-4">
        {action === 'delete' ? <Text>This permanently deletes the draft invoice.</Text> : null}
        {action === 'finalize' ? <><Text>Finalizing issues an invoice number and prevents further draft edits.{invoice.autoCharge ? ' Automatic charging is enabled for this invoice.' : ''}</Text><Text>Send email</Text><Switch accessibilityLabel="Send email when finalizing" value={sendEmail} onValueChange={setSendEmail} disabled={isBusy || !invoice.customerEmail?.trim()} />{!invoice.customerEmail?.trim() ? <Text variant="muted">Add a customer email to the draft before sending.</Text> : null}</> : null}
        {action === 'void' ? <><Text>This cancels the invoice and keeps its audit record.</Text><Input label="Void reason (optional)" value={reason} onChangeText={setReason} disabled={isBusy} /></> : null}
        {action === 'send' ? <Text>Send {invoice.status === 'paid' ? 'a receipt' : 'a payment link and invoice'} to {invoice.customerEmail}?</Text> : null}
        {action === 'payment' ? <><Text>Record a payment already received in {invoice.currency ?? 'the invoice currency'}. This does not charge a card. Partial payments are supported.</Text><Controller control={payment.control} name="amount" render={({ field }) => <Input label="Payment amount" value={field.value} onChangeText={field.onChange} keyboardType="decimal-pad" disabled={isBusy} />} /><Controller control={payment.control} name="note" render={({ field }) => <Input label="Payment note (optional)" value={field.value} onChangeText={field.onChange} disabled={isBusy} />} /></> : null}
        {!canRun && action ? <Text accessibilityRole="alert">This action is no longer available for the invoice’s current status.</Text> : null}
        {error ? <Text accessibilityRole="alert">{error}</Text> : null}
      </View>
    </OptionSheet>
  </View>;
}
