import * as SecureStore from 'expo-secure-store';

const storageKey = 'threecommon.api-key';
export function readApiKey() { return SecureStore.getItemAsync(storageKey); }
export function writeApiKey(apiKey: string) {
  return SecureStore.setItemAsync(storageKey, apiKey, { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY });
}
export function deleteApiKey() { return SecureStore.deleteItemAsync(storageKey); }
