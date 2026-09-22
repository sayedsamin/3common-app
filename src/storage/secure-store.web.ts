// No secure browser persistence is configured. Never save keys in browser storage.
let apiKey: string | null = null;
export async function readApiKey() { return apiKey; }
export async function writeApiKey(value: string) { apiKey = value; }
export async function deleteApiKey() { apiKey = null; }
