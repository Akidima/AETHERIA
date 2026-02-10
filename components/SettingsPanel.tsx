// Settings Panel Component
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Volume2, VolumeX } from 'lucide-react';
import { ThemeSelector } from './ThemeSelector';
import { VisualModeSelector } from './VisualModeSelector';
import { VisualMode } from '../types';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  visualMode: VisualMode;
  onVisualModeChange: (mode: VisualMode) => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  isOpen,
  onClose,
  soundEnabled,
  onToggleSound,
  visualMode,
  onVisualModeChange,
}) => {
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
            className="relative w-full max-w-md mx-4 max-h-[80vh] overflow-y-auto bg-[#0a0a0a] border border-white/10 rounded-2xl"
          >
            {/* Header */}
            <div className="sticky top-0 flex items-center justify-between p-6 border-b border-white/10 bg-[#0a0a0a] z-10">
              <h2 className="font-display text-2xl font-bold uppercase tracking-tight">
                Settings
              </h2>
              <button
                onClick={onClose}
                className="p-2 text-white/60 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-8">
              {/* Sound Toggle */}
              <div className="space-y-3">
                <p className="text-xs font-mono uppercase tracking-widest opacity-60">Sound</p>
                <button
                  onClick={onToggleSound}
                  className={`flex items-center gap-3 w-full p-4 rounded-lg border transition-all ${
                    soundEnabled
                      ? 'border-green-500/50 bg-green-500/10'
                      : 'border-white/10 hover:border-white/20'
                  }`}
                >
                  {soundEnabled ? (
                    <Volume2 className="w-5 h-5 text-green-400" />
                  ) : (
                    <VolumeX className="w-5 h-5 opacity-50" />
                  )}
                  <div className="text-left">
                    <p className="font-medium">{soundEnabled ? 'Sound Enabled' : 'Sound Disabled'}</p>
                    <p className="text-xs opacity-50">Ambient audio synthesis</p>
                  </div>
                  <div
                    className={`ml-auto w-10 h-6 rounded-full transition-colors ${
                      soundEnabled ? 'bg-green-500' : 'bg-white/20'
                    }`}
                  >
                    <motion.div
                      className="w-5 h-5 bg-white rounded-full mt-0.5"
                      animate={{ x: soundEnabled ? 18 : 2 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  </div>
                </button>
              </div>

              {/* Theme Selector */}
              <ThemeSelector />

              {/* Visual Mode Selector */}
              <VisualModeSelector
                value={visualMode}
                onChange={onVisualModeChange}
              />

              {/* Keyboard Shortcuts */}
              <div className="space-y-3">
                <p className="text-xs font-mono uppercase tracking-widest opacity-60">Keyboard Shortcuts</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {[
                    { key: 'M', action: 'Toggle Sound' },
                    { key: 'F', action: 'Fullscreen' },
                    { key: 'R', action: 'Reset' },
                    { key: 'Enter', action: 'Submit' },
                    { key: 'Esc', action: 'Close Modals' },
                  ].map(({ key, action }) => (
                    <div key={key} className="flex items-center gap-2 p-2 rounded bg-white/5">
                      <kbd className="px-2 py-0.5 bg-white/10 rounded text-xs font-mono">{key}</kbd>
                      <span className="opacity-60">{action}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
