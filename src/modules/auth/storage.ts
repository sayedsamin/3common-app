import { deleteApiKey, readApiKey, writeApiKey } from '@/storage/secure-store';
import { apiKeySchema } from './schemas';

export async function restoreApiKey() {
  const stored = await readApiKey();
  if (stored === null) return null;
  const result = apiKeySchema.safeParse(stored);
  if (result.success) return result.data;
  await deleteApiKey();
  return null;
}
export async function saveApiKey(value: string) {
  const key = apiKeySchema.parse(value);
  await writeApiKey(key);
  return key;
}
export { deleteApiKey as removeApiKey } from '@/storage/secure-store';
