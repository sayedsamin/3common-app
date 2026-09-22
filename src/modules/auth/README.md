# Authentication placeholder

API-key entry is required before opening protected routes. SessionProvider restores the key through this module's validated storage operations. Native builds use Expo SecureStore; web retains the key in memory until refresh. Saving a key checks its format, not its validity with the backend.

Feature request functions call `apiRequest('events/?status=draft')` from `@/lib/api-client` and validate the returned unknown data. The default API root is `https://api.3common.com/v1/`; `EXPO_PUBLIC_API_URL` can override it. The client adds the active key as a Bearer token and rejects URLs outside that API root. Never include API keys in environment variables, query keys, URLs, or logs. Settings sign-out removes the saved key and clears the Query cache.
