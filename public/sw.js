// Aetheria Service Worker - Enhanced Offline Support
const CACHE_VERSION = 'v2';
const STATIC_CACHE = `aetheria-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `aetheria-dynamic-${CACHE_VERSION}`;
const DATA_CACHE = `aetheria-data-${CACHE_VERSION}`;

// Static assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
];

// API endpoints to cache for offline
const CACHEABLE_API_PATTERNS = [
  '/api/gallery',
  '/api/presets',
];

// Maximum items in dynamic cache
const MAX_DYNAMIC_CACHE_ITEMS = 50;

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
    event.waitUntil(syncCheckIns());
  }
  
  if (event.tag === 'sync-history') {
    event.waitUntil(syncHistory());
  }
});

// Sync check-ins when back online
const syncCheckIns = async () => {
  try {
    const pendingCheckIns = await getPendingData('pending-checkins');
    for (const checkIn of pendingCheckIns) {
      await fetch('/api/checkins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(checkIn),
      });
    }
    await clearPendingData('pending-checkins');
  } catch (error) {
    console.error('[SW] Sync check-ins failed:', error);
  }
};

// Sync history when back online
const syncHistory = async () => {
  try {
    const pendingHistory = await getPendingData('pending-history');
    for (const entry of pendingHistory) {
      await fetch('/api/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry),
      });
    }
    await clearPendingData('pending-history');
  } catch (error) {
    console.error('[SW] Sync history failed:', error);
  }
};

// Helper: Get pending data from IndexedDB
const getPendingData = async (storeName) => {
  // Implementation would use IndexedDB
  return [];
};

// Helper: Clear pending data from IndexedDB
const clearPendingData = async (storeName) => {
  // Implementation would use IndexedDB
};

// Push notifications (for future use)
self.addEventListener('push', (event) => {
  if (!event.data) return;
  
  const data = event.data.json();
  const options = {
    body: data.body || 'New notification from Aetheria',
    icon: '/icon-192.png',
    badge: '/icon-72.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/',
    },
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title || 'Aetheria', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const url = event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Focus existing window if available
        for (const client of clientList) {
          if (client.url === url && 'focus' in client) {
            return client.focus();
          }
        }
        // Open new window
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
  );
});

console.log('[SW] Service worker loaded');
