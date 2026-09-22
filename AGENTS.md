This is an Expo/React Native mobile application. Prioritize mobile-first patterns, performance, and cross-platform compatibility.

## Expo has changed — do not trust your training data

Expo ships breaking changes every SDK release. APIs you remember are likely renamed, moved, or removed. Before writing any code that touches an Expo, EAS, or React Native API:

1. Read the major version of the `expo` package in `package.json`.
2. Fetch the matching versioned docs: `https://docs.expo.dev/versions/v<major>.0.0/`
3. For anything else, fetch https://docs.expo.dev/llms.txt — an index of all Expo docs with corrections to common LLM misconceptions. Follow its links to the specific page you need; never answer from memory.

## Commands

Use `bunx` instead of `npx` if the project uses bun (`bun.lock` present).

```bash
npx expo install <package>  # ALWAYS use instead of npm/yarn/pnpm/bun add — resolves SDK-compatible versions
npx expo start              # start the dev server
npx expo lint               # lint
npx tsc --noEmit            # typecheck
npx expo-doctor             # diagnose dependency and config issues
npx expo install --fix      # fix incompatible package versions
```

Run lint and typecheck before declaring any task done.

## Navigation & Routing

- Use **Expo Router** for all navigation. Routes live in `src/app/` — every file there is a screen, `_layout.tsx` files define navigators. Keep non-route code (components, hooks, utils) outside `src/app/`.
- Import `Link`, `router`, and `useLocalSearchParams` from `expo-router`.
- Docs: https://docs.expo.dev/router/introduction.md

## Rules

- If `ios/` and `android/` directories do not exist, they are generated (Continuous Native Generation). Never create or edit them by hand — configure native behavior in `app.json` and config plugins.
- Expo Go only includes its bundled native modules. After adding a library with native code, the app needs a development build: `npx expo run:ios|android` locally, or `eas build --profile development`.
- Prefer recommended Expo modules over third-party libraries, and check your available skills before adding dependencies. Docs: https://docs.expo.dev/versions/latest/index.md


# Expo Application Engineering Guide

## Purpose

This repository is an Expo SDK 57 application built with React Native, React 19, TypeScript, and Expo Router. Organize product code by feature, keep route files thin, and preserve clear boundaries between server state, client state, device storage, and presentation.

The architecture should remain useful on Android, iOS, and web. Platform-specific implementations are allowed when the platform genuinely requires them, but feature ownership and public APIs should remain consistent.

## Installed Stack

Use the packages already installed in this project before adding alternatives:

- Expo Router for file-based navigation, layouts, deep links, route groups, and protected navigation.
- TanStack Query for remote/server state, caching, retries, invalidation, and mutations.
- Zustand for small amounts of synchronous global client state.
- React Hook Form and Zod for forms and runtime validation.
- Uniwind, Tailwind CSS, `class-variance-authority`, `clsx`, and `tailwind-merge` for styling and variants.
- `@expo/ui` and shared primitives in `src/components/ui` for reusable interface elements.
- `@rn-primitives/portal` and `@rn-primitives/slot` when building shared overlays or composable primitives.
- Expo Image for application images.
- FlashList for long or performance-sensitive lists.
- Expo SecureStore for small secrets such as session or refresh tokens.
- Expo SQLite for structured offline or persistent application data.
- Expo Notifications for push notification registration and handling.
- Sentry for production error and performance reporting.
- React Native Testing Library for component behavior tests.

Do not install a second router, server-state library, form library, validation library, styling system, secure key-value store, image component, or large-list implementation unless the existing choice cannot meet a documented requirement.

## Required Project Structure

Use this structure as the default. Create optional files and directories only when a feature needs them.

```txt
.
├── assets/
│   ├── fonts/
│   ├── icons/
│   └── images/
├── src/
│   ├── app/
│   │   ├── _layout.tsx
│   │   ├── +not-found.tsx
│   │   ├── (auth)/
│   │   │   ├── _layout.tsx
│   │   │   ├── sign-in.tsx
│   │   │   ├── sign-up.tsx
│   │   │   └── forgot-password.tsx
│   │   ├── (app)/
│   │   │   ├── _layout.tsx
│   │   │   ├── (tabs)/
│   │   │   │   ├── _layout.tsx
│   │   │   │   ├── index.tsx
│   │   │   │   ├── events.tsx
│   │   │   │   ├── people.tsx
│   │   │   │   └── settings.tsx
│   │   │   ├── events/
│   │   │   │   ├── [eventId].tsx
│   │   │   │   ├── new.tsx
│   │   │   │   └── [eventId]/edit.tsx
│   │   │   └── modals/
│   │   │       └── example.tsx
│   │   └── oauth/
│   │       └── callback.tsx
│   ├── components/
│   │   └── ui/
│   │       ├── Button.tsx
│   │       ├── Input.tsx
│   │       ├── Text.tsx
│   │       ├── Screen.tsx
│   │       ├── EmptyState.tsx
│   │       ├── ErrorState.tsx
│   │       ├── LoadingState.tsx
│   │       └── index.ts
│   ├── modules/
│   │   └── {moduleName}/
│   │       ├── api.ts
│   │       ├── queries.ts
│   │       ├── mutations.ts
│   │       ├── schemas.ts
│   │       ├── hooks.ts
│   │       ├── store.ts
│   │       ├── storage.ts
│   │       ├── types.ts
│   │       ├── utils.ts
│   │       ├── components/
│   │       ├── screens/
│   │       ├── __tests__/
│   │       └── index.ts
│   ├── providers/
│   │   ├── AppProviders.tsx
│   │   ├── QueryProvider.tsx
│   │   └── SessionProvider.tsx
│   ├── lib/
│   │   ├── api-client.ts
│   │   ├── env.ts
│   │   ├── query-client.ts
│   │   ├── sentry.ts
│   │   └── cn.ts
│   ├── storage/
│   │   ├── secure-store.ts
│   │   └── database/
│   │       ├── client.ts
│   │       ├── migrations.ts
│   │       └── schema.ts
│   ├── hooks/
│   ├── constants/
│   ├── types/
│   └── test/
│       ├── render.tsx
│       ├── fixtures/
│       └── mocks/

├── src/global.css

```

The route names above illustrate the intended layout; replace product areas such as `events` and `people` with the real modules in this app. Do not create placeholder routes or empty module files merely to match the example.

## Architectural Principles

- Organize product code by feature first under `src/modules/{moduleName}`.
- A module owns its network calls, query definitions, mutations, validation, feature state, feature storage, components, and screens.
- Keep related behavior and presentation together so a module can be moved or refactored without searching through unrelated folders.
- Promote code to a shared directory only after it is genuinely reused by multiple modules.
- Keep dependencies flowing inward: `app` may import modules; modules may import shared infrastructure and UI; shared code must not import module internals.
- Avoid generic `services`, `helpers`, or `components` dumping grounds.
- Prefer named exports throughout `src`. Use a default export only where Expo Router requires a route component.
- Use TypeScript in strict mode. Do not use `any`, unsafe casts, or non-null assertions to bypass modeling problems.

## Expo Router App Shell

The `src/app/` directory owns navigation only. Route files may:

- Declare stacks, tabs, modals, headers, and route options.
- Read and validate route parameters.
- Apply authentication or authorization gates.
- Compose a screen exported by a feature module.
- Translate a route event into a typed module input.

Route files should not:

- Implement feature UI or business rules.
- Call `fetch`, an SDK client, SecureStore, or SQLite directly.
- Define TanStack Query queries or mutations.
- Contain large forms, lists, or page layouts.
- Become the canonical home of a type used by a module.

A route should normally be only a thin adapter:

```tsx
export { EventsListScreen as default } from '#/modules/events'
```

For a parameterized route, validate `useLocalSearchParams()` with the module's Zod route schema before passing values to the screen. Never assume a route parameter is a single valid string; deep links and web URLs are untrusted input.

Use Expo Router notation consistently:

- Parentheses for URL-transparent route groups, such as `(auth)` and `(app)`.
- Square brackets for dynamic segments, such as `[eventId]`.
- `_layout.tsx` for navigator and provider boundaries.
- `+not-found.tsx` for unmatched routes.

Use Expo Router protected routes in the appropriate layout for authentication and permission gates. A client-side route guard improves navigation behavior but does not replace backend authorization. Do not import navigation APIs from external `@react-navigation/*` packages; use the matching Expo Router exports supported by the installed SDK.

Keep the root `src/app/_layout.tsx` limited to application initialization, providers, splash-screen coordination, global overlays, and the root navigator. Put provider composition in `src/providers/AppProviders.tsx` so the layout stays readable and tests can reuse the same provider boundary.

## Module File Contract

Each module follows this contract when the file is needed.

### `api.ts`

- Own actual request functions and response mapping for the module.
- Call the shared API client from `src/lib/api-client.ts` rather than duplicating base URLs, headers, JSON parsing, timeouts, or error normalization.
- Validate untrusted responses with Zod at the boundary when the backend client does not already guarantee the runtime shape.
- Accept typed arguments and return domain data; do not expose raw `Response` objects to screens.
- Must not contain JSX, React hooks, query hooks, navigation, or screen layout.

### `queries.ts`

- Own TanStack Query keys, query factories, and `queryOptions()` definitions for module reads.
- Call module `api.ts`; never call `fetch` or an external client directly.
- Build query keys from every input that changes the result.
- Keep keys hierarchical and serializable so broad or targeted invalidation is predictable.
- Define intentional `staleTime`, retry, and enablement behavior where defaults are not appropriate.
- Must not contain JSX, mutation hooks, navigation, or Zustand state.

### `mutations.ts`

- Own TanStack Query write hooks and mutation options.
- Call module `api.ts` and invalidate or update the relevant query keys.
- Use optimistic updates only when rollback behavior is explicit and tested.
- Keep mutation side effects such as cache updates here; keep navigation and toast decisions in the calling hook or screen when they are presentation concerns.
- Must not contain raw request implementations, JSX, or route definitions.

### `schemas.ts`

- Own Zod schemas for forms, route parameters, filters, API payloads, notification data, and persisted data.
- Infer types from schemas instead of declaring duplicate interfaces.
- Treat network data, deep links, notification payloads, SQLite rows, and restored persisted state as untrusted.
- Keep user-facing validation messages suitable for display by the form layer.
- Must not contain components, navigation, or network calls.

### `hooks.ts`

- Own feature orchestration hooks that compose queries, mutations, forms, permissions, pagination, focus behavior, or derived state.
- Keep effects narrow and clean up subscriptions, listeners, timers, and notification handlers.
- Must not call raw `fetch`, external clients, SecureStore, or SQLite directly.
- Must not return large blocks of JSX.

### `store.ts`

- Own optional module-local Zustand stores for synchronous client-only state shared across distant components.
- Store ephemeral UI or workflow state, not remote records already owned by TanStack Query.
- Export focused selectors; avoid subscribing a component to the entire store.
- Keep actions beside the state they update.
- Add persistence only for a documented product requirement and validate restored data.

### `storage.ts`

- Own module-specific persistence operations and repositories.
- May call shared SecureStore or SQLite infrastructure from `src/storage`.
- Keep SQL, table mapping, and persistence keys out of components and hooks.
- Must not contain JSX, navigation, or query hooks.

### `types.ts`

- Own module-specific TypeScript types that cannot be inferred from Zod schemas or generated API types.
- Prefer discriminated unions for async and workflow states.
- Must not contain runtime logic.

### `utils.ts`

- Own pure feature helpers such as formatting, normalization, sorting, grouping, and mapping.
- Helpers should be deterministic and easy to unit test.
- Must not contain hooks, mutable global state, device APIs, or network calls.

### `screens/`

- Own route-level feature views.
- Compose feature hooks, queries, mutations, and components into user-facing screens.
- Handle screen-level loading, error, empty, refreshing, offline, and success states.
- Use `Screen` or another shared safe-area/layout primitive instead of repeating root layout markup.
- Must not call `api.ts`, SecureStore, SQLite, or `fetch` directly.

### `components/`

- Own feature-specific presentational components and workflows.
- Prefer props for data and callbacks; use module hooks where doing so keeps a cohesive feature boundary.
- Must not define routes or call `api.ts` directly.
- Move a component to `src/components/ui` only when it is domain-neutral and reused across modules.

### `index.ts`

- Define the module's intentional public API for routes and other modules.
- Export screens, public types, and explicitly reusable module capabilities.
- Do not re-export every internal query key, helper, or storage implementation by default.

## Data and State Flow

All remote reads and writes should follow this path:

```txt
route
  -> module screen/component
  -> module hook/query/mutation
  -> module api.ts
  -> shared API client
  -> backend
```

Persistent device data should follow this path:

```txt
screen/component
  -> module hook
  -> module storage.ts
  -> src/storage SecureStore or SQLite adapter
```

Use the correct owner for each kind of state:

- TanStack Query: backend data and asynchronous server state.
- React Hook Form: in-progress form values, validation, dirty state, and submission state.
- Expo Router: navigation state and shareable/deep-linkable route parameters.
- Zustand: cross-screen client state that is neither server data nor form state.
- Local component state: transient state used by one small component subtree.
- SecureStore: small sensitive values such as tokens or keys.
- SQLite: structured offline records, queues, indexes, and larger persistent datasets.

Do not mirror the same records into TanStack Query and Zustand. Do not use SecureStore as a general database. Do not place secrets in Zustand persistence, AsyncStorage-like storage, route parameters, logs, or Sentry context.

## TanStack Query on React Native

- Create one `QueryClient` in `src/lib/query-client.ts`; do not construct it during render.
- Mount one `QueryClientProvider` through `QueryProvider`.
- Integrate app foreground/background state with TanStack Query's `focusManager` when refetch-on-focus behavior is required.
- Integrate device connectivity with `onlineManager` when reliable offline/reconnect behavior is required.
- Use pull-to-refresh by calling a query's `refetch`; do not create a duplicate request path.
- Prefer cursor or page-based `useInfiniteQuery` data as the source for FlashList pagination.
- Cancel obsolete queries where appropriate and avoid race-prone manual fetching effects.
- Clear user-specific cached data during sign-out or account/tenant changes.

## Authentication and Sensitive Data

- Keep session orchestration in `src/providers/SessionProvider.tsx` and the auth module.
- Store only the minimum token material required by the authentication design in SecureStore.
- Never store passwords, private service credentials, Sentry auth tokens, or backend secrets in the client application.
- Treat `EXPO_PUBLIC_*` values as public because they are embedded in the client bundle.
- Access public environment values through a validated `src/lib/env.ts` module, using static dot notation such as `process.env.EXPO_PUBLIC_API_URL`.
- Redact authorization headers, tokens, personal data, and notification contents from logs and Sentry breadcrumbs.
- Enforce resource permissions on the backend even when screens and routes are hidden in the app.
- Clear sensitive module state, Query caches, and local persistence as required when a session ends.

## Forms and Validation

- Use React Hook Form for non-trivial forms and Zod as the source of truth for validation.
- Keep the schema in the owning module's `schemas.ts` and infer the form data type from it.
- Since a separate resolver package is not assumed, validate through an installed resolver only if present; otherwise use a small typed adapter or explicit `safeParse` in the submit path.
- Normalize values at a clear boundary. Do not scatter trimming, date conversion, or empty-string handling across controls.
- Map backend field errors back to the relevant inputs and provide a form-level fallback for unknown failures.
- Disable duplicate submissions and preserve user-entered data after recoverable errors.
- Use accessible labels, hints, and error announcements rather than relying on placeholder text alone.

## Shared UI and Styling

- Reuse primitives from `src/components/ui` before writing repeated Uniwind class lists in screens.
- Import shared UI through its barrel, for example `#/components/ui`.
- Prefer semantic primitives such as `Button`, `Input`, `Text`, `Screen`, `EmptyState`, `ErrorState`, and `LoadingState`.
- Use `@expo/ui` where it provides the desired native behavior and its platform support matches the requirement. Wrap it behind a shared primitive when the app needs a stable cross-platform API.
- Use React Native primitives for layout and accessibility. Do not use DOM elements outside deliberately web-only files.
- Use Uniwind `className` styling and semantic design tokens. Avoid one-off hard-coded color palettes in feature screens.
- Use `class-variance-authority` for typed component variants and a shared `cn()` helper composed from `clsx` and `tailwind-merge`.
- Keep styles near a component when they are unique; promote tokens and reusable variants to the shared UI layer.
- Respect safe areas, dynamic font scaling, reduced motion, keyboard avoidance, color scheme, and minimum touch target sizes.
- Avoid platform checks scattered through render trees. Use `Component.ios.tsx`, `Component.android.tsx`, and `Component.web.tsx` when implementations materially differ.

## Images, Lists, and Performance

- Use Expo Image for remote and application images unless a platform API specifically requires another component.
- Always provide stable dimensions or aspect ratios to avoid layout shifts.
- Use FlashList for long, paginated, or frequently updating collections; use a simple mapped view only for short static content.
- Provide stable keys and memoize expensive row work, but do not add memoization without a measurable or obvious benefit.
- Keep item renderers outside the parent render body when practical.
- Avoid nested virtualized lists with the same orientation.
- Paginate backend collections rather than downloading unbounded datasets.
- Keep animations on supported Reanimated paths and respect reduced-motion preferences.

## Notifications and Linking

- Keep notification permission requests, device registration, listeners, and token synchronization in a dedicated notifications module.
- Do not request notification permission on initial launch without user context; request it at a meaningful point in the product flow.
- Validate notification payloads with Zod before routing or acting on them.
- Centralize notification-to-route mapping. Do not duplicate deep-link parsing across screens.
- Treat incoming URLs and notification data as untrusted and confirm authorization after navigation.
- Clean up notification response and foreground listeners in effects.
- Keep platform entitlements, capabilities, and config plugins in `app.config.ts`, not feature components.

## SQLite and Offline Behavior

- Centralize database initialization, migrations, and connection access in `src/storage/database`.
- Never run ad hoc SQL from a component or screen.
- Use module `storage.ts` files as repositories that translate between rows and domain values.
- Make migrations forward-only, deterministic, and safe to run once.
- Use transactions for multi-step writes that must remain consistent.
- Define conflict, retry, and reconciliation behavior before implementing an offline mutation queue.
- Display honest offline, stale, queued, syncing, and failed states to the user.
- Do not silently treat a local write as a confirmed server write.

## Error Handling and Observability

- Normalize network errors in `src/lib/api-client.ts` into a typed application error shape.
- Let screens render recoverable query and form errors; use error boundaries for unexpected rendering failures.
- Configure Sentry once in `src/lib/sentry.ts` and initialize it from the application entry boundary.
- Attach useful non-sensitive context such as app version, route, feature name, and operation name.
- Do not report expected validation failures, cancellations, or ordinary offline states as fatal errors.
- Never log secrets, raw authorization headers, personal messages, or full sensitive API payloads.
- Keep user-facing error copy actionable and avoid exposing internal exception text.

## Testing

- Place tests beside module code or in the module's `__tests__` directory.
- Never place test files inside `src/app/`; Expo Router treats files there as routes or layouts.
- Use React Native Testing Library and test behavior through accessible queries.
- Use `expo-router/testing-library` for navigation integration tests when route behavior matters.
- Provide a shared render helper in `src/test/render.tsx` that supplies Query, session, theme, and other required providers.
- Create a fresh QueryClient per test with retries disabled; do not share cache across tests.
- Test Zod schemas and pure utilities directly.
- Test query keys, cache updates, optimistic rollback, auth cleanup, route-param validation, and offline reconciliation where applicable.
- Mock the network boundary and native modules, not internal implementation details.
- Prefer deterministic clocks, IDs, and fixtures. Avoid snapshots as the only assertion for interactive behavior.

## Imports and Dependency Direction

Use a configured source alias such as `#/* -> ./src/*` for imports across top-level source areas. Use relative imports within a small cohesive folder.

Allowed direction:

```txt
app
  -> modules
  -> shared components / providers / hooks / lib / storage
```

Rules:

- `src/app/` may import module public APIs and shared providers.
- A module may import shared UI and infrastructure.
- A module should not import another module's internal files. Import from that module's `index.ts` only when a real cross-feature dependency is necessary.
- Shared UI, hooks, libraries, and storage infrastructure must not import module code.
- Avoid circular dependencies and barrel files that hide them.
- Use `import type` for type-only imports when appropriate.

## Naming Conventions

- Components and screens: `PascalCase.tsx`.
- Hooks: `useSomething`.
- Zustand stores: `useSomethingStore`.
- Query key factories: `{moduleName}Keys`.
- Query option factories: `somethingQueryOptions`.
- Mutation hooks: `useCreateSomething`, `useUpdateSomething`, or `useDeleteSomething`.
- Zod schemas: `somethingSchema`.
- Platform files: `Name.ios.tsx`, `Name.android.tsx`, `Name.web.tsx`, or `Name.native.tsx`.
- Route directories and files: lowercase Expo Router segments; use `[param]` for dynamic segments and `(group)` for route groups.
- Boolean values: names beginning with `is`, `has`, `can`, or `should`.
- Event handlers passed as props: `onPress`, `onSubmit`, or `onChange`; internal implementations may use `handlePress`, `handleSubmit`, or `handleChange`.

## Adding a Feature

When adding a feature:

1. Create or extend `src/modules/{moduleName}`.
2. Define boundary schemas and derive types.
3. Add request functions in `api.ts` if remote data is involved.
4. Add query or mutation definitions around those request functions.
5. Add module storage only if the feature has a real persistence requirement.
6. Compose behavior in module hooks.
7. Build feature components and screens using shared UI primitives.
8. Add a thin route in `src/app/` that exports or renders the module screen.
9. Add focused tests for behavior, boundaries, and failure states.
10. Export only the public surface from the module `index.ts`.

## Completion Checklist

Before considering a change complete:

- TypeScript passes without new unsafe casts or suppressions.
- Tests relevant to the change pass.
- New route parameters, API data, persisted data, and notification payloads are validated.
- Loading, empty, error, refreshing, offline, and success states are handled where applicable.
- Android and iOS behavior has been considered; web behavior is checked when the project supports web.
- Touch targets, labels, font scaling, keyboard behavior, safe areas, and reduced motion have been considered.
- Remote data is not duplicated in Zustand.
- Secrets and personal data are absent from source, public environment values, logs, and Sentry context.
- Query invalidation and sign-out cleanup are correct.
- Route files remain thin and module boundaries remain intact.
- No new dependency duplicates a capability already present in the installed stack.

## Decision Rule

When placement is unclear, put code in the feature module that owns the user behavior. Move it to a shared layer only after multiple modules need the same domain-neutral abstraction. Keep `src/app/` about navigation, `src/modules/` about product behavior, and shared directories about reusable infrastructure.
