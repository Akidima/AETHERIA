// Theme Context - Manages app-wide theming
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Theme, ThemeMode, THEME_PRESETS } from '../types';

interface ThemeContextValue {
  theme: Theme;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  setCustomTheme: (theme: Partial<Theme>) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const STORAGE_KEY = 'aetheria-theme';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themeMode, setThemeModeState] = useState<ThemeMode>('dark');
  const [customTheme, setCustomThemeState] = useState<Partial<Theme>>({});

  // Load saved theme
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const { mode, custom } = JSON.parse(saved);
        if (mode) setThemeModeState(mode);
        if (custom) setCustomThemeState(custom);
      }
    } catch (e) {
      console.warn('Failed to load theme:', e);
    }
  }, []);

  // Get current theme
  const theme: Theme = themeMode === 'custom' 
    ? { ...THEME_PRESETS[0], ...customTheme, id: 'custom', name: 'Custom' }
    : THEME_PRESETS.find(t => t.id === themeMode) || THEME_PRESETS[0];

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--theme-background', theme.background);
    root.style.setProperty('--theme-background-gradient', theme.backgroundGradient || theme.background);
    root.style.setProperty('--theme-text-primary', theme.textPrimary);
    root.style.setProperty('--theme-text-secondary', theme.textSecondary);
    root.style.setProperty('--theme-accent', theme.accent);
    root.style.setProperty('--theme-surface', theme.surface);
    root.style.setProperty('--theme-border', theme.border);

    // Update body background
    document.body.style.background = theme.backgroundGradient || theme.background;
    document.body.style.color = theme.textPrimary;
  }, [theme]);

  const setThemeMode = useCallback((mode: ThemeMode) => {
    setThemeModeState(mode);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ mode, custom: customTheme }));
  }, [customTheme]);

  const setCustomTheme = useCallback((custom: Partial<Theme>) => {
    setCustomThemeState(custom);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ mode: 'custom', custom }));
    setThemeModeState('custom');
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, themeMode, setThemeMode, setCustomTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};
