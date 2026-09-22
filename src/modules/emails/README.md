# Marketing emails

The email module implements the ten campaign endpoints in `api-docs/docs.email.json`. The Page builder uses `api-docs/docs.pages.json`; registered image reads follow `api-docs/docs.json`.

`contracts.ts` files contain generated Zod boundary schemas. Regenerate both modules with `node scripts/generate-marketing-contracts.cjs`. The generator follows structural schemas, including nullable cursor types and structured rich text, rather than conflicting descriptive HTML examples.

Campaign settings and Page operations save separately. Existing pages are copied before editing. New blocks occupy one full-width section each. Complex layouts, legacy content, unsupported marks, and other element types are preserved. The builder supports paragraphs/headings, bold/italic/link selections, registered images and buttons; it does not upload assets or edit attachments.

Writes have no retries or offline queue. When a block write fails, the editor reloads the Page and retains the insertion target to avoid repeating an acknowledged section or an element whose response was lost. Creation/copy errors without a returned ID require checking the page picker before another attempt; the API has no documented idempotency key.

Email and activity pages use zero-based `pageNumber`; delivery events use opaque cursors. Pages and images use zero-based `page`. Schedule input is interpreted in the device timezone and sent as UTC. The backend remains authoritative for send/schedule prerequisites. Activity refresh only reloads stored activity; synchronization and extra reporting endpoints are outside this feature.

Verification uses mocked network requests only. Do not dispatch real campaigns as a smoke test.
