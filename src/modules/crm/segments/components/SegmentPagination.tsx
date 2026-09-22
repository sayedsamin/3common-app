import { ListPagination } from '@/components/ui';

export function SegmentPagination({ pageNumber = 0, pageSize = 20, hasMore, isLoading, onChange, onRefresh }: {
  pageNumber?: number; pageSize?: number; hasMore: boolean; isLoading: boolean;
  onChange: (input: { pageNumber: number; pageSize: number }) => void; onRefresh: () => void;
}) {
  return <ListPagination variant="compact" value={{ page: pageNumber + 1, pageSize, primaryFilter: 'all', search: '', filters: {}, sortField: '', sortDirection: 'desc' }}
    onChange={next => onChange({ pageNumber: next.page === undefined ? 0 : next.page - 1, pageSize: Math.min(next.pageSize ?? pageSize, 200) })}
    refreshLabel="Refresh results" hasMore={hasMore} isLoading={isLoading} onRefresh={onRefresh} />;
}
