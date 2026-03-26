// Offline Sync Service - Handles background synchronization
// Syncs pending offline changes when connectivity is restored

import { offlineDB, PendingSyncItem, EmotionalStateRecord } from './offlineDB';
import { useAuthStore } from '../store/useStore';

type SyncStatus = 'idle' | 'syncing' | 'error' | 'offline';
type SyncListener = (status: SyncStatus, pendingCount: number) => void;

class OfflineSyncService {
  private status: SyncStatus = 'idle';
  private listeners: Set<SyncListener> = new Set();
  private syncInterval: number | null = null;
  private isOnline: boolean = navigator.onLine;

  constructor() {
    // Listen for online/offline events
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);
    
    // Initial status
    this.isOnline = navigator.onLine;
    if (!this.isOnline) {
      this.setStatus('offline');
    }
  }

  // --- Event Handlers ---
  private handleOnline = () => {
    this.isOnline = true;
    console.log('[Sync] Back online, starting sync...');
    this.syncAll();
  };

  private handleOffline = () => {
    this.isOnline = false;
    console.log('[Sync] Gone offline');
    this.setStatus('offline');
  };

  // --- Status Management ---
  private setStatus(status: SyncStatus) {
    this.status = status;
    this.notifyListeners();
  }

  private async notifyListeners() {
    const pendingCount = await offlineDB.sync.getPendingCount();
    this.listeners.forEach(listener => listener(this.status, pendingCount));
  }

  // Subscribe to sync status changes
  subscribe(listener: SyncListener): () => void {
    this.listeners.add(listener);
    // Immediately notify with current status
    offlineDB.sync.getPendingCount().then(count => {
      listener(this.status, count);
    });
    return () => this.listeners.delete(listener);
  }

  // --- Core Sync Logic ---
  
  // Process all pending sync items
  async syncAll(): Promise<void> {
    if (!this.isOnline) {
      this.setStatus('offline');
      return;
    }

    this.setStatus('syncing');

    try {
      const pendingItems = await offlineDB.sync.getAll();
      
      if (pendingItems.length === 0) {
        this.setStatus('idle');
        return;
      }

      // Sort by timestamp (oldest first)
      pendingItems.sort((a, b) => a.timestamp - b.timestamp);

      let hasErrors = false;

      for (const item of pendingItems) {
        try {
          await this.processSyncItem(item);
          await offlineDB.sync.remove(item.id);
        } catch (error) {
          console.error(`[Sync] Failed to sync item ${item.id}:`, error);
          await offlineDB.sync.incrementRetry(item.id);
          hasErrors = true;
        }
      }

      this.setStatus(hasErrors ? 'error' : 'idle');
      
      // Also trigger service worker background sync if available
      this.triggerBackgroundSync();
    } catch (error) {
      console.error('[Sync] Sync failed:', error);
      this.setStatus('error');
    }
  }

  // Process a single sync item
  private async processSyncItem(item: PendingSyncItem): Promise<void> {
    const token = useAuthStore.getState().session?.access_token;
    const response = await fetch(item.endpoint, {
      method: item.method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(item.data),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  }

  // Trigger service worker background sync
  private async triggerBackgroundSync(): Promise<void> {
    try {
      const registration = await navigator.serviceWorker?.ready;
      if (registration && 'sync' in registration) {
        await (registration as any).sync.register('sync-pending');
      }
    } catch (error) {
      console.warn('[Sync] Background sync registration failed:', error);
    }
  }

  // --- Queue Operations ---

  // Add an item to the sync queue (when offline or for reliability)
  async queueAction(
    type: PendingSyncItem['type'],
    action: PendingSyncItem['action'],
    data: any,
    endpoint: string,
    method: string = 'POST'
  ): Promise<void> {
    await offlineDB.sync.add({ type, action, data, endpoint, method });
    this.notifyListeners();

    // Try to sync immediately if online
    if (this.isOnline) {
      // Debounce - wait a bit for batching
      setTimeout(() => this.syncAll(), 1000);
    } else {
      // Register for background sync
      this.triggerBackgroundSync();
    }
  }

  // Save data locally and queue for sync
  async saveOffline(
    type: 'checkin' | 'journal' | 'history',
    data: any,
    endpoint: string
  ): Promise<void> {
    // Save to IndexedDB immediately
    switch (type) {
      case 'checkin':
        await offlineDB.checkins.save(data);
        break;
      case 'journal':
        await offlineDB.journal.save(data);
        break;
      case 'history':
        await offlineDB.history.save(data);
        break;
    }

    // Queue for server sync
    await this.queueAction(type, 'create', data, endpoint);
  }

  // --- Emotional State (for Widget) ---
  
  // Update the current emotional state
  async updateEmotionalState(
    mood: number,
    emotions: string[],
    color: string,
    phrase: string,
    params?: any
  ): Promise<void> {
    const state: EmotionalStateRecord = {
      id: `state_${Date.now()}`,
      mood,
      emotions,
      color,
      phrase,
      timestamp: Date.now(),
      params,
    };

    await offlineDB.emotionalState.save(state);

    // Notify the widget via BroadcastChannel
    try {
      const channel = new BroadcastChannel('aetheria-widget');
      channel.postMessage({
        type: 'emotional-state-update',
        data: state,
      });
      channel.close();
    } catch {
      // BroadcastChannel not supported
    }

    // Also post to service worker for widget updates
    try {
      const registration = await navigator.serviceWorker?.ready;
      registration?.active?.postMessage({
        type: 'emotional-state-update',
        data: state,
      });
    } catch {
      // Service worker not available
    }
  }

  // Get current emotional state
  async getCurrentEmotionalState(): Promise<EmotionalStateRecord | undefined> {
    return offlineDB.emotionalState.getCurrent();
  }

  // --- Auto Sync ---
  
  // Start periodic sync (every 5 minutes)
  startAutoSync(intervalMs: number = 5 * 60 * 1000): void {
    this.stopAutoSync();
    this.syncInterval = window.setInterval(() => {
      if (this.isOnline) {
        this.syncAll();
      }
    }, intervalMs);
  }

  // Stop periodic sync
  stopAutoSync(): void {
    if (this.syncInterval !== null) {
      window.clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  // Get current sync status
  getStatus(): SyncStatus {
    return this.status;
  }

  // Check if online
  getIsOnline(): boolean {
    return this.isOnline;
  }

  // Cleanup
  destroy(): void {
    window.removeEventListener('online', this.handleOnline);
    window.removeEventListener('offline', this.handleOffline);
    this.stopAutoSync();
    this.listeners.clear();
  }
}

// Singleton instance
export const syncService = new OfflineSyncService();
export default syncService;
