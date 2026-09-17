// Bulletproof cross-environment safe storage utility
// Handles iframe sandbox restrictions, Third-party Cookie blocks, SecurityError, and QuotaExceededError

const memoryStore = new Map<string, string>();

let isStorageAvailable: boolean | null = null;

function checkStorageAvailability(): boolean {
  if (isStorageAvailable !== null) return isStorageAvailable;
  if (typeof window === 'undefined') {
    isStorageAvailable = false;
    return false;
  }
  try {
    const testKey = '__farglory_storage_test__';
    window.localStorage.setItem(testKey, testKey);
    window.localStorage.removeItem(testKey);
    isStorageAvailable = true;
    return true;
  } catch {
    isStorageAvailable = false;
    return false;
  }
}

export const safeStorage = {
  getItem: (key: string): string | null => {
    try {
      if (checkStorageAvailability()) {
        const val = window.localStorage.getItem(key);
        if (val !== null) return val;
      }
    } catch {
      // Fall through to memoryStore
    }
    return memoryStore.has(key) ? memoryStore.get(key)! : null;
  },

  setItem: (key: string, value: string): void => {
    // Always store in memory store as immediate reliable cache
    memoryStore.set(key, value);
    try {
      if (checkStorageAvailability()) {
        window.localStorage.setItem(key, value);
      }
    } catch (err) {
      console.warn(`[SafeStorage] localStorage write skipped for key "${key}":`, err);
    }
  },

  removeItem: (key: string): void => {
    memoryStore.delete(key);
    try {
      if (checkStorageAvailability()) {
        window.localStorage.removeItem(key);
      }
    } catch {}
  },

  clear: (): void => {
    memoryStore.clear();
    try {
      if (checkStorageAvailability()) {
        window.localStorage.clear();
      }
    } catch {}
  },

  keys: (): string[] => {
    const keysSet = new Set<string>(memoryStore.keys());
    try {
      if (checkStorageAvailability()) {
        for (let i = 0; i < window.localStorage.length; i++) {
          const k = window.localStorage.key(i);
          if (k) keysSet.add(k);
        }
      }
    } catch {}
    return Array.from(keysSet);
  },

  isAvailable: (): boolean => checkStorageAvailability(),
};
