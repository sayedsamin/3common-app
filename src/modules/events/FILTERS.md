# Event list filters

The filter sheet stages changes until Apply. Cancel discards the draft; Reset clears status, both date bounds, and advanced conditions. Applying or removing a filter returns to page one. Search remains debounced and all filtering runs on the server.

Start dates accept YYYY-MM-DD or an ISO timestamp with an explicit timezone. A date without a time uses UTC midnight for the lower bound and the end of the UTC day for the upper bound. Invalid dates, reversed ranges, empty groups, and incomplete conditions block Apply with an accessible explanation.

Advanced conditions support nested AND/OR groups and every operator family documented by [List Events](https://help.3common.com/rest-api/events/list-events/). Text/select lists use comma-separated values; numeric values remain numbers, and ranges use `{start, end}`. The documented sales filter uses `ticketSum`. Other field allows entering additional backend field names with an explicit value type. Unsupported field names remain subject to server validation.

The API boundary sends `startAfter`, `startBefore`, and a JSON-encoded `filters` array. Query keys include these values. `fields` is a response projection rather than a filter; it remains omitted so list/detail data is not truncated. Pagination continues to use `hasMore` without inferred totals.

Tests cover request encoding, cache separation, validation, staged edits, dismissal, pagination reset, removal, reset, and operator value conversion.
