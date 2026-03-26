// Mobile Shell - PWA Install, Offline Indicator, and Mobile-optimized UI controls
// Provides native-like mobile experience for the PWA

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Download, X, Wifi, WifiOff, RefreshCw, ChevronUp, 
  Bell, BellOff, Share2, Smartphone, CloudOff, Cloud,
  Check, AlertTriangle
} from 'lucide-react';
import syncService from '../services/syncService';

// ============================================
// APP INSTALL PROMPT
// ============================================

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const InstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                         (window.navigator as any).standalone === true;
    setIsInstalled(isStandalone);

    // Check if previously dismissed
    const dismissedAt = localStorage.getItem('aetheria_install_dismissed');
    if (dismissedAt) {
      const daysSince = (Date.now() - parseInt(dismissedAt)) / (1000 * 60 * 60 * 24);
      if (daysSince < 7) {
        setDismissed(true);
      }
    }

    // Listen for install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Show after a delay for better UX
      setTimeout(() => setShowPrompt(true), 3000);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Listen for app installed
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
    });

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return;
    
    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        setIsInstalled(true);
      }
    } catch (err) {
      console.error('Install prompt failed:', err);
    }
    
    setShowPrompt(false);
    setDeferredPrompt(null);
  }, [deferredPrompt]);

  const handleDismiss = useCallback(() => {
    setShowPrompt(false);
    setDismissed(true);
    localStorage.setItem('aetheria_install_dismissed', Date.now().toString());
  }, []);

  // iOS install instructions
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const showIOSPrompt = isIOS && !isInstalled && !dismissed;

  if (isInstalled || dismissed) return null;

  return (
    <AnimatePresence>
      {(showPrompt || showIOSPrompt) && (
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed bottom-4 left-4 right-4 z-[300] max-w-md mx-auto"
        >
          <div className="bg-[#0a0a0a]/95 border border-white/10 rounded-2xl p-5 backdrop-blur-xl shadow-2xl">
            <button
              onClick={handleDismiss}
              className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4 text-white/40" />
            </button>
            
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-purple-500/30 flex items-center justify-center flex-shrink-0">
                <Smartphone className="w-6 h-6 text-purple-400" />
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-display font-bold text-lg mb-1">
                  Install Aetheria
                </h3>
                <p className="text-white/50 text-sm mb-4 leading-relaxed">
                  Add to your home screen for offline access, push notifications, and a native app experience.
                </p>

                {isIOS ? (
                  <div className="text-white/60 text-xs space-y-1.5">
                    <p className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[10px]">1</span>
                      Tap <Share2 className="w-3.5 h-3.5 inline" /> Share button
                    </p>
                    <p className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[10px]">2</span>
                      Scroll down and tap "Add to Home Screen"
                    </p>
                    <p className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[10px]">3</span>
                      Tap "Add" to confirm
                    </p>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={handleInstall}
                      className="flex items-center gap-2 px-4 py-2.5 bg-white text-black rounded-xl font-medium text-sm hover:bg-white/90 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      Install App
                    </button>
                    <button
                      onClick={handleDismiss}
                      className="px-4 py-2.5 text-white/50 rounded-xl text-sm hover:bg-white/5 transition-colors"
                    >
                      Not now
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// ============================================
// OFFLINE INDICATOR
// ============================================

export const OfflineIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncStatus, setSyncStatus] = useState<string>('idle');
  const [pendingCount, setPendingCount] = useState(0);
  const [showDetails, setShowDetails] = useState(false);
  const [justCameOnline, setJustCameOnline] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setJustCameOnline(true);
      setTimeout(() => setJustCameOnline(false), 3000);
    };
    const handleOffline = () => {
      setIsOnline(false);
      setJustCameOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Subscribe to sync status
    const unsubscribe = syncService.subscribe((status, count) => {
      setSyncStatus(status);
      setPendingCount(count);
    });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      unsubscribe();
    };
  }, []);

  // Don't show anything when online with no pending syncs and not just came online
  if (isOnline && pendingCount === 0 && !justCameOnline && syncStatus !== 'syncing') {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="fixed top-0 left-0 right-0 z-[250] safe-area-top"
      >
        <div 
          className={`flex items-center justify-center gap-2 px-4 py-2 text-xs font-medium transition-colors ${
            !isOnline
              ? 'bg-red-500/90 text-white'
              : justCameOnline
                ? 'bg-green-500/90 text-white'
                : syncStatus === 'syncing'
                  ? 'bg-blue-500/90 text-white'
                  : syncStatus === 'error'
                    ? 'bg-yellow-500/90 text-black'
                    : 'bg-white/10 text-white/70'
          }`}
          onClick={() => setShowDetails(!showDetails)}
        >
          {!isOnline ? (
            <>
              <WifiOff className="w-3.5 h-3.5" />
              <span>You're offline — changes will sync when reconnected</span>
            </>
          ) : justCameOnline ? (
            <>
              <Wifi className="w-3.5 h-3.5" />
              <span>Back online!</span>
              {pendingCount > 0 && <span>Syncing {pendingCount} changes...</span>}
            </>
          ) : syncStatus === 'syncing' ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Syncing {pendingCount} pending changes...</span>
            </>
          ) : syncStatus === 'error' ? (
            <>
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{pendingCount} changes failed to sync</span>
              <button
                onClick={(e) => { e.stopPropagation(); syncService.syncAll(); }}
                className="ml-2 px-2 py-0.5 bg-black/20 rounded text-[10px]"
              >
                Retry
              </button>
            </>
          ) : pendingCount > 0 ? (
            <>
              <Cloud className="w-3.5 h-3.5" />
              <span>{pendingCount} changes pending sync</span>
            </>
          ) : null}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

// ============================================
// NOTIFICATION SETTINGS PANEL
// ============================================

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationPanel: React.FC<NotificationPanelProps> = ({ isOpen, onClose }) => {
  const [settings, setSettings] = useState({
    enabled: false,
    checkInReminder: true,
    checkInTime: '09:00',
    journalReminder: false,
    journalTime: '20:00',
    breathingReminder: false,
    breathingTime: '07:00',
    weeklyInsights: true,
    streakAlerts: true,
  });
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>('default');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    // Load current settings
    const loadSettings = async () => {
      try {
        const { offlineDB } = await import('../services/offlineDB');
        const saved = await offlineDB.notifications.get();
        setSettings(saved);
      } catch (err) {
        console.error('Failed to load notification settings:', err);
      }
    };
    loadSettings();

    // Check permission
    if ('Notification' in window) {
      setPermissionStatus(Notification.permission);
    }
  }, [isOpen]);

  const handleToggleNotifications = useCallback(async () => {
    setIsLoading(true);
    try {
      const { notificationService } = await import('../services/notificationService');
      
      if (!settings.enabled) {
        // Enable
        const permission = await notificationService.requestPermission();
        setPermissionStatus(permission);
        
        if (permission === 'granted') {
          await notificationService.subscribe();
          const newSettings = { ...settings, enabled: true };
          setSettings(newSettings);
          await notificationService.updateSettings(newSettings);
        }
      } else {
        // Disable
        await notificationService.unsubscribe();
        const newSettings = { ...settings, enabled: false };
        setSettings(newSettings);
        await notificationService.updateSettings(newSettings);
      }
    } catch (err) {
      console.error('Failed to toggle notifications:', err);
    } finally {
      setIsLoading(false);
    }
  }, [settings]);

  const handleSettingChange = useCallback(async (key: string, value: any) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    
    try {
      const { notificationService } = await import('../services/notificationService');
      await notificationService.updateSettings(newSettings as any);
    } catch (err) {
      console.error('Failed to update setting:', err);
    }
  }, [settings]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md mx-4 bg-[#0a0a0a] border border-white/10 rounded-2xl overflow-hidden max-h-[85vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/10 sticky top-0 bg-[#0a0a0a] z-10">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-purple-400" />
                <h2 className="font-display text-xl font-bold">Notifications</h2>
              </div>
              <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/10 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Permission warning */}
              {permissionStatus === 'denied' && (
                <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                  <BellOff className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-red-400 font-medium">Notifications Blocked</p>
                    <p className="text-xs text-red-400/60 mt-1">
                      You've blocked notifications. Please enable them in your browser settings to receive reminders.
                    </p>
                  </div>
                </div>
              )}

              {/* Master toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">Enable Notifications</p>
                  <p className="text-xs text-white/40 mt-0.5">Receive reminders and insights</p>
                </div>
                <button
                  onClick={handleToggleNotifications}
                  disabled={isLoading || permissionStatus === 'denied'}
                  className={`relative w-12 h-7 rounded-full transition-colors ${
                    settings.enabled ? 'bg-purple-500' : 'bg-white/10'
                  } ${isLoading ? 'opacity-50' : ''}`}
                >
                  <motion.div
                    className="absolute top-1 w-5 h-5 bg-white rounded-full shadow"
                    animate={{ left: settings.enabled ? 24 : 4 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                </button>
              </div>

              {settings.enabled && (
                <>
                  {/* Divider */}
                  <div className="border-t border-white/5" />

                  {/* Check-in Reminder */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white text-sm font-medium">Daily Check-in Reminder</p>
                        <p className="text-xs text-white/40">Get reminded to log your mood</p>
                      </div>
                      <button
                        onClick={() => handleSettingChange('checkInReminder', !settings.checkInReminder)}
                        className={`relative w-10 h-6 rounded-full transition-colors ${
                          settings.checkInReminder ? 'bg-purple-500' : 'bg-white/10'
                        }`}
                      >
                        <motion.div
                          className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow"
                          animate={{ left: settings.checkInReminder ? 18 : 2 }}
                          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        />
                      </button>
                    </div>
                    {settings.checkInReminder && (
                      <input
                        type="time"
                        value={settings.checkInTime}
                        onChange={(e) => handleSettingChange('checkInTime', e.target.value)}
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm"
                      />
                    )}
                  </div>

                  {/* Journal Reminder */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white text-sm font-medium">Journal Reminder</p>
                        <p className="text-xs text-white/40">Evening journaling prompt</p>
                      </div>
                      <button
                        onClick={() => handleSettingChange('journalReminder', !settings.journalReminder)}
                        className={`relative w-10 h-6 rounded-full transition-colors ${
                          settings.journalReminder ? 'bg-purple-500' : 'bg-white/10'
                        }`}
                      >
                        <motion.div
                          className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow"
                          animate={{ left: settings.journalReminder ? 18 : 2 }}
                          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        />
                      </button>
                    </div>
                    {settings.journalReminder && (
                      <input
                        type="time"
                        value={settings.journalTime}
                        onChange={(e) => handleSettingChange('journalTime', e.target.value)}
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm"
                      />
                    )}
                  </div>

                  {/* Breathing Reminder */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white text-sm font-medium">Breathing Exercise</p>
                        <p className="text-xs text-white/40">Mindful breathing prompt</p>
                      </div>
                      <button
                        onClick={() => handleSettingChange('breathingReminder', !settings.breathingReminder)}
                        className={`relative w-10 h-6 rounded-full transition-colors ${
                          settings.breathingReminder ? 'bg-purple-500' : 'bg-white/10'
                        }`}
                      >
                        <motion.div
                          className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow"
                          animate={{ left: settings.breathingReminder ? 18 : 2 }}
                          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        />
                      </button>
                    </div>
                    {settings.breathingReminder && (
                      <input
                        type="time"
                        value={settings.breathingTime}
                        onChange={(e) => handleSettingChange('breathingTime', e.target.value)}
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm"
                      />
                    )}
                  </div>

                  {/* Divider */}
                  <div className="border-t border-white/5" />

                  {/* Other notifications */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white text-sm font-medium">Weekly Insights</p>
                      <p className="text-xs text-white/40">Emotional wellness summary</p>
                    </div>
                    <button
                      onClick={() => handleSettingChange('weeklyInsights', !settings.weeklyInsights)}
                      className={`relative w-10 h-6 rounded-full transition-colors ${
                        settings.weeklyInsights ? 'bg-purple-500' : 'bg-white/10'
                      }`}
                    >
                      <motion.div
                        className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow"
                        animate={{ left: settings.weeklyInsights ? 18 : 2 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white text-sm font-medium">Streak Alerts</p>
                      <p className="text-xs text-white/40">Milestone celebrations</p>
                    </div>
                    <button
                      onClick={() => handleSettingChange('streakAlerts', !settings.streakAlerts)}
                      className={`relative w-10 h-6 rounded-full transition-colors ${
                        settings.streakAlerts ? 'bg-purple-500' : 'bg-white/10'
                      }`}
                    >
                      <motion.div
                        className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow"
                        animate={{ left: settings.streakAlerts ? 18 : 2 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      />
                    </button>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// ============================================
// MOBILE BOTTOM NAV (for PWA standalone mode)
// ============================================

interface MobileNavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  action: () => void;
  badge?: number;
}

interface MobileBottomNavProps {
  items: MobileNavItem[];
  activeId?: string;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ items, activeId }) => {
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    setIsStandalone(
      window.matchMedia('(display-mode: standalone)').matches || 
      (window.navigator as any).standalone === true
    );
  }, []);

  // Only show in standalone PWA mode on mobile
  if (!isStandalone) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[100] bg-[#0a0a0a]/95 border-t border-white/10 backdrop-blur-xl safe-area-bottom">
      <div className="flex items-center justify-around px-2 py-1">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={item.action}
            className={`relative flex flex-col items-center justify-center py-2 px-3 rounded-xl transition-colors ${
              activeId === item.id
                ? 'text-purple-400'
                : 'text-white/40 hover:text-white/60'
            }`}
          >
            {item.icon}
            <span className="text-[10px] mt-0.5 font-medium">{item.label}</span>
            {item.badge !== undefined && item.badge > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full text-[8px] text-white flex items-center justify-center font-bold">
                {item.badge > 9 ? '9+' : item.badge}
              </span>
            )}
          </button>
        ))}
      </div>
    </nav>
  );
};

// ============================================
// PULL TO REFRESH
// ============================================

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
}

export const PullToRefresh: React.FC<PullToRefreshProps> = ({ onRefresh, children }) => {
  const [pulling, setPulling] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const startY = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const threshold = 80;

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (containerRef.current?.scrollTop === 0) {
      startY.current = e.touches[0].clientY;
      setPulling(true);
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!pulling) return;
    const diff = e.touches[0].clientY - startY.current;
    if (diff > 0) {
      setPullDistance(Math.min(diff * 0.5, threshold * 1.5));
    }
  }, [pulling]);

  const handleTouchEnd = useCallback(async () => {
    setPulling(false);
    if (pullDistance >= threshold) {
      setRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setRefreshing(false);
      }
    }
    setPullDistance(0);
  }, [pullDistance, onRefresh]);

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="relative"
    >
      {/* Pull indicator */}
      <AnimatePresence>
        {(pullDistance > 10 || refreshing) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute top-0 left-0 right-0 flex items-center justify-center z-50"
            style={{ height: refreshing ? 48 : pullDistance }}
          >
            <motion.div
              animate={refreshing ? { rotate: 360 } : { rotate: pullDistance * 2 }}
              transition={refreshing ? { repeat: Infinity, duration: 1, ease: 'linear' } : {}}
            >
              <RefreshCw 
                className={`w-5 h-5 ${pullDistance >= threshold ? 'text-purple-400' : 'text-white/40'}`}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        animate={{ y: refreshing ? 48 : pullDistance > 10 ? pullDistance : 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        {children}
      </motion.div>
    </div>
  );
};

// ============================================
// HAPTIC FEEDBACK UTILITY
// ============================================

export const haptics = {
  light: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
  },
  medium: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(25);
    }
  },
  heavy: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([50, 30, 50]);
    }
  },
  success: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([10, 50, 30]);
    }
  },
  error: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([50, 50, 50, 50, 50]);
    }
  },
};

// ============================================
// SAFE AREA CSS HELPER
// ============================================

export const SafeAreaStyles = () => (
  <style>{`
    .safe-area-top { padding-top: env(safe-area-inset-top, 0px); }
    .safe-area-bottom { padding-bottom: env(safe-area-inset-bottom, 0px); }
    .safe-area-left { padding-left: env(safe-area-inset-left, 0px); }
    .safe-area-right { padding-right: env(safe-area-inset-right, 0px); }
    .safe-area-all {
      padding-top: env(safe-area-inset-top, 0px);
      padding-bottom: env(safe-area-inset-bottom, 0px);
      padding-left: env(safe-area-inset-left, 0px);
      padding-right: env(safe-area-inset-right, 0px);
    }
    
    /* Standalone PWA overrides */
    @media (display-mode: standalone) {
      body {
        -webkit-user-select: none;
        user-select: none;
        -webkit-tap-highlight-color: transparent;
        overscroll-behavior: none;
      }
      
      /* Extra bottom padding for bottom nav */
      .main-content {
        padding-bottom: calc(60px + env(safe-area-inset-bottom, 0px));
      }
    }
    
    /* Fix for iOS bounce scroll */
    @supports (-webkit-touch-callout: none) {
      body {
        height: -webkit-fill-available;
      }
      #root {
        min-height: -webkit-fill-available;
      }
    }
    
    /* Touch-friendly tap targets */
    @media (hover: none) and (pointer: coarse) {
      button, a, [role="button"] {
        min-height: 44px;
        min-width: 44px;
      }
      input, select, textarea {
        font-size: 16px !important; /* Prevent iOS zoom */
      }
    }
  `}</style>
);
