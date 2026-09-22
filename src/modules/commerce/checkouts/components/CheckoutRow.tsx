import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import { Badge, Icon, Text } from '@/components/ui';
import { checkoutImageUrlSchema, type CheckoutListItem } from '../schemas';

export function CheckoutRow({ item }: { item: CheckoutListItem }) {
  const [failedImage, setFailedImage] = useState<string>();
  const parsedImage = checkoutImageUrlSchema.safeParse(item.eventImage);
  const image = parsedImage.success ? parsedImage.data : undefined;
  return <Pressable accessibilityRole="button" accessibilityLabel={`View checkout: ${item.name || 'Untitled checkout'}`}
    onPress={() => router.push({ pathname: '/commerce/checkouts/[checkoutId]', params: { checkoutId: item.id } })}
    className="mb-2 flex-row items-start gap-3 rounded-card bg-surface p-3 active:bg-surface-muted web:focus-visible:outline-2 web:focus-visible:outline-offset-2 web:focus-visible:outline-focus">
    <View className="h-16 w-16 items-center justify-center overflow-hidden rounded-control bg-surface-muted">
      {image && image !== failedImage ? <Image source={{ uri: image }} style={{ width: 64, height: 64 }} contentFit="cover" accessibilityLabel={`${item.eventName || item.name} image`} onError={() => setFailedImage(image)} /> : <Icon name="cart-outline" size={24} tone="muted" />}
    </View>
    <View className="min-w-0 flex-1 gap-1">
      <View className="flex-row items-start gap-2"><Text variant="cardTitle" className="flex-1" numberOfLines={2}>{item.name || 'Untitled checkout'}</Text><Icon name="chevron-right" tone="muted" size={18} /></View>
      {item.description ? <Text variant="caption" numberOfLines={2}>{item.description}</Text> : null}
      {item.eventName ? <Text variant="caption" numberOfLines={1}>Event: {item.eventName}</Text> : null}
      {item.formName ? <Text variant="caption" numberOfLines={1}>Form: {item.formName}</Text> : null}
      <View className="mt-1 flex-row flex-wrap items-center gap-x-3 gap-y-1">
        <Badge label={item.status === 'open' ? 'Open' : 'Closed'} variant={item.status === 'open' ? 'success' : 'neutral'} />
        <Text variant="caption">{item.visibility === 'public' ? 'Public' : 'Private'}</Text>
        <Text variant="caption">{item.productsCount} {item.productsCount === 1 ? 'product' : 'products'}</Text>
      </View>
    </View>
  </Pressable>;
}
