import { PlaceholderContent, Screen } from '@/components/ui';

export function PropertiesScreen() {
  return <Screen edges={['left', 'right', 'bottom']}><PlaceholderContent title="Properties" icon="tag-outline" message="In progress" /></Screen>;
}

export function SegmentsScreen() {
  return <Screen edges={['left', 'right', 'bottom']}><PlaceholderContent title="Segments" icon="account-multiple-outline" message="In progress" /></Screen>;
}

