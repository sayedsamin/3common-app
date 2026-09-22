# List controls

Use `ListToolbar` above a list and `ListPagination` below it. Both are controlled components exported from `@/components/ui`. They share a serializable `ListState`; each feature owns that state and applies it to its query. The controls never fetch or copy records.

```tsx
const [controls, setControls] = useState<ListState>({
  primaryFilter: 'all',
  search: '',
  filters: {},
  sortField: 'name',
  sortDirection: 'asc',
  pageSize: 25,
  page: 1,
});

<ListToolbar
  value={controls}
  onChange={setControls}
  primaryOptions={[{ value: 'all', label: 'All' }, { value: 'active', label: 'Active' }]}
  searchPlaceholder="Search names…"
  filters={[{ key: 'location', label: 'Location', options: [{ value: 'online', label: 'Online' }] }]}
  sortOptions={[{ value: 'name', label: 'Name' }, { value: 'createdAt', label: 'Created' }]}
/>
// Render the feature's FlashList and loading/error/empty states here.
<ListPagination
  value={controls}
  onChange={setControls}
  totalItems={matchingTotal}
  isLoading={isFetching}
  pageSizeOptions={[10, 25, 50, 100]}
/>
```

- Primary options appear in a horizontally scrollable row. The search and action row wraps on smaller screens.
- Additional filters each select one value, combined by the feature's query. Empty values are reserved for “Any”; active filters can be cleared together.
- Search, filter, sort and page-size changes reset to page 1. Sort direction can be reversed independently of the field.
- Pagination shows the matching item range, page number, direct page entry, previous/next, and page-size choices. Invalid page entries cannot be submitted.
- Include every control in query keys and request parameters. Debounce search in the module hook when needed. Use backend pagination for remote collections; never filter only the visible page.
- Provide the matching total from the same query as the displayed records. When deletion or refetch reduces the total, reconcile an out-of-range page in the feature hook and fetch that page. Pagination bounds its display but does not initiate requests or mutate parent state during render.
- Validate URL/restored controls with the feature's Zod schema. Supply a positive integer page/page size, a nonnegative finite total, and valid option values. Keep shareable controls in Expo Router parameters when appropriate.

Saved views and column visibility are separate capabilities and are not part of these controls.
