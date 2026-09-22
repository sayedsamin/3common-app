import { useState } from 'react';
import { View } from 'react-native';
import { Button } from '../Button';
import { Input } from '../Input';
import { Text } from '../Text';
import { IconButton } from '../IconButton';
import type { ListState } from './types';

type KnownTotalProps = {
  value: ListState;
  onChange: (value: ListState) => void;
  /** Matching result count from the same query as the displayed page. */
  totalItems: number;
  pageSizeOptions?: readonly number[];
  isLoading?: boolean;
  variant?: 'full';
};
type CompactProps = { variant: 'compact'; value: ListState; onChange: (value: ListState) => void; hasMore: boolean; isLoading?: boolean; onRefresh?: () => void };
export type ListPaginationProps = KnownTotalProps | CompactProps;

export function ListPagination(props: ListPaginationProps) {
  if (props.variant === 'compact') return <View className="flex-row flex-wrap items-center justify-between gap-2 py-3">
    <View className="flex-row items-center gap-1"><Text variant="caption">Page {props.value.page}</Text>
      {props.onRefresh ? <IconButton label="Refresh events" icon="refresh" loading={props.isLoading} onPress={props.onRefresh} /> : null}
    </View>
    <View className="flex-row gap-2"><Button label="Previous" size="compact" variant="ghost" leadingIcon="chevron-left" disabled={props.isLoading || props.value.page <= 1} onPress={() => props.onChange({ ...props.value, page: props.value.page - 1 })} />
      <Button label="Next" size="compact" variant="secondary" trailingIcon="chevron-right" disabled={props.isLoading || !props.hasMore} onPress={() => props.onChange({ ...props.value, page: props.value.page + 1 })} />
    </View>
  </View>;
  return <KnownTotalPagination {...props} />;
}
function KnownTotalPagination({ value, onChange, totalItems, pageSizeOptions = [10, 25, 50, 100], isLoading = false }: KnownTotalProps) {
  const [isSizeOpen, setIsSizeOpen] = useState(false);
  const [pageDraft, setPageDraft] = useState<string | null>(null);
  const total = Math.max(0, Math.floor(totalItems));
  const size = Math.max(1, Math.floor(value.pageSize));
  const pageCount = Math.max(1, Math.ceil(total / size));
  const page = Math.max(1, Math.min(value.page, pageCount));
  const sizes = [...new Set([...pageSizeOptions, size])].filter((item) => Number.isInteger(item) && item > 0).sort((a, b) => a - b);
  const isValidPage = pageDraft === null || (/^\d+$/.test(pageDraft) && Number(pageDraft) >= 1 && Number(pageDraft) <= pageCount);
  function changePage(next: number) {
    setPageDraft(null);
    onChange({ ...value, page: next });
  }
  function submitPage() {
    if (isValidPage && !isLoading) changePage(Number(pageDraft ?? page));
  }

  return (
    <View className="gap-3 rounded-card bg-surface p-3">
      <View className="flex-row flex-wrap items-center justify-between gap-3">
        <Text variant="muted" accessibilityLiveRegion="polite">
          {isLoading ? 'Loading results…' : total === 0 ? '0 items' : `${(page - 1) * size + 1}–${Math.min(page * size, total)} of ${total} items`}
        </Text>
        <Button label={`Items per page: ${size}`} variant="secondary" disabled={isLoading}
          accessibilityState={{ expanded: isSizeOpen }} onPress={() => setIsSizeOpen(!isSizeOpen)} />
        <View className="flex-row flex-wrap items-end gap-2">
          <Button label="Previous" variant="secondary" disabled={isLoading || page <= 1} onPress={() => changePage(page - 1)} />
          <View className="min-w-24">
            <Input label={`Page (of ${pageCount})`} accessibilityLabel="Page number" value={pageDraft ?? String(page)}
              onChangeText={setPageDraft} keyboardType="number-pad" returnKeyType="go" disabled={isLoading || total === 0}
              onSubmitEditing={submitPage} error={isValidPage ? undefined : `Enter 1–${pageCount}`} />
          </View>
          <Button label="Go" variant="secondary" disabled={isLoading || total === 0 || !isValidPage} onPress={submitPage} />
          <Button label="Next" variant="secondary" disabled={isLoading || page >= pageCount} onPress={() => changePage(page + 1)} />
        </View>
      </View>
      {isSizeOpen ? <View className="flex-row flex-wrap gap-2">
        {sizes.map((nextSize) => <Button key={nextSize} label={String(nextSize)} accessibilityLabel={`${nextSize} items per page`}
          variant={size === nextSize ? 'primary' : 'secondary'} accessibilityState={{ selected: size === nextSize }} disabled={isLoading}
          onPress={() => { setPageDraft(null); setIsSizeOpen(false); onChange({ ...value, pageSize: nextSize, page: 1 }); }} />)}
      </View> : null}
    </View>
  );
}
