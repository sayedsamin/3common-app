import { PlaceholderContent, Screen } from '@/components/ui';

export function BankingScreen() {
  return <Screen edges={['left', 'right', 'bottom']}><PlaceholderContent title="Banking" icon="bank-outline" message="In progress" /></Screen>;
}

export function OrdersScreen() {
  return <Screen edges={['left', 'right', 'bottom']}><PlaceholderContent title="Orders" icon="receipt-text-outline" message="In progress" /></Screen>;
}

export function RefundsScreen() {
  return <Screen edges={['left', 'right', 'bottom']}><PlaceholderContent title="Refunds" icon="cash-refund" message="In progress" /></Screen>;
}

export function TopUpsScreen() {
  return <Screen edges={['left', 'right', 'bottom']}><PlaceholderContent title="Top ups" icon="cash-plus" message="In progress" /></Screen>;
}

export function DisputesScreen() {
  return <Screen edges={['left', 'right', 'bottom']}><PlaceholderContent title="Disputes" icon="scale-balance" message="In progress" /></Screen>;
}

