import { Session } from "@supabase/supabase-js";
import * as SecureStore from 'expo-secure-store';

// Constantes para almacenamiento seguro
const STORAGE_KEYS = {
    SESSION: 'supabase_session',
    LAST_LOGIN: 'last_login_method',
    CREDENTIALS: 'supabase_credentials',
    BIOMETRIC_AUTH: 'last_biometric_auth',
};

// Guarda la sesión de Supabase en SecureStore
export async function saveAuthSession(session: Session) {
    await SecureStore.setItemAsync(STORAGE_KEYS.SESSION, session.refresh_token);
    await SecureStore.setItemAsync(`${STORAGE_KEYS.SESSION}_access_token`, session.access_token);
}

export async function getAuthSession(): Promise<{ refresh_token: string | null, access_token: string | null }> {
    const refresh_token = await SecureStore.getItemAsync(STORAGE_KEYS.SESSION);
    const access_token = await SecureStore.getItemAsync(`${STORAGE_KEYS.SESSION}_access_token`);
    return { refresh_token, access_token };
}

export async function removeAuthSession() {
    await SecureStore.deleteItemAsync(STORAGE_KEYS.SESSION);
    await SecureStore.deleteItemAsync(`${STORAGE_KEYS.SESSION}_access_token`);
}