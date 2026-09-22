import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { ListState } from '@/components/ui';
import { eventsQueryOptions } from '@/modules/events';
import { checkoutsQueryOptions } from './queries';
import { checkoutListInput } from './utils';

function useDebouncedSearch(value: string) {
  const [search, setSearch] = useState(value.trim());
  useEffect(() => { const timer = setTimeout(() => setSearch(value.trim()), 300); return () => clearTimeout(timer); }, [value]);
  return { search, isSearchPending: value.trim() !== search };
}
export function useCheckoutsList() {
  const [controls, setControls] = useState<ListState>({ primaryFilter: 'all', search: '', filters: {}, sortField: 'createdAt', sortDirection: 'desc', page: 1, pageSize: 50 });
  const { search, isSearchPending } = useDebouncedSearch(controls.search);
  const query = useQuery({ ...checkoutsQueryOptions(checkoutListInput({ ...controls, search })), enabled: !isSearchPending });
  return { controls, setControls, query, isSearchPending };
}
export function useCheckoutEventSearch(enabled: boolean) {
  const [controls, setControls] = useState({ search: '', page: 0 });
  const { search, isSearchPending } = useDebouncedSearch(controls.search);
  const query = useQuery({ ...eventsQueryOptions({ search, page: controls.page, pageSize: 5, sortField: 'name', sortDirection: 'asc' }), enabled: enabled && !isSearchPending });
  return { query, isSearchPending, ...controls,
    setSearch: (value: string) => setControls({ search: value, page: 0 }),
    setPage: (page: number) => setControls(previous => ({ ...previous, page })),
  };
}
