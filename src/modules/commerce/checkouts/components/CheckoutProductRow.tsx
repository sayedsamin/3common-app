import { View } from 'react-native';
import { DetailRow, Section, Text } from '@/components/ui';
import type { CheckoutProduct } from '../schemas';

const priceModes = { free: 'Free', paid: 'Paid', pwyc: 'Pay what you can' };
export function CheckoutProductRow({ product, index }: { product: CheckoutProduct; index: number }) {
  return <View className="mb-3">
    <Section title={`Product ${index + 1}: ${product.productId}`} collapsible defaultExpanded={false}>
      <DetailRow label="Product ID" value={product.productId} /><DetailRow label="Quantity" value={product.quantity} />
      <DetailRow label="Visibility" value={product.visibility} />
      <Text variant="label">Dependent products</Text>
      {product.dependents.length === 0 ? <Text variant="muted">No dependent products.</Text> : product.dependents.map((dependent, i) => <Section key={`${dependent.productId}:${i}`} title={`Dependent product ${i + 1}`} collapsible defaultExpanded={false}>
        <DetailRow label="Product ID" value={dependent.productId} /><DetailRow label="Minimum per order" value={dependent.minPerOrder} /><DetailRow label="Maximum per order" value={dependent.maxPerOrder} />
        <DetailRow label="Price mode" value={dependent.priceMode ? priceModes[dependent.priceMode] : undefined} /><DetailRow label="Price" value={dependent.price} />
        <DetailRow label="Pay-what-you-can minimum" value={dependent.pwycMin} /><DetailRow label="Include organization taxes" value={dependent.includeOrgTaxes} />
        {dependent.price !== undefined || dependent.pwycMin !== undefined ? <Text variant="caption">Currency and price units are not provided.</Text> : null}
        <Text variant="label">Custom fees</Text>
        {dependent.customFees === undefined ? <Text variant="muted">Not provided</Text> : dependent.customFees.length === 0 ? <Text variant="muted">No custom fees.</Text> : dependent.customFees.map((fee, feeIndex) => <View key={`${fee.id ?? fee.name}:${feeIndex}`} className="gap-1 border-t border-border pt-2">
          <DetailRow label="Name" value={fee.name} /><DetailRow label="Rate" value={fee.rate} /><DetailRow label="Fee ID" value={fee.id} />
          <DetailRow label="Fixed value" value={fee.isFixedValue} /><DetailRow label="Custom fee" value={fee.isCustomFee} /><DetailRow label="Included in service fee" value={fee.includeInServiceFee} />
          <DetailRow label="Default service fee" value={fee.defaultServiceFee} /><DetailRow label="Organization default" value={fee.isOrgDefault} />
        </View>)}
      </Section>)}
    </Section>
  </View>;
}
