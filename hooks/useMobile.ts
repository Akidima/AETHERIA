// Mobile & PWA Hooks - Custom hooks for mobile-first PWA features
import { useState, useEffect, useCallback, useRef } from 'react';
import syncService from '../services/syncService';
import { offlineDB } from '../services/offlineDB';

// ============================================
// ONLINE STATUS HOOK
// ============================================

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

// ============================================
// SYNC STATUS HOOK
// ============================================

export function useSyncStatus() {
  const [status, setStatus] = useState<'idle' | 'syncing' | 'error' | 'offline'>('idle');
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const unsubscribe = syncService.subscribe((newStatus, count) => {
      setStatus(newStatus);
      setPendingCount(count);
    });
    return unsubscribe;
  }, []);

  const triggerSync = useCallback(() => {
    syncService.syncAll();
  }, []);

  return { status, pendingCount, triggerSync };
}

// ============================================
// PWA INSTALL HOOK
// ============================================

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function usePWAInstall() {
  const [canInstall, setCanInstall] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const promptRef = useRef<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    // Check if already installed
    const standalone = window.matchMedia('(display-mode: standalone)').matches ||
                       (window.navigator as any).standalone === true;
    setIsInstalled(standalone);

    const handler = (e: Event) => {
      e.preventDefault();
      promptRef.current = e as BeforeInstallPromptEvent;
      setCanInstall(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setCanInstall(false);
    });

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const install = useCallback(async () => {
    if (!promptRef.current) return false;
    try {
      await promptRef.current.prompt();
      const { outcome } = await promptRef.current.userChoice;
      return outcome === 'accepted';
    } catch {
      return false;
    }
  }, []);

  return { canInstall, isInstalled, install };
}

// ============================================
// STANDALONE MODE HOOK
// ============================================

export function useStandaloneMode() {
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    const check = () => {
      setIsStandalone(
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true
      );
    };
    check();

    const mq = window.matchMedia('(display-mode: standalone)');
    mq.addEventListener('change', check);
    return () => mq.removeEventListener('change', check);
  }, []);

  return isStandalone;
}

// ============================================
// MOBILE DETECTION HOOK
// ============================================

export function useMobileDetection() {
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent;
    
    setIsIOS(/iPad|iPhone|iPod/.test(ua));
    setIsAndroid(/Android/.test(ua));
    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
    
    const checkSize = () => {
      setIsMobile(window.innerWidth < 768);
      setIsTablet(window.innerWidth >= 768 && window.innerWidth < 1024);
    };
    checkSize();

    window.addEventListener('resize', checkSize);
    return () => window.removeEventListener('resize', checkSize);
  }, []);

  return { isMobile, isTablet, isTouchDevice, isIOS, isAndroid };
}

// ============================================
// NOTIFICATION PERMISSION HOOK
// ============================================

export function useNotificationPermission() {
  const [permission, setPermission] = useState<NotificationPermission>(
    'Notification' in window ? Notification.permission : 'denied'
  );
  const [isSupported] = useState(
    'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
  );

  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) return 'denied';
    const result = await Notification.requestPermission();
    setPermission(result);
    return result;
  }, []);

  return { permission, isSupported, requestPermission };
}

// ============================================
// SERVICE WORKER UPDATE HOOK
// ============================================

export function useServiceWorkerUpdate() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    navigator.serviceWorker.ready.then((reg) => {
      setRegistration(reg);

      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        if (!newWorker) return;

        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            setUpdateAvailable(true);
          }
        });
      });
    });

    // Check for updates every 30 minutes
    const interval = setInterval(() => {
      registration?.update();
    }, 30 * 60 * 1000);

    return () => clearInterval(interval);
  }, [registration]);

  const applyUpdate = useCallback(() => {
    if (registration?.waiting) {
      registration.waiting.postMessage({ type: 'skip-waiting' });
      window.location.reload();
    }
  }, [registration]);

  return { updateAvailable, applyUpdate };
}

// ============================================
// APP SHORTCUT/DEEP LINK HOOK
// ============================================

export function useAppShortcuts() {
  const [pendingAction, setPendingAction] = useState<string | null>(null);

  useEffect(() => {
    // Check URL params for app shortcuts
    const params = new URLSearchParams(window.location.search);
    const action = params.get('action');
    if (action) {
      setPendingAction(action);
      // Clean URL without reload
      const url = new URL(window.location.href);
      url.searchParams.delete('action');
      window.history.replaceState({}, '', url.toString());
    }

    // Listen for notification-triggered actions from service worker
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'notification-action') {
        const url = new URL(event.data.url, window.location.origin);
        const actionFromNotification = url.searchParams.get('action');
        if (actionFromNotification) {
          setPendingAction(actionFromNotification);
        }
      }
    };

    navigator.serviceWorker?.addEventListener('message', handleMessage);
    return () => navigator.serviceWorker?.removeEventListener('message', handleMessage);
  }, []);

  const consumeAction = useCallback(() => {
    const action = pendingAction;
    setPendingAction(null);
    return action;
  }, [pendingAction]);

  return { pendingAction, consumeAction };
}

// ============================================
// SHARE TARGET HOOK
// ============================================

export function useShareTarget() {
  const [sharedData, setSharedData] = useState<{ title?: string; text?: string; url?: string } | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const action = params.get('action');

    if (action === 'share-target') {
      setSharedData({
        title: params.get('title') || undefined,
        text: params.get('text') || undefined,
        url: params.get('url') || undefined,
      });

      // Clean URL
      const url = new URL(window.location.href);
      url.search = '';
      window.history.replaceState({}, '', url.toString());
    }
  }, []);

  const consumeSharedData = useCallback(() => {
    const data = sharedData;
    setSharedData(null);
    return data;
  }, [sharedData]);

  return { sharedData, consumeSharedData };
}

// ============================================
// WAKE LOCK HOOK (keep screen on during meditation/breathing)
// ============================================

export function useWakeLock() {
  const [isActive, setIsActive] = useState(false);
  const wakeLockRef = useRef<any>(null);

  const request = useCallback(async () => {
    try {
      if ('wakeLock' in navigator) {
        wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
        setIsActive(true);
        
        wakeLockRef.current.addEventListener('release', () => {
          setIsActive(false);
        });
      }
    } catch (err) {
      console.error('Wake lock failed:', err);
    }
  }, []);

  const release = useCallback(async () => {
    try {
      if (wakeLockRef.current) {
        await wakeLockRef.current.release();
        wakeLockRef.current = null;
        setIsActive(false);
      }
    } catch (err) {
      console.error('Wake lock release failed:', err);
    }
  }, []);

  // Re-acquire on visibility change
  useEffect(() => {
    const handler = () => {
      if (document.visibilityState === 'visible' && isActive) {
        request();
      }
    };
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  }, [isActive, request]);

  return { isActive, request, release };
}

// ============================================
// VIEWPORT HEIGHT HOOK (iOS fix)
// ============================================

export function useViewportHeight() {
  const [vh, setVh] = useState(window.innerHeight);

  useEffect(() => {
    const handler = () => {
      setVh(window.innerHeight);
      document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);
    };
    
    handler(); // Initial set
    window.addEventListener('resize', handler);
    window.addEventListener('orientationchange', handler);

    return () => {
      window.removeEventListener('resize', handler);
      window.removeEventListener('orientationchange', handler);
    };
  }, []);

  return vh;
}

// ============================================
// OFFLINE DATA HOOK
// ============================================

export function useOfflineData<T>(
  key: 'checkins' | 'journal' | 'history',
  fetchFn?: () => Promise<T[]>
) {
  const [data, setData] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const isOnline = useOnlineStatus();

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      // Always try local first
      const localData = await offlineDB[key].getAll() as T[];
      setData(localData);

      // If online and fetch function provided, sync from server
      if (isOnline && fetchFn) {
        try {
          const serverData = await fetchFn();
          setData(serverData);
          // Update local cache
          for (const item of serverData) {
            await (offlineDB[key] as any).save(item);
          }
        } catch {
          // Use local data as fallback
          console.warn(`[Offline] Using cached ${key} data`);
        }
      }
    } catch (err) {
      console.error(`[Offline] Failed to load ${key}:`, err);
    } finally {
      setIsLoading(false);
    }
  }, [key, isOnline, fetchFn]);

  useEffect(() => {
    load();
  }, [load]);

  const save = useCallback(async (item: T & { id?: string }) => {
    // Save locally
    await (offlineDB[key] as any).save(item);
    
    // Queue for sync
    const endpoint = `/api/${key}`;
    await syncService.queueAction(key as any, 'create', item, endpoint);
    
    // Refresh local data
    await load();
  }, [key, load]);

  return { data, isLoading, reload: load, save };
}
