import { PlaceholderContent, Screen } from '@/components/ui';

export function CollectionsScreen() {
  return <Screen edges={['left', 'right', 'bottom']}><PlaceholderContent title="Collections" icon="folder-multiple-outline" message="In progress" /></Screen>;
}

export function SeatingChartsScreen() {
  return <Screen edges={['left', 'right', 'bottom']}><PlaceholderContent title="Seating Charts" icon="seat-outline" message="In progress" /></Screen>;
}

export function WaitlistsScreen() {
  return <Screen edges={['left', 'right', 'bottom']}><PlaceholderContent title="Waitlists" icon="clipboard-list-outline" message="In progress" /></Screen>;
}

export function AffiliateSellersScreen() {
  return <Screen edges={['left', 'right', 'bottom']}><PlaceholderContent title="Affiliate Sellers" icon="account-group-outline" message="In progress" /></Screen>;
}
