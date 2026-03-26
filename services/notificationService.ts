// Push Notification Service - Manages push subscriptions and local notifications
// Handles check-in reminders, streak alerts, and weekly insights

import { offlineDB, NotificationSettings } from './offlineDB';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || '';

// Convert VAPID key to Uint8Array for Web Push
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Check if push notifications are supported
export function isPushSupported(): boolean {
  return 'serviceWorker' in navigator && 
         'PushManager' in window && 
         'Notification' in window;
}

// Check current permission status
export function getNotificationPermission(): NotificationPermission {
  if (!('Notification' in window)) return 'denied';
  return Notification.permission;
}

// Request notification permission
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) return 'denied';
  
  const permission = await Notification.requestPermission();
  return permission;
}

// Subscribe to push notifications
export async function subscribeToPush(): Promise<PushSubscription | null> {
  try {
    if (!isPushSupported()) {
      console.warn('[Notifications] Push not supported');
      return null;
    }

    const permission = await requestNotificationPermission();
    if (permission !== 'granted') {
      console.warn('[Notifications] Permission denied');
      return null;
    }

    const registration = await navigator.serviceWorker.ready;
    
    // Check for existing subscription
    let subscription = await registration.pushManager.getSubscription();
    
    if (!subscription && VAPID_PUBLIC_KEY) {
      // Create new subscription
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
    }

    if (subscription) {
      // Save subscription to settings
      const settings = await offlineDB.notifications.get();
      settings.subscription = subscription.toJSON();
      settings.enabled = true;
      await offlineDB.notifications.save(settings);

      // Send subscription to server
      try {
        await fetch('/api/notifications/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subscription: subscription.toJSON() }),
        });
      } catch (err) {
        // Queue for later sync if offline
        await offlineDB.sync.add({
          type: 'checkin',
          action: 'create',
          data: { subscription: subscription.toJSON() },
          endpoint: '/api/notifications/subscribe',
          method: 'POST',
        });
      }
    }

    return subscription;
  } catch (error) {
    console.error('[Notifications] Subscribe failed:', error);
    return null;
  }
}

// Unsubscribe from push notifications
export async function unsubscribeFromPush(): Promise<boolean> {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    
    if (subscription) {
      await subscription.unsubscribe();
      
      // Update settings
      const settings = await offlineDB.notifications.get();
      settings.enabled = false;
      settings.subscription = undefined;
      await offlineDB.notifications.save(settings);

      // Notify server
      try {
        await fetch('/api/notifications/unsubscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        });
      } catch {
        // silently fail if offline
      }
    }

    return true;
  } catch (error) {
    console.error('[Notifications] Unsubscribe failed:', error);
    return false;
  }
}

// Show a local notification (no server needed)
export async function showLocalNotification(
  title: string,
  options?: NotificationOptions
): Promise<void> {
  if (getNotificationPermission() !== 'granted') return;

  try {
    const registration = await navigator.serviceWorker.ready;
    await registration.showNotification(title, {
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      ...options,
      vibrate: [100, 50, 100],
    } as NotificationOptions & { vibrate?: number[] });
  } catch {
    // Fallback to Notification API
    if ('Notification' in window) {
      new Notification(title, {
        icon: '/icon-192.png',
        ...options,
      });
    }
  }
}

// ============================================
// SCHEDULED LOCAL NOTIFICATIONS
// ============================================

// Timer IDs for scheduled notifications
const scheduledTimers: Map<string, number> = new Map();

// Schedule a daily notification at a specific time
export function scheduleDailyNotification(
  id: string,
  title: string,
  body: string,
  timeString: string, // HH:MM
  options?: Partial<NotificationOptions>
): void {
  // Clear existing timer
  cancelScheduledNotification(id);

  const [hours, minutes] = timeString.split(':').map(Number);
  
  const scheduleNext = () => {
    const now = new Date();
    const target = new Date();
    target.setHours(hours, minutes, 0, 0);
    
    // If time has passed today, schedule for tomorrow
    if (target <= now) {
      target.setDate(target.getDate() + 1);
    }
    
    const delay = target.getTime() - now.getTime();
    
    const timerId = window.setTimeout(async () => {
      await showLocalNotification(title, {
        body,
        tag: id,
        data: { type: id, scheduledAt: new Date().toISOString() },
        ...options,
      });
      // Schedule next occurrence
      scheduleNext();
    }, delay);
    
    scheduledTimers.set(id, timerId);
  };

  scheduleNext();
}

// Cancel a scheduled notification
export function cancelScheduledNotification(id: string): void {
  const timerId = scheduledTimers.get(id);
  if (timerId !== undefined) {
    window.clearTimeout(timerId);
    scheduledTimers.delete(id);
  }
}

// Cancel all scheduled notifications
export function cancelAllScheduledNotifications(): void {
  scheduledTimers.forEach((timerId) => window.clearTimeout(timerId));
  scheduledTimers.clear();
}

// ============================================
// NOTIFICATION MANAGEMENT
// ============================================

// Initialize notifications based on saved settings
export async function initializeNotifications(): Promise<void> {
  const settings = await offlineDB.notifications.get();
  
  if (!settings.enabled || getNotificationPermission() !== 'granted') {
    cancelAllScheduledNotifications();
    return;
  }

  // Schedule check-in reminder
  if (settings.checkInReminder) {
    scheduleDailyNotification(
      'checkin-reminder',
      '🌟 Time for your daily check-in',
      'How are you feeling today? Take a moment to reflect on your emotions.',
      settings.checkInTime,
      {
        data: { url: '/?action=checkin', type: 'checkin-reminder' },
        actions: [
          { action: 'open-checkin', title: 'Check In' },
          { action: 'dismiss', title: 'Later' },
        ],
      } as any
    );
  } else {
    cancelScheduledNotification('checkin-reminder');
  }

  // Schedule journal reminder
  if (settings.journalReminder) {
    scheduleDailyNotification(
      'journal-reminder',
      '📝 Journal time',
      'Capture your thoughts and emotions in your Aetheria journal.',
      settings.journalTime,
      {
        data: { url: '/?action=journal', type: 'journal-reminder' },
        actions: [
          { action: 'open-journal', title: 'Open Journal' },
          { action: 'dismiss', title: 'Skip' },
        ],
      } as any
    );
  } else {
    cancelScheduledNotification('journal-reminder');
  }

  // Schedule breathing reminder
  if (settings.breathingReminder) {
    scheduleDailyNotification(
      'breathing-reminder',
      '🌬️ Breathing exercise',
      'Take a mindful breathing break to center yourself.',
      settings.breathingTime,
      {
        data: { url: '/?action=breathe', type: 'breathing-reminder' },
        actions: [
          { action: 'open-breathing', title: 'Start Breathing' },
          { action: 'dismiss', title: 'Not Now' },
        ],
      } as any
    );
  } else {
    cancelScheduledNotification('breathing-reminder');
  }
}

// Update notification settings and reschedule
export async function updateNotificationSettings(
  settings: Partial<NotificationSettings>
): Promise<NotificationSettings> {
  const current = await offlineDB.notifications.get();
  const updated = { ...current, ...settings };
  await offlineDB.notifications.save(updated);
  
  // Reinitialize with new settings
  await initializeNotifications();
  
  return updated;
}

// Send streak milestone notification
export async function notifyStreakMilestone(streakDays: number): Promise<void> {
  const settings = await offlineDB.notifications.get();
  if (!settings.enabled || !settings.streakAlerts) return;

  const milestones = [3, 7, 14, 21, 30, 50, 100, 365];
  if (milestones.includes(streakDays)) {
    await showLocalNotification(
      `🔥 ${streakDays}-day streak!`,
      {
        body: `Amazing! You've checked in for ${streakDays} days in a row. Keep the momentum going!`,
        tag: 'streak-milestone',
        data: { type: 'streak', days: streakDays },
      }
    );
  }
}

// Send weekly insights notification
export async function notifyWeeklyInsights(
  avgMood: number,
  topEmotion: string,
  totalCheckins: number
): Promise<void> {
  const settings = await offlineDB.notifications.get();
  if (!settings.enabled || !settings.weeklyInsights) return;

  const moodEmoji = avgMood >= 4 ? '😊' : avgMood >= 3 ? '😐' : '😔';
  
  await showLocalNotification(
    `${moodEmoji} Your weekly emotional insights`,
    {
      body: `Average mood: ${avgMood.toFixed(1)}/5 | Top emotion: ${topEmotion} | ${totalCheckins} check-ins this week`,
      tag: 'weekly-insights',
      data: { url: '/?action=insights', type: 'weekly-insights' },
    }
  );
}

export const notificationService = {
  isPushSupported,
  getPermission: getNotificationPermission,
  requestPermission: requestNotificationPermission,
  subscribe: subscribeToPush,
  unsubscribe: unsubscribeFromPush,
  showLocal: showLocalNotification,
  initialize: initializeNotifications,
  updateSettings: updateNotificationSettings,
  notifyStreak: notifyStreakMilestone,
  notifyInsights: notifyWeeklyInsights,
  cancelAll: cancelAllScheduledNotifications,
};

export default notificationService;
