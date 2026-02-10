// Theme Selector Component
import React from 'react';
import { motion } from 'framer-motion';
import { Sun, Moon, Sparkles, Minus, Check } from 'lucide-react';
import { THEME_PRESETS, ThemeMode } from '../types';
import { useTheme } from '../contexts/ThemeContext';

const THEME_ICONS: Record<ThemeMode, React.ReactNode> = {
  dark: <Moon className="w-4 h-4" />,
  light: <Sun className="w-4 h-4" />,
  cosmic: <Sparkles className="w-4 h-4" />,
  minimal: <Minus className="w-4 h-4" />,
  custom: <div className="w-4 h-4 rounded-full bg-gradient-to-br from-pink-500 to-purple-500" />,
};

interface ThemeSelectorProps {
  compact?: boolean;
}

export const ThemeSelector: React.FC<ThemeSelectorProps> = ({ compact = false }) => {
  const { themeMode, setThemeMode, theme } = useTheme();

  if (compact) {
    return (
      <div className="flex gap-1">
        {THEME_PRESETS.map((preset) => (
          <button
            key={preset.id}
            onClick={() => setThemeMode(preset.id)}
            className={`p-2 rounded-lg transition-all ${
              themeMode === preset.id
                ? 'bg-white/20 ring-1 ring-white/30'
                : 'hover:bg-white/10'
            }`}
            title={preset.name}
          >
            {THEME_ICONS[preset.id]}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs font-mono uppercase tracking-widest opacity-60">Theme</p>
      <div className="grid grid-cols-2 gap-2">
        {THEME_PRESETS.map((preset) => (
          <motion.button
            key={preset.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setThemeMode(preset.id)}
            className={`relative flex items-center gap-3 p-3 rounded-lg border transition-all ${
              themeMode === preset.id
                ? 'border-white/30 bg-white/10'
                : 'border-white/10 hover:border-white/20'
            }`}
          >
            {/* Preview */}
            <div
              className="w-8 h-8 rounded-md border border-white/10 flex items-center justify-center"
              style={{ background: preset.background }}
            >
              <div
                className="w-3 h-3 rounded-full"
                style={{ background: preset.accent }}
              />
            </div>
            
            {/* Label */}
            <span className="text-sm font-medium">{preset.name}</span>
            
            {/* Check */}
            {themeMode === preset.id && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute top-2 right-2"
              >
                <Check className="w-4 h-4 text-green-400" />
              </motion.div>
            )}
          </motion.button>
        ))}
      </div>
    </div>
  );
};
