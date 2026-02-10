import { useState, useEffect, useCallback, useRef } from 'react';
import { VisualParams, HistoryEntry, AppSettings, AMBIENT_PRESETS } from '../types';

const HISTORY_KEY = 'aetheria_history';
const SETTINGS_KEY = 'aetheria_settings';
const MAX_HISTORY = 50;

// ============================================
// HISTORY HOOK - Session tracking with localStorage
// ============================================
export function useHistory() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  // Load history from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(HISTORY_KEY);
      if (saved) {
        setHistory(JSON.parse(saved));
      }
    } catch (e) {
      console.warn('Failed to load history');
    }
  }, []);

  // Save history to localStorage
  const saveHistory = useCallback((entries: HistoryEntry[]) => {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(entries.slice(0, MAX_HISTORY)));
    } catch (e) {
      console.warn('Failed to save history');
    }
  }, []);

  // Add new entry
  const addEntry = useCallback((input: string, params: VisualParams) => {
    const entry: HistoryEntry = {
      id: Date.now().toString(),
      input,
      params,
      timestamp: Date.now(),
    };
    
    setHistory(prev => {
      const updated = [entry, ...prev].slice(0, MAX_HISTORY);
      saveHistory(updated);
      return updated;
    });
  }, [saveHistory]);

  // Clear history
  const clearHistory = useCallback(() => {
    setHistory([]);
    localStorage.removeItem(HISTORY_KEY);
  }, []);

  return { history, addEntry, clearHistory };
}

// ============================================
// SETTINGS HOOK - Persistent app settings
// ============================================
export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>({
    soundEnabled: false,
    visualMode: 'sphere',
    ambientMode: false,
  });

  // Load settings on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(SETTINGS_KEY);
      if (saved) {
        setSettings(prev => ({ ...prev, ...JSON.parse(saved) }));
      }
    } catch (e) {
      console.warn('Failed to load settings');
    }
  }, []);

  // Save settings
  const updateSettings = useCallback((updates: Partial<AppSettings>) => {
    setSettings(prev => {
      const updated = { ...prev, ...updates };
      try {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
      } catch (e) {
        console.warn('Failed to save settings');
      }
      return updated;
    });
  }, []);

  return { settings, updateSettings };
}

// ============================================
// KEYBOARD SHORTCUTS HOOK
// ============================================
interface KeyboardShortcutsOptions {
  onToggleSound: () => void;
  onToggleFullscreen: () => void;
  onReset: () => void;
  onSubmit: () => void;
  isInputFocused: boolean;
}

export function useKeyboardShortcuts({
  onToggleSound,
  onToggleFullscreen,
  onReset,
  onSubmit,
  isInputFocused,
}: KeyboardShortcutsOptions) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing (except for specific keys)
      const target = e.target as HTMLElement;
      const isTyping = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';

      switch (e.key.toLowerCase()) {
        case 'm':
          if (!isTyping) {
            e.preventDefault();
            onToggleSound();
          }
          break;
        case 'f':
          if (!isTyping) {
            e.preventDefault();
            onToggleFullscreen();
          }
          break;
        case 'escape':
          e.preventDefault();
          onReset();
          break;
        case ' ':
          if (!isTyping && !isInputFocused) {
            e.preventDefault();
            onSubmit();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onToggleSound, onToggleFullscreen, onReset, onSubmit, isInputFocused]);
}

// ============================================
// FULLSCREEN HOOK
// ============================================
export function useFullscreen() {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    
    document.addEventListener('fullscreenchange', handleChange);
    return () => document.removeEventListener('fullscreenchange', handleChange);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(console.warn);
    } else {
      document.exitFullscreen().catch(console.warn);
    }
  }, []);

  return { isFullscreen, toggleFullscreen };
}

// ============================================
// AMBIENT MODE HOOK - Auto-cycle through emotions
// ============================================
export function useAmbientMode(
  enabled: boolean,
  onParamsChange: (params: VisualParams) => void
) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const indexRef = useRef(0);

  useEffect(() => {
    if (enabled) {
      // Start cycling through presets
      const cycle = () => {
        indexRef.current = (indexRef.current + 1) % AMBIENT_PRESETS.length;
        onParamsChange(AMBIENT_PRESETS[indexRef.current]);
      };

      // Initial change
      onParamsChange(AMBIENT_PRESETS[0]);
      
      // Cycle every 10 seconds
      intervalRef.current = setInterval(cycle, 10000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [enabled, onParamsChange]);
}

// ============================================
// VOICE INPUT HOOK - Speech-to-text
// ============================================
export function useVoiceInput(onResult: (text: string) => void) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Check for browser support
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      setIsSupported(true);
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        onResult(transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = () => {
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [onResult]);

  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening) {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (e) {
        console.warn('Speech recognition error');
      }
    }
  }, [isListening]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }, [isListening]);

  return { isListening, isSupported, startListening, stopListening };
}

// ============================================
// SCREENSHOT HOOK - Capture canvas
// ============================================
export function useScreenshot() {
  const capture = useCallback(async (): Promise<string | null> => {
    try {
      // Find the Three.js canvas
      const canvas = document.querySelector('canvas');
      if (!canvas) return null;

      // Get data URL
      const dataUrl = canvas.toDataURL('image/png');
      return dataUrl;
    } catch (e) {
      console.error('Screenshot failed:', e);
      return null;
    }
  }, []);

  const download = useCallback(async (filename = 'aetheria-emotion.png') => {
    const dataUrl = await capture();
    if (!dataUrl) return;

    const link = document.createElement('a');
    link.download = filename;
    link.href = dataUrl;
    link.click();
  }, [capture]);

  const share = useCallback(async (title: string, text: string) => {
    const dataUrl = await capture();
    if (!dataUrl) return;

    // Convert to blob for sharing
    const response = await fetch(dataUrl);
    const blob = await response.blob();
    const file = new File([blob], 'aetheria-emotion.png', { type: 'image/png' });

    if (navigator.share && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          title,
          text,
          files: [file],
        });
      } catch (e) {
        // User cancelled or error
        console.log('Share cancelled');
      }
    } else {
      // Fallback: download
      download();
    }
  }, [capture, download]);

  return { capture, download, share };
}
