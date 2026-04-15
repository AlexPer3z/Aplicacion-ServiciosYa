// lib/storage.ts
import { createMMKV } from 'react-native-mmkv';
import type { StateStorage } from 'zustand/middleware';

export const storageV2 = createMMKV({
    id: 'app-storage'
});

export const zustandStorage: StateStorage = {
    setItem: (name, value) => {
        return storageV2.set(name, value)
    },
    getItem: (name) => {
        const value = storageV2.getString(name)
        return value ?? null
    },
    removeItem: (name) => {
        return storageV2.remove(name)
    },
}