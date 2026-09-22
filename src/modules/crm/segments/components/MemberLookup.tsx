import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { View } from 'react-native';
import { Button, FilterSelect, OptionSheet, Text } from '@/components/ui';
import { segmentsByMemberQueryOptions } from '../queries';
import { segmentsByMemberInputSchema, targetTypeSchema, type SegmentsByMemberInput, type TargetType } from '../schemas';
import { MemberInput } from './MemberInput';
import { SegmentQueryState } from './SegmentQueryState';
import { SegmentRow } from './SegmentRow';

function LookupResults({ input, onNavigate }: { input: SegmentsByMemberInput; onNavigate: () => void }) {
  const query = useQuery(segmentsByMemberQueryOptions(input));
  return <View className="gap-2"><SegmentQueryState query={query} label="member segments" />
    {query.data?.map(segment => <SegmentRow key={segment.id} item={segment} onNavigate={onNavigate} />)}
    {query.data?.length === 0 ? <Text>No segments contain this member.</Text> : null}
    <Button label="Refresh member segments" variant="secondary" loading={query.isFetching} onPress={() => void query.refetch()} />
  </View>;
}
export function MemberLookup() {
  const [isOpen, setIsOpen] = useState(false);
  const [target, setTarget] = useState<TargetType | 'all'>('all');
  const [memberId, setMemberId] = useState('');
  const [input, setInput] = useState<SegmentsByMemberInput>();
  const [error, setError] = useState<string>();
  return <>
    <Button label="Find by member" accessibilityLabel="Find segments by member" leadingIcon="account-search-outline" variant="secondary" onPress={() => setIsOpen(true)} />
    <OptionSheet title="Find segments by member" visible={isOpen} onClose={() => setIsOpen(false)}>
      <View className="gap-3">
        <FilterSelect label="Target type" value={target} options={[{ value: 'all', label: 'All targets' }, ...targetTypeSchema.options.map(value => ({ value, label: value }))]} onChange={value => { setTarget(value); setMemberId(''); setInput(undefined); setError(undefined); }} />
        <MemberInput targetType={target === 'all' ? undefined : target} value={memberId} onChange={value => { setMemberId(value); setInput(undefined); setError(undefined); }} error={error} />
        <Button label="Find segments" onPress={() => {
          const parsed = segmentsByMemberInputSchema.safeParse({ memberId, targetType: target === 'all' ? undefined : target });
          if (!parsed.success) { setError('Choose a member or enter a valid 24-character member ID.'); return; }
          setError(undefined); setInput(parsed.data);
        }} />
        {isOpen && input ? <LookupResults input={input} onNavigate={() => setIsOpen(false)} /> : null}
      </View>
    </OptionSheet>
  </>;
}
