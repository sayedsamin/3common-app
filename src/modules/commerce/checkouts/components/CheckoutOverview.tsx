import { View } from 'react-native';
import { Badge, DetailRow, Section, Text } from '@/components/ui';
import type { Checkout } from '../schemas';
import { checkoutDate } from '../utils';

const paymentLabels = { card: 'Card', pay_by_invoice: 'Pay by invoice', pay_later: 'Pay later' };
export function CheckoutOverview({ checkout }: { checkout: Checkout }) {
  const invoice = checkout.payByInvoice;
  return <View className="gap-4">
    <Section title={checkout.name || 'Untitled checkout'}>
      <View className="flex-row flex-wrap items-center gap-2"><Badge label={checkout.status === 'open' ? 'Open' : 'Closed'} variant={checkout.status === 'open' ? 'success' : 'neutral'} /><Badge label={checkout.visibility === 'public' ? 'Public' : 'Private'} /></View>
      <DetailRow label="Description" value={checkout.description} />
      <DetailRow label="Created (UTC)" value={checkoutDate(checkout.createdAt)} /><DetailRow label="Updated (UTC)" value={checkoutDate(checkout.updatedAt)} />
    </Section>
    <Section title="Availability" collapsible defaultExpanded={false}>
      <DetailRow label="Available from" value={checkoutDate(checkout.availableFrom, checkout.availabilityTimezone)} />
      <DetailRow label="Available until" value={checkoutDate(checkout.availableTo, checkout.availabilityTimezone)} />
      <DetailRow label="Timezone" value={checkout.availabilityTimezone} />
      {!checkout.availabilityTimezone ? <Text variant="caption">Dates are displayed in UTC.</Text> : null}
    </Section>
    <Section title="Payment settings" collapsible defaultExpanded={false}>
      <DetailRow label="Payment methods" value={checkout.paymentMethods === undefined ? undefined : checkout.paymentMethods.length ? checkout.paymentMethods.map(method => paymentLabels[method]).join(', ') : 'None configured'} />
      <DetailRow label="Pay button label" value={checkout.payButtonLabel} /><DetailRow label="Confirmation email disabled" value={checkout.disableConfirmationEmail} />
      <DetailRow label="Redirect URL" value={checkout.redirectUrl} />
      <DetailRow label="Pay by invoice enabled" value={invoice?.enabled} /><DetailRow label="Invoice memo" value={invoice?.memo} /><DetailRow label="Invoice due in days" value={invoice?.dueInDays} />
      <Text variant="label">Invoice tax IDs</Text>
      {invoice?.taxIds === undefined ? <Text variant="muted">Not provided</Text> : invoice.taxIds.length === 0 ? <Text variant="muted">No tax IDs.</Text> : invoice.taxIds.map((tax, index) => <DetailRow key={`${tax.type}:${index}`} label={tax.type} value={tax.value} />)}
    </Section>
    <Section title="Limits" collapsible defaultExpanded={false}>
      <DetailRow label="Maximum tickets per checkout" value={checkout.maxTicketsPerSet} /><DetailRow label="Maximum tickets per order" value={checkout.maxTicketsPerOrder} />
    </Section>
    <Section title="Related IDs" collapsible defaultExpanded={false}>
      <DetailRow label="Checkout ID" value={checkout.id} /><DetailRow label="Owner ID" value={checkout.ownerId} />
      <DetailRow label="Event ID" value={checkout.eventId} /><DetailRow label="Timeslot ID" value={checkout.timeslotId} /><DetailRow label="Order form ID" value={checkout.orderFormId} />
    </Section>
  </View>;
}
