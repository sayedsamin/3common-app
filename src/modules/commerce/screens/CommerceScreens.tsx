import { PlaceholderContent, Screen } from '@/components/ui';

export function ProductsScreen() {
  return <Screen edges={['left', 'right', 'bottom']}><PlaceholderContent title="Products" icon="package-variant-closed" message="In progress" /></Screen>;
}

export function PromoCodesScreen() {
  return <Screen edges={['left', 'right', 'bottom']}><PlaceholderContent title="Promo Codes" icon="ticket-percent-outline" message="In progress" /></Screen>;
}

export function CheckoutsScreen() {
  return <Screen edges={['left', 'right', 'bottom']}><PlaceholderContent title="Checkouts" icon="cart-outline" message="In progress" /></Screen>;
}

export function InvoicesScreen() {
  return <Screen edges={['left', 'right', 'bottom']}><PlaceholderContent title="Invoices" icon="file-document-outline" message="In progress" /></Screen>;
}

