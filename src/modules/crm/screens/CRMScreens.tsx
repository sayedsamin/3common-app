import { PlaceholderContent, Screen } from '@/components/ui';

export function ContactsScreen() {
  return <Screen edges={['left', 'right', 'bottom']}><PlaceholderContent title="Contacts" icon="account-box-outline" message="In progress" /></Screen>;
}

export function PropertiesScreen() {
  return <Screen edges={['left', 'right', 'bottom']}><PlaceholderContent title="Properties" icon="tag-outline" message="In progress" /></Screen>;
}

export function SegmentsScreen() {
  return <Screen edges={['left', 'right', 'bottom']}><PlaceholderContent title="Segments" icon="account-multiple-outline" message="In progress" /></Screen>;
}

