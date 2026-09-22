# 3common

An Expo SDK 57 starter with TypeScript, Expo Router, Uniwind (Tailwind CSS 4), React Query, and all requested dependencies.

## Run

Use Node.js 24 LTS and npm.

```sh
npm ci
npm run web
```

For a native development build, install Android Studio and configure an emulator or connect an Android device, then run `npm run android`. On macOS with Xcode, run `npm run ios`. After installing a development build, use `npm start` to start Metro.

## Project structure

- `src/app/`: thin home and not-found routes, plus the root navigator.
- `src/modules/home/`: placeholder screen, module public API, colocated test, and documented module file stubs.
- `src/modules/system/`: the not-found screen.
- `src/modules/auth/` and `src/modules/notifications/`: notes for future integrations.
- `src/providers/`: shared app/Query providers and a documented session-provider placeholder.
- `src/components/ui/`: minimal accessible primitives; replace their visual design when pages are ready.
- `src/lib/`: QueryClient, public environment validation, optional Sentry initialization, `cn()`, and an API-client placeholder.
- `src/storage/`: documented SecureStore and SQLite integration placeholders.
- `src/hooks/`, `src/constants/`, `src/types/`: shared infrastructure locations with ownership notes.
- `src/test/`: shared provider-aware render helper, native setup, fixtures, and mocks.
- `src/global.css`: semantic light/dark design tokens, automatically following the system theme.
- `app.config.ts`: Expo configuration and native plugins.
- `assets/fonts/`, `assets/icons/`, `assets/images/`: asset locations; existing app icons stay at their original paths.

Commented TypeScript stubs export nothing and perform no operations. They are scaffolding, not working API, authentication, or storage implementations. No product page routes are assumed. The home module provides the pattern for pages added later; only export implemented public functionality from a module's `index.ts`.

Use the `@/` alias across top-level source areas and relative imports within a module. Keep route files as adapters, for example `export { HomeScreen as default } from '@/modules/home'`.

## Optional services

Copy `.env.example` to `.env.local` when services are available. Public URLs are validated in `src/lib/env.ts`; blank values are allowed during scaffolding. Sentry initialization is skipped without a DSN. Before enabling production reporting, configure the Sentry project, source-map uploads/Metro integration, native build plugin, and data redaction for the real application. API requests, authentication, notifications, database schemas, and migrations remain unimplemented. Do not place backend credentials or Sentry upload tokens in public environment variables.

## Checks

```sh
npm run typecheck
npm run lint
npm test -- --runInBand
npm run doctor
npx expo install --check
npx expo export --platform all
```

## Dependency versions

Versions were checked against the npm registry on September 21, 2026. Expo-managed packages follow the supported SDK 57 version ranges; other packages use the latest compatible stable releases. See `DEPENDENCIES.md` for the exact installed versions and exceptions to npm's `latest` tag. Commit `package-lock.json` and use `npm ci` for reproducible installs.

Expo's compatibility requirements: https://docs.expo.dev/versions/v57.0.0/

Uniwind setup: https://docs.uniwind.dev/quickstart
