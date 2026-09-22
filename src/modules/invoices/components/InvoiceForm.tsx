import { Controller, useFieldArray, useWatch, type Control, type FieldPathByValue } from 'react-hook-form';
import { useState } from 'react';
import { Switch, View } from 'react-native';
import { router } from 'expo-router';
import { Button, Input, Screen, Text } from '@/components/ui';
import { ContactSelectInput } from '@/modules/crm';
import type { Invoice } from '../schemas';
import type { InvoiceFormValues } from '../form-schemas';
import { useInvoiceForm } from '../hooks';

function FormInput({ control, name, label, disabled, numeric = false, helperText }: {
  control: Control<InvoiceFormValues>; name: FieldPathByValue<InvoiceFormValues, string>; label: string; disabled: boolean; numeric?: boolean; helperText?: string;
}) {
  return <Controller control={control} name={name} render={({ field, fieldState }) => <Input label={label} value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} disabled={disabled} error={fieldState.error?.message} keyboardType={numeric ? 'decimal-pad' : 'default'} helperText={helperText} autoCapitalize="none" />} />;
}
export function InvoiceForm({ invoice, notice, canSave = true }: { invoice?: Invoice; notice?: string; canSave?: boolean }) {
  // Keep the original line indexes paired with the values loaded into the form,
  // even if a background refresh updates the query while the user is editing.
  const [initialInvoice] = useState(invoice);
  const { form, submit, mutation, error, selectCustomer } = useInvoiceForm(initialInvoice, id => router.replace({ pathname: '/commerce/invoices/[invoiceId]', params: { invoiceId: id } }));
  const [firstName, lastName, email] = useWatch({ control: form.control, name: ['customerFirstName', 'customerLastName', 'customerEmail'] });
  const lines = useFieldArray({ control: form.control, name: 'lineItems' });
  const taxes = useFieldArray({ control: form.control, name: 'taxIds' });
  const isBusy = mutation.isPending || form.formState.isSubmitting;
  return <Screen edges={['left', 'right', 'bottom']}>
    <Text variant="heading">{invoice ? 'Edit draft invoice' : 'New invoice'}</Text>
    {notice ? <Text accessibilityRole="alert">{notice}</Text> : null}
    <Text variant="muted">Search your contacts and select a customer to fill their details. You can edit the details for this invoice.</Text>
    <Controller control={form.control} name="customerId" render={({ field, fieldState }) => <ContactSelectInput value={field.value} selectedLabel={[firstName, lastName].filter(Boolean).join(' ') || email} onSelect={selectCustomer} disabled={isBusy} error={fieldState.error?.message} />} />
    <Text variant="muted">Uses the contact’s billing email when available, otherwise their email.</Text>
    {([{ name: 'customerEmail', label: 'Customer email' }, { name: 'customerFirstName', label: 'First name' }, { name: 'customerLastName', label: 'Last name' }, { name: 'customerPhone', label: 'Phone' }] as const).map(field => <FormInput key={field.name} control={form.control} {...field} disabled={isBusy} />)}
    {!invoice ? <Controller control={form.control} name="currency" render={({ field }) => <View className="gap-2"><Text variant="label">Currency</Text><View className="flex-row gap-3">{(['USD', 'CAD'] as const).map(currency => <Button key={currency} label={currency} variant={field.value === currency ? 'primary' : 'secondary'} disabled={isBusy} onPress={() => field.onChange(currency)} accessibilityState={{ selected: field.value === currency }} />)}</View></View>} /> : <Text>Currency: {invoice.currency ?? 'Unavailable'}</Text>}
    <Text variant="heading">Line items</Text>
    {lines.fields.map((line, index) => <View key={line.id} className="gap-3 rounded-control border border-border p-4">
      <FormInput control={form.control} name={`lineItems.${index}.description`} label={`Line ${index + 1} description`} disabled={isBusy} />
      <FormInput control={form.control} name={`lineItems.${index}.quantity`} label={`Line ${index + 1} quantity`} disabled={isBusy} numeric />
      <FormInput control={form.control} name={`lineItems.${index}.unitAmount`} label={`Line ${index + 1} unit price`} disabled={isBusy} numeric />
      <FormInput control={form.control} name={`lineItems.${index}.taxAmount`} label={`Line ${index + 1} tax`} disabled={isBusy} numeric helperText="Total tax for this line. Enter 0 for no tax." />
      <Button label={`Remove line ${index + 1}`} variant="secondary" disabled={isBusy || lines.fields.length === 1} onPress={() => lines.remove(index)} />
    </View>)}
    <Button label="Add line item" variant="secondary" disabled={isBusy} onPress={() => lines.append({ description: '', quantity: '1', unitAmount: '', taxAmount: '' })} />
    <Text variant="muted">Prices and taxes use decimal amounts in the invoice currency. Totals are calculated by the server after saving.</Text>
    <FormInput control={form.control} name="notes" label="Notes" disabled={isBusy} />
    <FormInput control={form.control} name="dueAt" label="Due date" disabled={isBusy} helperText="ISO date and time with timezone, e.g. 2026-10-01T17:00:00-05:00. An existing due date cannot be cleared." />
    <Text variant="heading">Tax IDs</Text>
    {taxes.fields.map((tax, index) => <View key={tax.id} className="gap-3">
      <FormInput control={form.control} name={`taxIds.${index}.type`} label={`Tax ID ${index + 1} type`} helperText="For example, ca_gst_hst or us_ein." disabled={isBusy} />
      <FormInput control={form.control} name={`taxIds.${index}.value`} label={`Tax ID ${index + 1} value`} disabled={isBusy} />
      <Button label={`Remove tax ID ${index + 1}`} variant="secondary" disabled={isBusy} onPress={() => taxes.remove(index)} />
    </View>)}
    <Button label="Add tax ID" variant="secondary" disabled={isBusy} onPress={() => taxes.append({ type: '', value: '' })} />
    {!invoice ? <>
      <FormInput control={form.control} name="subscriptionId" label="Subscription ID (optional)" disabled={isBusy} />
      <FormInput control={form.control} name="quoteId" label="Quote ID (optional)" disabled={isBusy} />
      <Controller control={form.control} name="autoCharge" render={({ field }) => <View className="gap-2"><Text variant="label">Automatically charge saved card</Text><Switch accessibilityLabel="Automatically charge saved card" value={field.value} onValueChange={field.onChange} disabled={isBusy} /><Text variant="muted">Opt this invoice into charging the customer’s saved card. This setting cannot be changed through draft editing.</Text></View>} />
    </> : null}
    {error ? <Text accessibilityRole="alert">{error}</Text> : null}
    <Button label={invoice ? 'Save changes' : 'Create draft'} loading={isBusy} disabled={!canSave} onPress={() => { void submit(); }} />
    <Button label="Cancel" variant="secondary" disabled={isBusy} onPress={() => invoice ? router.replace({ pathname: '/commerce/invoices/[invoiceId]', params: { invoiceId: invoice.id } }) : router.replace('/commerce/invoices')} />
  </Screen>;
}
