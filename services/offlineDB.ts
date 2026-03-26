// Aetheria Offline Database - IndexedDB wrapper for offline-first support
// Handles local storage of check-ins, journal entries, history, and pending syncs

const DB_NAME = 'aetheria-offline';
const DB_VERSION = 3;

// Store names
const STORES = {
  CHECKINS: 'checkins',
  JOURNAL: 'journal',
  HISTORY: 'history',
  PENDING_SYNC: 'pending-sync',
  EMOTIONAL_STATE: 'emotional-state',
  NOTIFICATIONS: 'notification-settings',
  CACHE_META: 'cache-meta',
};

export interface PendingSyncItem {
  id: string;
  type: 'checkin' | 'journal' | 'history' | 'reaction' | 'follow';
  action: 'create' | 'update' | 'delete';
  data: any;
  endpoint: string;
  method: string;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
}

export interface EmotionalStateRecord {
  id: string;
  mood: number;
  emotions: string[];
  color: string;
  phrase: string;
  timestamp: number;
  params?: any;
}

export interface NotificationSettings {
  id: string;
  enabled: boolean;
  checkInReminder: boolean;
  checkInTime: string; // HH:MM format
  journalReminder: boolean;
  journalTime: string;
  breathingReminder: boolean;
  breathingTime: string;
  weeklyInsights: boolean;
  streakAlerts: boolean;
  subscription?: PushSubscriptionJSON;
}

// Open the IndexedDB database
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Check-ins store
      if (!db.objectStoreNames.contains(STORES.CHECKINS)) {
        const store = db.createObjectStore(STORES.CHECKINS, { keyPath: 'id' });
        store.createIndex('date', 'date', { unique: false });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }

      // Journal store
      if (!db.objectStoreNames.contains(STORES.JOURNAL)) {
        const store = db.createObjectStore(STORES.JOURNAL, { keyPath: 'id' });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }

      // History store
      if (!db.objectStoreNames.contains(STORES.HISTORY)) {
        const store = db.createObjectStore(STORES.HISTORY, { keyPath: 'id' });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }

      // Pending sync store
      if (!db.objectStoreNames.contains(STORES.PENDING_SYNC)) {
        const store = db.createObjectStore(STORES.PENDING_SYNC, { keyPath: 'id' });
        store.createIndex('type', 'type', { unique: false });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }

      // Emotional state store (for widget)
      if (!db.objectStoreNames.contains(STORES.EMOTIONAL_STATE)) {
        const store = db.createObjectStore(STORES.EMOTIONAL_STATE, { keyPath: 'id' });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }

      // Notification settings store
      if (!db.objectStoreNames.contains(STORES.NOTIFICATIONS)) {
        db.createObjectStore(STORES.NOTIFICATIONS, { keyPath: 'id' });
      }

      // Cache metadata store
      if (!db.objectStoreNames.contains(STORES.CACHE_META)) {
        db.createObjectStore(STORES.CACHE_META, { keyPath: 'key' });
      }
    };
  });
}

// Generic CRUD operations
async function getAll<T>(storeName: string): Promise<T[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    tx.oncomplete = () => db.close();
  });
}

async function getById<T>(storeName: string, id: string): Promise<T | undefined> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const request = store.get(id);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    tx.oncomplete = () => db.close();
  });
}

async function put<T>(storeName: string, data: T): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    store.put(data);
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => reject(tx.error);
  });
}

async function remove(storeName: string, id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    store.delete(id);
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => reject(tx.error);
  });
}

async function clear(storeName: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    store.clear();
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => reject(tx.error);
  });
}

async function getByIndex<T>(storeName: string, indexName: string, value: IDBValidKey): Promise<T[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const index = store.index(indexName);
    const request = index.getAll(value);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    tx.oncomplete = () => db.close();
  });
}

// ============================================
// OFFLINE DATABASE API
// ============================================

export const offlineDB = {
  // --- Check-ins ---
  checkins: {
    getAll: () => getAll<any>(STORES.CHECKINS),
    getById: (id: string) => getById<any>(STORES.CHECKINS, id),
    getByDate: (date: string) => getByIndex<any>(STORES.CHECKINS, 'date', date),
    save: (checkin: any) => put(STORES.CHECKINS, checkin),
    remove: (id: string) => remove(STORES.CHECKINS, id),
    clear: () => clear(STORES.CHECKINS),
  },

  // --- Journal ---
  journal: {
    getAll: () => getAll<any>(STORES.JOURNAL),
    getById: (id: string) => getById<any>(STORES.JOURNAL, id),
    save: (entry: any) => put(STORES.JOURNAL, entry),
    remove: (id: string) => remove(STORES.JOURNAL, id),
    clear: () => clear(STORES.JOURNAL),
  },

  // --- History ---
  history: {
    getAll: () => getAll<any>(STORES.HISTORY),
    getById: (id: string) => getById<any>(STORES.HISTORY, id),
    save: (entry: any) => put(STORES.HISTORY, entry),
    remove: (id: string) => remove(STORES.HISTORY, id),
    clear: () => clear(STORES.HISTORY),
  },

  // --- Emotional State (for widget) ---
  emotionalState: {
    getCurrent: async (): Promise<EmotionalStateRecord | undefined> => {
      const all = await getAll<EmotionalStateRecord>(STORES.EMOTIONAL_STATE);
      return all.sort((a, b) => b.timestamp - a.timestamp)[0];
    },
    getHistory: (limit?: number) => getAll<EmotionalStateRecord>(STORES.EMOTIONAL_STATE).then(
      items => items.sort((a, b) => b.timestamp - a.timestamp).slice(0, limit || 50)
    ),
    save: (state: EmotionalStateRecord) => put(STORES.EMOTIONAL_STATE, state),
    clear: () => clear(STORES.EMOTIONAL_STATE),
  },

  // --- Notification Settings ---
  notifications: {
    get: async (): Promise<NotificationSettings> => {
      const settings = await getById<NotificationSettings>(STORES.NOTIFICATIONS, 'default');
      return settings || {
        id: 'default',
        enabled: false,
        checkInReminder: true,
        checkInTime: '09:00',
        journalReminder: false,
        journalTime: '20:00',
        breathingReminder: false,
        breathingTime: '07:00',
        weeklyInsights: true,
        streakAlerts: true,
      };
    },
    save: (settings: NotificationSettings) => put(STORES.NOTIFICATIONS, { ...settings, id: 'default' }),
  },

  // --- Pending Sync Queue ---
  sync: {
    getAll: () => getAll<PendingSyncItem>(STORES.PENDING_SYNC),
    add: (item: Omit<PendingSyncItem, 'id' | 'timestamp' | 'retryCount' | 'maxRetries'>) => {
      const syncItem: PendingSyncItem = {
        ...item,
        id: `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
        retryCount: 0,
        maxRetries: 5,
      };
      return put(STORES.PENDING_SYNC, syncItem);
    },
    remove: (id: string) => remove(STORES.PENDING_SYNC, id),
    clear: () => clear(STORES.PENDING_SYNC),
    incrementRetry: async (id: string) => {
      const item = await getById<PendingSyncItem>(STORES.PENDING_SYNC, id);
      if (item) {
        item.retryCount++;
        if (item.retryCount >= item.maxRetries) {
          await remove(STORES.PENDING_SYNC, id);
        } else {
          await put(STORES.PENDING_SYNC, item);
        }
      }
    },
    getPendingCount: async (): Promise<number> => {
      const items = await getAll<PendingSyncItem>(STORES.PENDING_SYNC);
      return items.length;
    },
  },

  // --- Cache Metadata ---
  cacheMeta: {
    get: (key: string) => getById<{ key: string; value: any }>(STORES.CACHE_META, key)
      .then(r => r?.value),
    set: (key: string, value: any) => put(STORES.CACHE_META, { key, value }),
    remove: (key: string) => remove(STORES.CACHE_META, key),
  },
};

export default offlineDB;
