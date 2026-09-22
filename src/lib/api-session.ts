let apiKey: string | null = null;
let sessionVersion = 0;
const listeners = new Set<() => void>();
export function onApiSessionChange(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; }
export function setApiKey(value: string | null) { apiKey = value; sessionVersion += 1; listeners.forEach(listener => listener()); }
export function getApiKey() { return apiKey; }
// Non-sensitive identity for ignoring late responses after a session change.
export function getApiSessionVersion() { return sessionVersion; }
