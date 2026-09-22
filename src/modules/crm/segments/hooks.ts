import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { ListState } from '@/components/ui';
import { segmentListInput } from './list-filters';
import { segmentsQueryOptions, segmentMembersQueryOptions } from './queries';
import { segmentMembersInputSchema, type SegmentMembersInput } from './schemas';

function useDebouncedSearch(search = '') {
  const [debounced, setDebounced] = useState(search.trim());
  useEffect(() => { const timer = setTimeout(() => setDebounced(search.trim()), 300); return () => clearTimeout(timer); }, [search]);
  return { search: debounced, isSearchPending: debounced !== search.trim() };
}
export function useSegmentsList() {
  const [controls, setControls] = useState<ListState>({ primaryFilter: 'all', search: '', filters: {}, sortField: 'createdAt', sortDirection: 'desc', pageSize: 20, page: 1 });
  const { search, isSearchPending } = useDebouncedSearch(controls.search);
  const query = useQuery({ ...segmentsQueryOptions(segmentListInput({ ...controls, search })), enabled: !isSearchPending });
  return { controls, setControls, query, isSearchPending };
}
export function useSegmentMembers(id: string) {
  const [input, setInput] = useState<SegmentMembersInput>({});
  const { search, isSearchPending } = useDebouncedSearch(input.search);
  const values = segmentMembersInputSchema.parse({ ...input, search });
  const query = useQuery({ ...segmentMembersQueryOptions(id, values), enabled: !isSearchPending });
  return { input, query, isSearchPending,
    change: (changes: SegmentMembersInput) => setInput(previous => ({ ...previous, ...changes, pageNumber: changes.pageNumber ?? 0 })) };
}
