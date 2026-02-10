// Accessibility Settings Component
import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Accessibility, Eye, Type, Zap, Monitor } from 'lucide-react';
import { AccessibilitySettings as A11ySettings } from '../types';

interface AccessibilitySettingsProps {
  isOpen: boolean;
  onClose: () => void;
  onSettingsChange: (settings: A11ySettings) => void;
}

const STORAGE_KEY = 'aetheria_accessibility';

export const AccessibilitySettings: React.FC<AccessibilitySettingsProps> = ({
  isOpen,
  onClose,
  onSettingsChange,
}) => {
  const [settings, setSettings] = useState<A11ySettings>({
    reducedMotion: false,
    highContrast: false,
    screenReaderMode: false,
    fontSize: 'medium',
  });

  // Load settings
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setSettings(parsed);
        applySettings(parsed);
      }
      
      // Check system preference for reduced motion
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (prefersReducedMotion) {
        setSettings(prev => ({ ...prev, reducedMotion: true }));
      }
    } catch (e) {
      console.warn('Failed to load accessibility settings');
    }
  }, []);

  // Apply settings to document
  const applySettings = useCallback((s: A11ySettings) => {
    const root = document.documentElement;
    
    // Reduced motion
    if (s.reducedMotion) {
      root.classList.add('reduce-motion');
    } else {
      root.classList.remove('reduce-motion');
    }
    
    // High contrast
    if (s.highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }
    
    // Screen reader mode
    if (s.screenReaderMode) {
      root.classList.add('screen-reader-mode');
    } else {
      root.classList.remove('screen-reader-mode');
    }
    
    // Font size
    root.style.setProperty('--base-font-size', 
      s.fontSize === 'small' ? '14px' : s.fontSize === 'large' ? '18px' : '16px'
    );
  }, []);

  const updateSetting = useCallback(<K extends keyof A11ySettings>(key: K, value: A11ySettings[K]) => {
    setSettings(prev => {
      const updated = { ...prev, [key]: value };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      applySettings(updated);
      onSettingsChange(updated);
      return updated;
    });
  }, [applySettings, onSettingsChange]);

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
            className="relative w-full max-w-md mx-4 bg-[#0a0a0a] border border-white/10 rounded-2xl overflow-hidden"
            role="dialog"
            aria-labelledby="a11y-title"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Accessibility className="w-5 h-5" />
                <h3 id="a11y-title" className="font-display text-lg font-bold">Accessibility</h3>
              </div>
              <button
                onClick={onClose}
                className="p-1 hover:bg-white/10 rounded-lg transition-colors"
                aria-label="Close accessibility settings"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              {/* Reduced Motion */}
              <button
                onClick={() => updateSetting('reducedMotion', !settings.reducedMotion)}
                className={`flex items-center justify-between w-full p-4 rounded-xl border transition-colors ${
                  settings.reducedMotion
                    ? 'border-green-500/30 bg-green-500/10'
                    : 'border-white/10 hover:border-white/20'
                }`}
                aria-pressed={settings.reducedMotion}
              >
                <div className="flex items-center gap-3">
                  <Zap className="w-5 h-5" />
                  <div className="text-left">
                    <p className="font-medium">Reduced Motion</p>
                    <p className="text-xs text-white/50">Minimize animations and transitions</p>
                  </div>
                </div>
                <div
                  className={`w-10 h-6 rounded-full transition-colors ${
                    settings.reducedMotion ? 'bg-green-500' : 'bg-white/20'
                  }`}
                >
                  <motion.div
                    className="w-5 h-5 bg-white rounded-full mt-0.5"
                    animate={{ x: settings.reducedMotion ? 18 : 2 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                </div>
              </button>

              {/* High Contrast */}
              <button
                onClick={() => updateSetting('highContrast', !settings.highContrast)}
                className={`flex items-center justify-between w-full p-4 rounded-xl border transition-colors ${
                  settings.highContrast
                    ? 'border-green-500/30 bg-green-500/10'
                    : 'border-white/10 hover:border-white/20'
                }`}
                aria-pressed={settings.highContrast}
              >
                <div className="flex items-center gap-3">
                  <Eye className="w-5 h-5" />
                  <div className="text-left">
                    <p className="font-medium">High Contrast</p>
                    <p className="text-xs text-white/50">Increase text and UI contrast</p>
                  </div>
                </div>
                <div
                  className={`w-10 h-6 rounded-full transition-colors ${
                    settings.highContrast ? 'bg-green-500' : 'bg-white/20'
                  }`}
                >
                  <motion.div
                    className="w-5 h-5 bg-white rounded-full mt-0.5"
                    animate={{ x: settings.highContrast ? 18 : 2 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                </div>
              </button>

              {/* Screen Reader Mode */}
              <button
                onClick={() => updateSetting('screenReaderMode', !settings.screenReaderMode)}
                className={`flex items-center justify-between w-full p-4 rounded-xl border transition-colors ${
                  settings.screenReaderMode
                    ? 'border-green-500/30 bg-green-500/10'
                    : 'border-white/10 hover:border-white/20'
                }`}
                aria-pressed={settings.screenReaderMode}
              >
                <div className="flex items-center gap-3">
                  <Monitor className="w-5 h-5" />
                  <div className="text-left">
                    <p className="font-medium">Screen Reader Mode</p>
                    <p className="text-xs text-white/50">Enhanced ARIA labels and descriptions</p>
                  </div>
                </div>
                <div
                  className={`w-10 h-6 rounded-full transition-colors ${
                    settings.screenReaderMode ? 'bg-green-500' : 'bg-white/20'
                  }`}
                >
                  <motion.div
                    className="w-5 h-5 bg-white rounded-full mt-0.5"
                    animate={{ x: settings.screenReaderMode ? 18 : 2 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                </div>
              </button>

              {/* Font Size */}
              <div className="p-4 rounded-xl border border-white/10 space-y-3">
                <div className="flex items-center gap-3">
                  <Type className="w-5 h-5" />
                  <div>
                    <p className="font-medium">Text Size</p>
                    <p className="text-xs text-white/50">Adjust the base font size</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {(['small', 'medium', 'large'] as const).map((size) => (
                    <button
                      key={size}
                      onClick={() => updateSetting('fontSize', size)}
                      className={`flex-1 py-2 rounded-lg border transition-colors capitalize ${
                        settings.fontSize === size
                          ? 'border-white/30 bg-white/10'
                          : 'border-white/10 hover:border-white/20'
                      }`}
                      style={{
                        fontSize: size === 'small' ? '12px' : size === 'large' ? '16px' : '14px',
                      }}
                      aria-pressed={settings.fontSize === size}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Keyboard Shortcuts */}
              <div className="p-4 rounded-xl border border-white/10 space-y-3">
                <p className="text-sm font-medium">Keyboard Navigation</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-2 p-2 bg-white/5 rounded">
                    <kbd className="px-2 py-0.5 bg-white/10 rounded font-mono">Tab</kbd>
                    <span className="text-white/60">Navigate</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-white/5 rounded">
                    <kbd className="px-2 py-0.5 bg-white/10 rounded font-mono">Enter</kbd>
                    <span className="text-white/60">Select</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-white/5 rounded">
                    <kbd className="px-2 py-0.5 bg-white/10 rounded font-mono">Esc</kbd>
                    <span className="text-white/60">Close</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-white/5 rounded">
                    <kbd className="px-2 py-0.5 bg-white/10 rounded font-mono">?</kbd>
                    <span className="text-white/60">Help</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Hook for accessibility settings
export function useAccessibility() {
  const [settings, setSettings] = useState<A11ySettings>({
    reducedMotion: false,
    highContrast: false,
    screenReaderMode: false,
    fontSize: 'medium',
  });

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setSettings(JSON.parse(saved));
      }
    } catch (e) {
      console.warn('Failed to load accessibility settings');
    }
  }, []);

  return settings;
}
