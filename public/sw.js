// Aetheria Service Worker - Full PWA with Offline, Push, Widget & Sync
const CACHE_VERSION = 'v3';
const STATIC_CACHE = `aetheria-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `aetheria-dynamic-${CACHE_VERSION}`;
const DATA_CACHE = `aetheria-data-${CACHE_VERSION}`;
const OFFLINE_CACHE = `aetheria-offline-${CACHE_VERSION}`;

// Supabase access token supplied by the page via postMessage.
// Stored only in memory for the lifetime of the SW instance.
let authToken = null;

// Static assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
];

// API endpoints to cache for offline
const CACHEABLE_API_PATTERNS = [
  '/api/gallery',
  '/api/checkins',
  '/api/profile',
];

// Maximum items in dynamic cache
const MAX_DYNAMIC_CACHE_ITEMS = 100;

// IndexedDB for offline queue (service worker context)
const IDB_NAME = 'aetheria-sw-offline';
const IDB_VERSION = 1;
const IDB_STORE_PENDING = 'pending-sync';
const IDB_STORE_STATE = 'emotional-state';

function openSWDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(IDB_NAME, IDB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(IDB_STORE_PENDING)) {
        db.createObjectStore(IDB_STORE_PENDING, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(IDB_STORE_STATE)) {
        db.createObjectStore(IDB_STORE_STATE, { keyPath: 'id' });
      }
    };
  });
}

async function addPendingItem(item) {
  const db = await openSWDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE_PENDING, 'readwrite');
    tx.objectStore(IDB_STORE_PENDING).put(item);
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}

async function getAllPending() {
  const db = await openSWDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE_PENDING, 'readonly');
    const request = tx.objectStore(IDB_STORE_PENDING).getAll();
    request.onsuccess = () => { db.close(); resolve(request.result); };
    request.onerror = () => { db.close(); reject(request.error); };
  });
}

async function removePendingItem(id) {
  const db = await openSWDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE_PENDING, 'readwrite');
    tx.objectStore(IDB_STORE_PENDING).delete(id);
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}

async function saveEmotionalState(state) {
  const db = await openSWDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE_STATE, 'readwrite');
    tx.objectStore(IDB_STORE_STATE).put({ ...state, id: 'current' });
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}

async function getEmotionalState() {
  const db = await openSWDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE_STATE, 'readonly');
    const request = tx.objectStore(IDB_STORE_STATE).get('current');
    request.onsuccess = () => { db.close(); resolve(request.result); };
    request.onerror = () => { db.close(); reject(request.error); };
  });
}

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => {
              return name.startsWith('aetheria-') && 
                     name !== STATIC_CACHE && 
                     name !== DYNAMIC_CACHE &&
                     name !== DATA_CACHE;
            })
            .map((name) => {
              console.log('[SW] Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Helper: Limit cache size
const limitCacheSize = async (cacheName, maxItems) => {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length > maxItems) {
    await cache.delete(keys[0]);
    return limitCacheSize(cacheName, maxItems);
  }
};

// Helper: Check if request is API call
const isApiRequest = (url) => {
  return url.includes('/api/') || 
         url.includes('supabase.co') || 
         url.includes('api.groq.com');
};

// Helper: Check if API response should be cached
const shouldCacheApi = (url) => {
  return CACHEABLE_API_PATTERNS.some(pattern => url.includes(pattern));
};

// Fetch event - smart caching strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') return;
  
  // Skip chrome-extension and other non-http
  if (!url.protocol.startsWith('http')) return;

  // API requests - network first with optional caching
  if (isApiRequest(request.url)) {
    // Skip real-time API calls (auth, interpret, etc.)
    if (request.url.includes('api.groq.com') || 
        request.url.includes('/auth/') ||
        request.url.includes('/api/interpret')) {
      return;
    }

    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful GET requests for cacheable endpoints
          if (response.ok && shouldCacheApi(request.url)) {
            const responseClone = response.clone();
            caches.open(DATA_CACHE).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Return cached data if available
          return caches.match(request);
        })
    );
    return;
  }

  // Static assets - cache first
  if (url.pathname.match(/\.(js|css|woff2?|ttf|otf|eot|ico|png|jpg|jpeg|gif|svg|webp)$/)) {
    event.respondWith(
      caches.match(request)
        .then((cachedResponse) => {
          if (cachedResponse) {
            // Return cached, but also fetch fresh in background
            fetch(request).then((response) => {
              if (response.ok) {
                caches.open(STATIC_CACHE).then((cache) => {
                  cache.put(request, response);
                });
              }
            });
            return cachedResponse;
          }
          
          return fetch(request).then((response) => {
            if (response.ok) {
              const responseClone = response.clone();
              caches.open(STATIC_CACHE).then((cache) => {
                cache.put(request, responseClone);
              });
            }
            return response;
          });
        })
    );
    return;
  }

  // HTML pages - network first with cache fallback
  if (request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const responseClone = response.clone();
          caches.open(DYNAMIC_CACHE).then((cache) => {
            cache.put(request, responseClone);
          });
          return response;
        })
        .catch(() => {
          return caches.match(request)
            .then((cachedResponse) => {
              return cachedResponse || caches.match('/');
            });
        })
    );
    return;
  }

  // Default - network first with dynamic caching
  event.respondWith(
    fetch(request)
      .then((response) => {
        const responseClone = response.clone();
        caches.open(DYNAMIC_CACHE).then((cache) => {
          cache.put(request, responseClone);
          limitCacheSize(DYNAMIC_CACHE, MAX_DYNAMIC_CACHE_ITEMS);
        });
        return response;
      })
      .catch(() => {
        return caches.match(request);
      })
  );
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);
  
  if (event.tag === 'sync-checkins') {
    event.waitUntil(syncCheckins());
  }
  
  if (event.tag === 'sync-history') {
    event.waitUntil(syncHistory());
  }

  if (event.tag === 'sync-pending') {
    event.waitUntil(syncAllPending());
  }

  if (event.tag === 'sync-journal') {
    event.waitUntil(syncJournal());
  }
});

// Periodic background sync (for check-in reminders when app is closed)
self.addEventListener('periodicsync', (event) => {
  console.log('[SW] Periodic sync:', event.tag);
  
  if (event.tag === 'checkin-reminder') {
    event.waitUntil(sendCheckInReminder());
  }

  if (event.tag === 'weekly-insights') {
    event.waitUntil(sendWeeklyInsights());
  }
});

// Sync all pending items from IndexedDB queue
const syncAllPending = async () => {
  try {
    const pendingItems = await getAllPending();
    console.log(`[SW] Syncing ${pendingItems.length} pending items...`);
    
    for (const item of pendingItems) {
      try {
        const response = await fetch(item.endpoint, {
          method: item.method || 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item.data),
        });
        
        if (response.ok) {
          await removePendingItem(item.id);
          console.log(`[SW] Synced item: ${item.id}`);
        } else if (response.status >= 500) {
          // Server error - keep for retry
          console.warn(`[SW] Server error syncing ${item.id}, will retry`);
        } else {
          // Client error - remove to prevent infinite retry
          await removePendingItem(item.id);
          console.warn(`[SW] Client error syncing ${item.id}, removed`);
        }
      } catch (error) {
        console.error(`[SW] Failed to sync item ${item.id}:`, error);
      }
    }

    // Notify clients that sync is complete
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({ type: 'sync-complete', pendingRemaining: 0 });
    });
  } catch (error) {
    console.error('[SW] Sync all pending failed:', error);
  }
};

// Sync check-ins when back online
const syncCheckins = async () => {
  try {
    const pendingItems = await getAllPending();
    const checkins = pendingItems.filter(item => item.type === 'checkin');
    
    for (const item of checkins) {
      try {
        await fetch(item.endpoint || '/api/checkins', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
          },
          body: JSON.stringify(item.data),
        });
        await removePendingItem(item.id);
      } catch (error) {
        console.error(`[SW] Sync checkin ${item.id} failed:`, error);
      }
    }
  } catch (error) {
    console.error('[SW] Sync check-ins failed:', error);
  }
};

// Sync history when back online
const syncHistory = async () => {
  try {
    const pendingItems = await getAllPending();
    const historyItems = pendingItems.filter(item => item.type === 'history');
    
    for (const item of historyItems) {
      try {
        await fetch(item.endpoint || '/api/history', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
          },
          body: JSON.stringify(item.data),
        });
        await removePendingItem(item.id);
      } catch (error) {
        console.error(`[SW] Sync history ${item.id} failed:`, error);
      }
    }
  } catch (error) {
    console.error('[SW] Sync history failed:', error);
  }
};

// Sync journal entries when back online
const syncJournal = async () => {
  try {
    const pendingItems = await getAllPending();
    const journalItems = pendingItems.filter(item => item.type === 'journal');
    
    for (const item of journalItems) {
      try {
        await fetch(item.endpoint || '/api/journal', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
          },
          body: JSON.stringify(item.data),
        });
        await removePendingItem(item.id);
      } catch (error) {
        console.error(`[SW] Sync journal ${item.id} failed:`, error);
      }
    }
  } catch (error) {
    console.error('[SW] Sync journal failed:', error);
  }
};

// Send check-in reminder notification
const sendCheckInReminder = async () => {
  try {
    // Check if user already checked in today
    const state = await getEmotionalState();
    if (state) {
      const today = new Date().toISOString().split('T')[0];
      const stateDate = new Date(state.timestamp).toISOString().split('T')[0];
      if (today === stateDate) {
        console.log('[SW] Already checked in today, skipping reminder');
        return;
      }
    }

    await self.registration.showNotification('🌟 Time for your daily check-in', {
      body: 'How are you feeling today? Take a moment to reflect on your emotions.',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      vibrate: [100, 50, 100],
      tag: 'checkin-reminder',
      data: { url: '/?action=checkin', type: 'checkin-reminder' },
      actions: [
        { action: 'open-checkin', title: 'Check In' },
        { action: 'dismiss', title: 'Later' },
      ],
    });
  } catch (error) {
    console.error('[SW] Check-in reminder failed:', error);
  }
};

// Send weekly insights notification
const sendWeeklyInsights = async () => {
  try {
    await self.registration.showNotification('📊 Your weekly emotional insights', {
      body: 'See how your emotional wellness has evolved this week.',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      vibrate: [100, 50, 100],
      tag: 'weekly-insights',
      data: { url: '/?action=insights', type: 'weekly-insights' },
      actions: [
        { action: 'open-insights', title: 'View Insights' },
      ],
    });
  } catch (error) {
    console.error('[SW] Weekly insights notification failed:', error);
  }
};

// Push notifications - Full implementation
self.addEventListener('push', (event) => {
  console.log('[SW] Push received');
  
  let data = {
    title: 'Aetheria',
    body: 'New notification',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    url: '/',
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      data = { ...data, ...payload };
    } catch {
      data.body = event.data.text() || data.body;
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || '/icon-192.png',
    badge: data.badge || '/icon-192.png',
    vibrate: [100, 50, 100],
    tag: data.tag || 'default',
    renotify: !!data.tag,
    requireInteraction: data.requireInteraction || false,
    silent: data.silent || false,
    data: {
      url: data.url || '/',
      type: data.type || 'general',
      timestamp: Date.now(),
    },
    actions: data.actions || [],
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.action, event.notification.tag);
  event.notification.close();
  
  const url = event.notification.data?.url || '/';
  const action = event.action;

  // Handle specific actions
  let targetUrl = url;
  switch (action) {
    case 'open-checkin':
      targetUrl = '/?action=checkin';
      break;
    case 'open-journal':
      targetUrl = '/?action=journal';
      break;
    case 'open-breathing':
      targetUrl = '/?action=breathe';
      break;
    case 'open-insights':
      targetUrl = '/?action=insights';
      break;
    case 'dismiss':
      return; // Just close notification
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Try to focus an existing window
        for (const client of clientList) {
          if (client.url.includes(self.registration.scope) && 'focus' in client) {
            client.postMessage({
              type: 'notification-action',
              action: action || 'open',
              url: targetUrl,
              notificationType: event.notification.data?.type,
            });
            return client.focus();
          }
        }
        // Open new window
        if (clients.openWindow) {
          return clients.openWindow(targetUrl);
        }
      })
  );
});

// Handle notification close (for analytics)
self.addEventListener('notificationclose', (event) => {
  console.log('[SW] Notification closed:', event.notification.tag);
});

// ============================================
// MESSAGE HANDLING (from main app)
// ============================================

self.addEventListener('message', (event) => {
  const { type, data } = event.data || {};
  
  switch (type) {
    case 'set-auth-token': {
      // Token is used for authenticated background sync requests.
      // Keep it in-memory only; do not persist to Cache/IndexedDB.
      authToken = typeof data?.token === 'string' ? data.token : null;
      break;
    }

    case 'clear-auth-token': {
      authToken = null;
      break;
    }

    case 'emotional-state-update':
      // Save current emotional state for widget
      saveEmotionalState(data).catch(err => 
        console.error('[SW] Failed to save emotional state:', err)
      );
      break;
      
    case 'queue-sync':
      // Add item to sync queue
      addPendingItem(data).catch(err =>
        console.error('[SW] Failed to queue sync item:', err)
      );
      break;

    case 'get-emotional-state':
      // Return current emotional state (for widget)
      getEmotionalState().then(state => {
        event.source?.postMessage({
          type: 'emotional-state-response',
          data: state,
        });
      });
      break;

    case 'skip-waiting':
      self.skipWaiting();
      break;

    case 'register-periodic-sync':
      // Register periodic background sync for reminders
      registerPeriodicSync(data);
      break;
  }
});

// Register periodic sync for reminders
const registerPeriodicSync = async (config) => {
  try {
    if ('periodicSync' in self.registration) {
      if (config.checkInReminder) {
        await self.registration.periodicSync.register('checkin-reminder', {
          minInterval: 24 * 60 * 60 * 1000, // 24 hours
        });
        console.log('[SW] Periodic sync registered: checkin-reminder');
      }
      
      if (config.weeklyInsights) {
        await self.registration.periodicSync.register('weekly-insights', {
          minInterval: 7 * 24 * 60 * 60 * 1000, // 7 days
        });
        console.log('[SW] Periodic sync registered: weekly-insights');
      }
    }
  } catch (error) {
    console.error('[SW] Periodic sync registration failed:', error);
  }
};

// ============================================
// WIDGET SUPPORT (PWA Widgets API)
// ============================================

// Handle widget install
self.addEventListener('widgetinstall', (event) => {
  console.log('[SW] Widget installed:', event.widget.definition.tag);
  event.waitUntil(updateWidget(event.widget));
});

// Handle widget resume (brought back to view)
self.addEventListener('widgetresume', (event) => {
  console.log('[SW] Widget resumed:', event.widget.definition.tag);
  event.waitUntil(updateWidget(event.widget));
});

// Handle widget click
self.addEventListener('widgetclick', (event) => {
  console.log('[SW] Widget clicked:', event.action);
  
  if (event.action === 'open') {
    const url = event.data?.url || '/';
    event.waitUntil(
      clients.openWindow(url)
    );
  }
  
  if (event.action === 'update') {
    event.waitUntil(updateWidget(event.widget));
  }
});

// Handle widget uninstall 
self.addEventListener('widgetuninstall', (event) => {
  console.log('[SW] Widget uninstalled:', event.widget.definition.tag);
});

// Update widget with current emotional state data
const updateWidget = async (widget) => {
  try {
    const state = await getEmotionalState();
    
    const MOOD_EMOJIS = ['', '😢', '😔', '😐', '😊', '😄'];
    
    const widgetData = state ? {
      type: 'AdaptiveCard',
      version: '1.5',
      body: [
        {
          type: 'ColumnSet',
          columns: [
            {
              type: 'Column',
              width: 'auto',
              items: [{
                type: 'TextBlock',
                text: MOOD_EMOJIS[state.mood] || '😐',
                size: 'ExtraLarge',
              }],
            },
            {
              type: 'Column',
              width: 'stretch',
              items: [
                {
                  type: 'TextBlock',
                  text: state.phrase || 'Aetheria',
                  weight: 'Bolder',
                  size: 'Medium',
                  wrap: true,
                },
                {
                  type: 'TextBlock',
                  text: (state.emotions || []).join(', ') || 'No emotions recorded',
                  size: 'Small',
                  color: 'Light',
                  wrap: true,
                },
                {
                  type: 'TextBlock',
                  text: state.timestamp ? new Date(state.timestamp).toLocaleTimeString() : '',
                  size: 'Small',
                  color: 'Light',
                },
              ],
            },
          ],
        },
      ],
      actions: [
        {
          type: 'Action.Execute',
          title: 'Check In',
          verb: 'open',
          data: { url: '/?action=checkin' },
        },
        {
          type: 'Action.Execute',
          title: 'Refresh',
          verb: 'update',
        },
      ],
    } : {
      type: 'AdaptiveCard',
      version: '1.5',
      body: [
        {
          type: 'TextBlock',
          text: '🌌 Aetheria',
          weight: 'Bolder',
          size: 'Large',
        },
        {
          type: 'TextBlock',
          text: 'Tap to check in and see your emotional state here.',
          wrap: true,
          color: 'Light',
        },
      ],
      actions: [
        {
          type: 'Action.Execute',
          title: 'Check In',
          verb: 'open',
          data: { url: '/?action=checkin' },
        },
      ],
    };

    // Update the widget
    if ('widgets' in self) {
      await self.widgets.updateByTag(
        widget.definition.tag,
        { data: JSON.stringify(widgetData) }
      );
    }
  } catch (error) {
    console.error('[SW] Widget update failed:', error);
  }
};

console.log('[SW] Aetheria Service Worker v3 loaded — Offline, Push, Widget & Sync ready');
