# Shared API requests

Feature `api.ts` files call `apiRequest('events/?status=draft', { signal })` and validate the returned `unknown` with their domain schemas. Requests use the configured API root and current Bearer key. Pass TanStack Query's signal to support cancellation.

Errors follow https://help.3common.com/rest-api/errors/:

The nested `{ error: { code, message, details } }` response documented by `api-docs/docs.events.json` is also supported. HTTP status remains authoritative for either envelope.

- `ApiError.code`: local category such as `validation`, `unauthenticated`, `forbidden`, `conflict`, `rate_limit`, or `server`.
- `status`: actual HTTP status; this takes precedence over the response body.
- `serverCode`: the envelope's stable `error` string. Switch on this for backend-specific behavior; unknown codes are preserved.
- `message`: safe display text, with a fallback for malformed or non-JSON errors.
- `serverMessage` and `details`: validated envelope values for deliberate use by feature forms. Detail values remain `unknown` because the API does not document a universal field-error shape; validate them in the owning module before mapping them to form fields. Never log these fields or send them to Sentry.
- `retryAfterMs`: parsed `Retry-After` delay, supporting seconds and HTTP dates.

The request helper performs one request. The shared QueryClient retries GET/HEAD queries at most twice for network failures, timeouts, HTTP 429, and 5xx responses. Delays use exponential backoff (1s, 2s), waiting at least as long as Retry-After. Delays beyond the JavaScript timer limit surface the error without automatic retry. Other failures, including authentication, authorization, validation, cancellation, and malformed responses, are not retried. Mutations do not retry by default. Explicit query/client options may override these defaults.

Keys, request headers, bodies, and raw responses are never attached to errors. `serverMessage` and `details` are non-enumerable to avoid accidental JSON serialization; this is not a substitute for keeping them out of logs and telemetry.
