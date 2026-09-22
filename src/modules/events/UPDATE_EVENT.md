# Updating events

Open an event and choose **Edit event**. `/events/[eventId]/edit` loads that event independently, including for deep links, and uses the same protected navigation as event details. The editor supports every field in the [Update Event contract](https://help.3common.com/rest-api/events/update-event/).

React Hook Form owns the draft. Only values changed from that draft's starting values are sent to `PATCH /v1/events/{id}`. Missing read fields do not silently become false or empty updates. In particular, `collectEmails` is not returned by the read contract: Checkout defaults to **Leave unchanged**. Setting it to Disabled sends `collectEmails: false`, which prevents orders.

Read/write mappings are explicit: `isPublic` becomes `privacy`, `isVirtual` becomes `eventType`, and `location.address` becomes `address`. Dates accept UTC date/time text or ISO timestamps with offsets and are sent as UTC ISO timestamps. The resulting start/end range is checked even when only one bound changes. Individual multi-date sessions are read-only because this endpoint does not support updating their time arrays.

Description blocks preserve IDs, HTML, order, and media URLs; users may add, remove, reorder, and edit them. Legacy description content remains intact unless edited. Removing every block sends an empty array. Tags use one line per tag to preserve commas inside existing tag names. Custom terms include all four properties required by the update contract when that object changes.

Saves use the authenticated shared API client, never retry automatically, and do not queue for reconnection. Duplicate submissions are blocked. A successful response must contain the requested event ID; it updates detail cache and invalidates event lists and details. Failed saves retain the draft. Validated field errors appear at their inputs with a form-level fallback. An ambiguous transport/response failure asks the user to check the event before retrying.

Navigation away from an unsaved draft offers Keep editing or Discard changes. Browser refresh/close also registers an unsaved-changes warning. The editor keeps save controls outside its scroll region and supports keyboard avoidance, font scaling, and both themes.
