# List controls

`ListToolbar` and `ListPagination` are controlled, domain-neutral components exported from `@/components/ui`. They use the existing serializable `ListState`; feature hooks own fetching, debounce, validation, and cache keys.

## Toolbar

- Search updates immediately and resets to page 1. The feature may debounce requests.
- Filter and sort buttons open an OptionSheet. Each opening copies the current selection into a draft.
- Choosing options only changes the draft. Apply commits the relevant fields and resets to page 1. Closing, tapping the backdrop, Escape, or Android back discards the draft.
- Filter Reset selects the first primary option and clears additional filters. Sort Reset selects the first sort option, descending. Reset stays staged until Apply.
- Active filters appear as removable chips. Removal applies immediately and resets the page.
- All radio choices, icon actions, and sheets have accessible names and state. Web Modal traps focus and restores it on close.

## Pagination

Existing total-based pagination remains supported:
```tsx
<ListPagination value={controls} onChange={setControls} totalItems={total} />
```

For APIs that return only `hasMore`, use:
```tsx
<ListPagination variant="compact" value={controls} onChange={setControls}
  hasMore={data.hasMore} isLoading={isFetching} onRefresh={refetch} />
```

Compact pagination shows the current page and Previous/Next actions, with an optional refresh action. It never invents a total count. The UI page is 1-based; API conversion belongs to the feature. Previous is disabled on page 1; Next is disabled when hasMore is false; navigation is disabled while loading.

Full pagination retains page-size choices, validated page entry, total/range information, and boundary checks. Its matching total must come from the same request as the displayed results.
