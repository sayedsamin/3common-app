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

- `src/app/`: thin tab/utility routes, nested drawer and tab layouts, and the root navigator.
- `src/modules/home/`: Home placeholder, public module API, and documented module file stubs.
- `src/modules/system/`: the not-found screen.
- `src/modules/auth/` and `src/modules/notifications/`: notes for future integrations.
- `src/providers/`: shared app/Query providers and a documented session-provider placeholder.
- `src/components/ui/`: branded mobile primitives; see its README for tokens and component APIs.
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

## Navigation

Bottom tabs are Home (`/`), Profile (`/profile`), and AI (`/ai`). The top-left menu opens a left drawer with Settings, Help, and About. Utility pages hide the tabs and provide Back navigation to the prior tab, or Home when opened directly without history. Each screen is a coming-soon placeholder owned by its feature module.

The design showcase has been removed. Shared UI and automatic system appearance remain. The standard Expo Router drawer is used normally; reduced-motion users get an instant overlay using the same menu content because the installed native drawer forces its animation. The menu supports Escape/Android Back, backdrop/Close dismissal, focus containment on web, and focus restoration.

Screen safe-area edges are configurable: navigators own top/bottom insets for tab pages; utility pages keep their bottom inset. Navigation tests live under `src/components/navigation/__tests__`.
