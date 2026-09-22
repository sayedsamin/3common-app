import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { ListState } from '@/components/ui';
import { eventsInputSchema } from './schemas';
import { eventsQueryOptions } from './queries';

const initialControls: ListState = { primaryFilter: 'all', search: '', filters: {}, sortField: 'start', sortDirection: 'desc', pageSize: 20, page: 1 };

export function useEventsList() {
  const [controls, setControls] = useState(initialControls);
  const [search, setSearch] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => setSearch(controls.search.trim()), 300);
    return () => clearTimeout(timer);
  }, [controls.search]);
  const isSearchPending = search !== controls.search.trim();
  const input = eventsInputSchema.parse({
    page: controls.page - 1, pageSize: controls.pageSize, search,
    status: controls.primaryFilter === 'all' ? undefined : controls.primaryFilter,
    sortField: controls.sortField, sortDirection: controls.sortDirection,
  });
  const query = useQuery({ ...eventsQueryOptions(input), enabled: !isSearchPending });
  return { controls, setControls, query, isSearchPending };
}
