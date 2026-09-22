import { useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FlashList } from '@shopify/flash-list';
import { View } from 'react-native';
import { Button, EmptyState, FilterSelect, Screen, Input, Text } from '@/components/ui';
import { useSegmentMembers } from '../hooks';
import { useAddSegmentMember, useRemoveSegmentMember } from '../mutations';
import { segmentQueryOptions } from '../queries';
import { segmentIdSchema, type SegmentMember } from '../schemas';
import { segmentErrorMessage } from '../utils';
import { MemberInput } from '../components/MemberInput';
import { SegmentQueryState } from '../components/SegmentQueryState';
import { SegmentPagination } from '../components/SegmentPagination';

function MemberRow({ item, canEdit, isPending, onRemove }: { item: SegmentMember; canEdit: boolean; isPending: boolean; onRemove: (id: string) => void }) {
  return <View className="gap-2 border-b border-border py-3"><Text selectable>{item.memberId}</Text><Text variant="muted">Joined {item.joinedAt}</Text>
    {canEdit ? <Button label="Remove member" accessibilityLabel={`Remove member ${item.memberId}`} variant="destructive" disabled={isPending} onPress={() => onRemove(item.memberId)} /> : null}
  </View>;
}
export function SegmentMembersScreen({ segmentId }: { segmentId: string }) {
  const detail = useQuery(segmentQueryOptions(segmentId));
  const { input, change, query, isSearchPending } = useSegmentMembers(segmentId);
  const addition = useAddSegmentMember(segmentId);
  const removal = useRemoveSegmentMember(segmentId);
  const [memberId, setMemberId] = useState('');
  const [error, setError] = useState<string>();
  const [message, setMessage] = useState('');
  const acting = useRef(false);
  const isPending = addition.isPending || removal.isPending;
  const canEdit = detail.data?.kind === 'static' && !detail.error;
  const isBusy = query.isFetching || isSearchPending;
  async function modify(action: 'add' | 'remove', id: string) {
    if (acting.current || !canEdit) return;
    if (!segmentIdSchema.safeParse(id).success) { setError('Choose a member or enter a valid 24-character member ID.'); return; }
    acting.current = true; setError(undefined); setMessage('');
    try {
      if (action === 'add') {
        const result = await addition.mutateAsync(id);
        setMessage(result.inserted ? 'Member added.' : 'This member already belongs to the segment.'); setMemberId('');
      } else {
        const result = await removal.mutateAsync(id);
        setMessage(result.removed ? 'Member removed.' : 'This member was already absent.');
      }
    } catch (failure) { setError(segmentErrorMessage(failure)); }
    finally { acting.current = false; }
  }
  const data = isSearchPending ? undefined : query.data;
  return <Screen scrollable={false} edges={['left', 'right', 'bottom']}>
    <FlashList data={data?.data ?? []} keyExtractor={item => item.memberId} keyboardShouldPersistTaps="handled"
      renderItem={({ item }) => <MemberRow item={item} canEdit={canEdit} isPending={isPending} onRemove={id => void modify('remove', id)} />}
      refreshing={query.isRefetching} onRefresh={() => { if (!isBusy) { void query.refetch(); void detail.refetch(); } }}
      ListHeaderComponent={<View className="gap-3">
        <SegmentQueryState query={detail} label="segment" />
        <Text variant="label">{detail.data?.name ?? 'Segment members'}{detail.data?.memberCount === undefined ? '' : ` · ${detail.data.memberCount} members`}</Text>
        {canEdit ? <>
          <MemberInput targetType={detail.data?.targetType} value={memberId} onChange={setMemberId} disabled={isPending} />
          <Button label="Add member" loading={addition.isPending} disabled={isPending} onPress={() => void modify('add', memberId)} />
        </> : detail.data?.kind === 'active' ? <Text>Active membership is managed by filters. Convert the segment to static to add or remove members manually.</Text> : null}
        {error ? <Text accessibilityRole="alert">{error}</Text> : null}{message ? <Text accessibilityLiveRegion="polite">{message}</Text> : null}
        <Input label="Search members" value={input.search ?? ''} onChangeText={search => change({ search })} />
        <FilterSelect label="Joined date" value={input.sortDirection ?? 'desc'} options={[{ value: 'desc', label: 'Newest first' }, { value: 'asc', label: 'Oldest first' }]} onChange={sortDirection => change({ sortDirection })} />
        {!isSearchPending ? <SegmentQueryState query={query} label="members" /> : <Text>Searching members...</Text>}
      </View>}
      ListEmptyComponent={!isBusy && !query.error && query.fetchStatus !== 'paused' ? <EmptyState title="No members found" description="Adjust your search or add members to a static segment." /> : null}
      ListFooterComponent={<SegmentPagination {...input} hasMore={Boolean(data?.hasMore)} isLoading={isBusy} onChange={change} onRefresh={() => { if (!isBusy) void query.refetch(); }} />} />
  </Screen>;
}
