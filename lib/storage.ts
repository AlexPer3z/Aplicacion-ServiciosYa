import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Constants for secure storage
const STORAGE_KEYS = {
  CREDENTIALS: 'supabase_credentials', // Only this key is needed now
  LAST_USER: 'last_user_id'
};

// Type for credentials
type Credentials = {
  email: string;
  password: string;
};

/**
 * Saves only email and password (no session tokens)
 */
export async function saveCredentials(email: string, password: string) {
  const credentials: Credentials = { email, password };
  await SecureStore.setItemAsync(
    STORAGE_KEYS.CREDENTIALS,
    JSON.stringify(credentials)
  );
}

/**
 * Retrieves stored email and password
 */
export async function getCredentials(): Promise<Credentials | null> {
  const stored = await SecureStore.getItemAsync(STORAGE_KEYS.CREDENTIALS);
  return stored ? JSON.parse(stored) : null;
}

/**
 * Removes stored credentials
 */
export async function removeCredentials() {
  await SecureStore.deleteItemAsync(STORAGE_KEYS.CREDENTIALS);
}

async function getlastUserId(): Promise<string | null> {
  const value = await AsyncStorage.getItem(STORAGE_KEYS.LAST_USER);
  return value
}

async function setLastUserId(id: string) {
  await AsyncStorage.setItem(STORAGE_KEYS.LAST_USER, id);  
}

export const lastUserId = {
  get: getlastUserId,
  set: setLastUserId
}