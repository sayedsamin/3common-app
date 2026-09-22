import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { ListState } from '@/components/ui';
import { emailsInputSchema } from './contracts';
import { emailsQueryOptions } from './queries';
export function useEmailsList() {
  const [controls, setControls] = useState<ListState>({ primaryFilter: 'all', search: '', filters: {}, sortField: 'updatedAt', sortDirection: 'desc', pageSize: 20, page: 1 });
  const [search, setSearch] = useState('');
  useEffect(() => { const timer = setTimeout(() => setSearch(controls.search.trim()), 300); return () => clearTimeout(timer); }, [controls.search]);
  const input = emailsInputSchema.parse({ pageNumber: controls.page - 1, pageSize: controls.pageSize, view: controls.primaryFilter === 'all' ? undefined : controls.primaryFilter, search, sortField: controls.sortField, sortDirection: controls.sortDirection });
  const isSearchPending = search !== controls.search.trim(); const query = useQuery({ ...emailsQueryOptions(input), enabled: !isSearchPending });
  return { controls, setControls, query, isSearchPending };
}
