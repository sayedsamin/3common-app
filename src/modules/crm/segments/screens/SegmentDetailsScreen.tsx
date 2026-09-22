import { useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { View } from 'react-native';
import { Button, DetailRow, ErrorState, OptionSheet, Screen, Section, Text } from '@/components/ui';
import { useConvertSegmentToStatic, useDeleteSegment } from '../mutations';
import { segmentQueryOptions } from '../queries';
import { segmentErrorMessage } from '../utils';
import { SegmentQueryState } from '../components/SegmentQueryState';

export function SegmentDetailsScreen({ segmentId }: { segmentId: string }) {
  const query = useQuery(segmentQueryOptions(segmentId));
  const deletion = useDeleteSegment(segmentId);
  const conversion = useConvertSegmentToStatic(segmentId);
  const [action, setAction] = useState<'delete' | 'convert'>();
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string>();
  const acting = useRef(false);
  const isPending = deletion.isPending || conversion.isPending;
  async function confirm() {
    if (acting.current || !action) return;
    acting.current = true; setError(undefined);
    try {
      if (action === 'delete') { await deletion.mutateAsync(); router.replace('/crm/segments'); }
      else { await conversion.mutateAsync(); setMessage('Segment converted to static. Membership is now managed manually.'); }
      setAction(undefined);
    } catch (failure) { setError(segmentErrorMessage(failure)); }
    finally { acting.current = false; }
  }
  const segment = query.data;
  return <Screen edges={['left', 'right', 'bottom']}>
    <SegmentQueryState query={query} label="segment" />
    {message ? <Text accessibilityLiveRegion="polite">{message}</Text> : null}
    {segment ? <>
      <View className="flex-row flex-wrap gap-2">
        <Button label="Edit segment" disabled={isPending} onPress={() => router.push({ pathname: '/crm/segments/[segmentId]/edit', params: { segmentId } })} />
        <Button label="View members" variant="secondary" disabled={isPending} onPress={() => router.push({ pathname: '/crm/segments/[segmentId]/members', params: { segmentId } })} />
      </View>
      <Section title={segment.name}>
        <DetailRow label="Description" value={segment.description} /><DetailRow label="Target type" value={segment.targetType} />
        <DetailRow label="Kind" value={segment.kind} /><DetailRow label="Status" value={segment.status} /><DetailRow label="Member count" value={segment.memberCount} />
        <DetailRow label="Folder ID" value={segment.folderId} /><DetailRow label="Form ID" value={segment.formId} />
        <DetailRow label="Track membership events" value={segment.trackMembershipEvents ? 'Yes' : 'No'} />
        <DetailRow label="Refresh interval (ms)" value={segment.refreshIntervalMs} /><DetailRow label="Last refreshed" value={segment.lastRefreshedAt} />
        <DetailRow label="Refreshing until" value={segment.refreshingUntil} /><DetailRow label="Created" value={segment.createdAt} /><DetailRow label="Updated" value={segment.updatedAt} />
      </Section>
      <Button label="Refresh segment" variant="secondary" loading={query.isFetching} disabled={isPending} onPress={() => void query.refetch()} />
      {segment.kind === 'active' ? <Button label="Convert to static" variant="secondary" disabled={isPending} onPress={() => { setError(undefined); setAction('convert'); }} /> : null}
      <Button label="Delete segment" variant="destructive" disabled={isPending} onPress={() => { setError(undefined); setAction('delete'); }} />
    </> : null}
    <Button label="Back to Segments" variant="ghost" disabled={isPending} onPress={() => router.replace('/crm/segments')} />
    <OptionSheet title={action === 'delete' ? 'Delete segment?' : 'Convert to static?'} visible={Boolean(action)} onClose={() => { if (!isPending) setAction(undefined); }} footer={<View className="gap-2">
      {error ? <Text accessibilityRole="alert">{error}</Text> : null}
      <Button label={action === 'delete' ? 'Confirm delete' : 'Confirm conversion'} variant={action === 'delete' ? 'destructive' : 'primary'} loading={isPending} onPress={() => void confirm()} />
      <Button label="Cancel" variant="secondary" disabled={isPending} onPress={() => setAction(undefined)} />
    </View>}><Text>{action === 'delete' ? `Delete ${segment?.name ?? 'this segment'}? It will no longer be available in your segments.` : 'This freezes the current membership and stops automatic filter-driven updates. Future membership changes will be manual.'}</Text></OptionSheet>
  </Screen>;
}
export function InvalidSegmentScreen() {
  return <Screen><ErrorState message="This segment link is invalid." /><Button label="Back to Segments" onPress={() => router.replace('/crm/segments')} /></Screen>;
}
