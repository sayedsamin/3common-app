# Dependency versions

Checked against npm on September 21, 2026. Expo 57.0.24 is the latest stable SDK. This project uses the latest SDK-compatible versions rather than incompatible npm latest releases.

| Package | Installed | npm latest | Selection |
| --- | --- | --- | --- |
| @expo/ui | 57.0.19 | 57.0.19 | Latest stable |
| @expo/vector-icons | 15.1.1 | 15.1.1 | Latest stable |
| @rn-primitives/portal | 1.5.3 | 1.5.3 | Latest stable |
| @rn-primitives/slot | 1.5.2 | 1.5.2 | Latest stable |
| @sentry/react-native | 7.11.0 | 8.27.0 | Expo SDK 57 supported version |
| @shopify/flash-list | 2.0.2 | 2.3.2 | Expo SDK 57 supported version |
| @tanstack/react-query | 5.103.2 | 5.103.2 | Latest stable |
| class-variance-authority | 0.7.1 | 0.7.1 | Latest stable |
| clsx | 2.1.1 | 2.1.1 | Latest stable |
| expo | 57.0.24 | 57.0.24 | Latest stable |
| expo-constants | 57.0.19 | 57.0.19 | Latest stable |
| expo-dev-client | 57.0.19 | 57.0.19 | Latest stable |
| expo-font | 57.0.4 | 57.0.4 | Latest stable |
| expo-image | 57.0.5 | 57.0.5 | Latest stable |
| expo-linking | 57.0.10 | 57.0.10 | Latest stable |
| expo-notifications | 57.0.20 | 57.0.20 | Latest stable |
| expo-router | 57.0.22 | 57.0.22 | Latest stable |
| expo-secure-store | 57.0.4 | 57.0.4 | Latest stable |
| expo-splash-screen | 57.0.9 | 57.0.9 | Latest stable |
| expo-sqlite | 57.0.3 | 57.0.3 | Latest stable |
| expo-status-bar | 57.0.1 | 57.0.1 | Latest stable |
| expo-system-ui | 57.0.4 | 57.0.4 | Latest stable |
| react | 19.2.3 | 19.3.0 | Expo SDK 57 supported version |
| react-dom | 19.2.3 | 19.3.0 | Expo SDK 57 supported version |
| react-hook-form | 7.88.0 | 7.88.0 | Latest stable |
| react-native | 0.86.3 | 0.87.1 | Expo SDK 57 supported version |
| react-native-gesture-handler | 2.32.0 | 3.3.0 | Expo SDK 57 supported version |
| react-native-reanimated | 4.5.1 | 4.7.0 | Expo SDK 57 supported version |
| react-native-safe-area-context | 5.7.0 | 5.10.0 | Expo SDK 57 supported version |
| react-native-screens | 4.26.2 | 4.28.0 | Expo SDK 57 supported version |
| react-native-web | 0.21.2 | 0.21.2 | Latest stable |
| react-native-worklets | 0.10.1 | 0.13.0 | Expo SDK 57 supported version |
| tailwind-merge | 3.7.0 | 3.7.0 | Latest stable |
| tailwindcss | 4.3.3 | 4.3.3 | Latest stable |
| tailwindcss-animate | 1.0.7 | 1.0.7 | Latest stable |
| uniwind | 1.12.0 | 1.12.0 | Latest stable |
| zod | 4.6.5 | 4.6.5 | Latest stable |
| zustand | 5.0.15 | 5.0.15 | Latest stable |
| @testing-library/react-native | 14.0.1 | 14.0.1 | Latest stable |
| @types/jest | 29.5.14 | 30.0.0 | Jest Expo uses the Jest 29 toolchain |
| @types/react | 19.2.18 | 19.3.0 | Expo SDK 57 supported version |
| eslint | 9.39.5 | 10.11.0 | Expo React lint plugin supports ESLint through v9 |
| eslint-config-expo | 57.0.2 | 57.0.2 | Latest stable |
| jest | 29.7.0 | 30.5.2 | Jest Expo uses the Jest 29 toolchain |
| jest-expo | 57.0.5 | 57.0.5 | Latest stable |
| test-renderer | 1.2.0 | 1.3.0 | React 19.2 reconciler compatibility |
| typescript | 6.0.3 | 7.0.2 | TypeScript ESLint parser requires TypeScript <6.1 |

`test-renderer` is an additional explicit peer dependency for React Native Testing Library 14. Version 1.2.0 uses a reconciler compatible with React 19.2; its latest version requires React 19.3 transitively.

The lockfile records the complete resolved dependency tree. No peer dependency checks or Expo compatibility checks are disabled.

## Audit status

`npm audit` reports 15 moderate findings (no high or critical findings), rooted in the transitive `uuid` and `decode-uri-component` packages. The suggested automatic fixes downgrade Expo packages to older SDKs, so they were not applied. Recheck when Expo publishes dependency updates.

## References

- https://docs.expo.dev/versions/v57.0.0/
- https://registry.npmjs.org/
