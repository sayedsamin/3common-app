import { PlaceholderContent, Screen } from '@/components/ui';

export function FormsScreen() {
  return <Screen edges={['left', 'right', 'bottom']}><PlaceholderContent title="Forms" icon="form-select" message="In progress" /></Screen>;
}

export function SocialMediaScreen() {
  return <Screen edges={['left', 'right', 'bottom']}><PlaceholderContent title="Social Media" icon="share-variant-outline" message="In progress" /></Screen>;
}

export function QRCodeGeneratorScreen() {
  return <Screen edges={['left', 'right', 'bottom']}><PlaceholderContent title="QR Code Generator" icon="qrcode" message="In progress" /></Screen>;
}

