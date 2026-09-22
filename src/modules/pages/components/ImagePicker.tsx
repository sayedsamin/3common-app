import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FlashList } from '@shopify/flash-list';
import { Image } from 'expo-image';
import { View } from 'react-native';
import { Button, EmptyState, QueryFeedback, Text } from '@/components/ui';
import { imagesQueryOptions } from '../queries';
export function ImagePicker({ value, onChange, disabled }: { value: string; onChange: (id: string) => void; disabled: boolean }) {
  const [page, setPage] = useState(0); const query = useQuery(imagesQueryOptions(page));
  return <View className="gap-3"><Text variant="label">Registered images</Text><QueryFeedback query={query} label="images" />
    <View style={{ height: 220 }}><FlashList horizontal data={query.data?.data ?? []} keyExtractor={asset => asset.id} renderItem={({ item: asset }) => <View className="gap-2 pr-3" style={{ width: 220 }}><Image source={{ uri: asset.url }} style={{ width: 120, height: 90 }} contentFit="contain" accessibilityLabel={asset.filename} /><Button label={`${asset.id === value ? 'Selected: ' : ''}${asset.filename}`} disabled={disabled} variant="secondary" onPress={() => onChange(asset.id)} /></View>} /></View>
    {query.data?.data.length === 0 ? <EmptyState title="No registered images" description="Register an image in your asset library to use it here." /> : null}
    <View className="flex-row gap-2"><Button label="Previous images" disabled={disabled || page === 0 || query.isFetching} onPress={() => setPage(page - 1)} /><Button label="Next images" disabled={disabled || !query.data?.hasMore || query.isFetching} onPress={() => setPage(page + 1)} /></View>
  </View>;
}
