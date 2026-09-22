let apiKey: string | null = null;
let sessionVersion = 0;
export function setApiKey(value: string | null) { apiKey = value; sessionVersion += 1; }
export function getApiKey() { return apiKey; }
// Non-sensitive identity for ignoring late responses after a session change.
export function getApiSessionVersion() { return sessionVersion; }
