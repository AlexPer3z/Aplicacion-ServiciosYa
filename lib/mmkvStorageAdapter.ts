// lib/mmkvStorageAdapter.ts
import type { SupportedStorage } from '@supabase/supabase-js';
import { storageV2 } from './storagev2';

export const mmkvStorageAdapter: SupportedStorage = {
    getItem: (key: string) => {
        return storageV2.getString(key) ?? null;
    },
    setItem: (key: string, value: string) => {
        storageV2.set(key, value);
    },
    removeItem: (key: string) => {
        storageV2.remove(key);
    },
};