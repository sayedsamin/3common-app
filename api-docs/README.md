# Extract API modules

Run from the repository root with one or more endpoint tag names:

```sh
node api-docs/extract-tags.mjs Events
node api-docs/extract-tags.mjs Events Contacts
node api-docs/extract-tags.mjs "Image Assets" "Payment methods"
```

Tag matching ignores case and repeated tags. Quote names containing spaces.
Unknown tags print the available names and exit without writing a file.

The script reads `docs.json` beside itself and writes one combined, formatted
OpenAPI document in this folder, for example `docs.events.json` or
`docs.contacts+events.json`. Filenames use alphabetically sorted tag slugs;
rerunning the same selection replaces its generated file. The source stays intact.
Paths resolve relative to the script, so it also works from another directory.

Output includes matching operations, their full parameter/request/response
validation schemas, path metadata, API metadata, and security requirements.
Referenced components and their transitive dependencies are included, including
recursive schemas and security schemes. Unused components and operations are
removed. Validation schemas retain their original OpenAPI format.

Tags are discovered from endpoints, including those missing from the source's
top-level tag list. The extractor supports local component references used by
this API; unsupported or missing references fail before output is written.
