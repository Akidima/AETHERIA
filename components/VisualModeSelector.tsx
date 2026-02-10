// Visual Mode Selector Component
import React from 'react';
import { motion } from 'framer-motion';
import { Circle, Sparkles, Waves, Minus, Droplets, Hexagon, Cloud, Check } from 'lucide-react';
import { VisualMode, VISUAL_MODE_INFO } from '../types';

const MODE_ICONS: Record<VisualMode, React.ReactNode> = {
  sphere: <Circle className="w-5 h-5" />,
  particles: <Sparkles className="w-5 h-5" />,
  aurora: <Waves className="w-5 h-5" />,
  minimal: <Minus className="w-5 h-5" />,
  fluid: <Droplets className="w-5 h-5" />,
  geometric: <Hexagon className="w-5 h-5" />,
  nebula: <Cloud className="w-5 h-5" />,
};

interface VisualModeSelectorProps {
  value: VisualMode;
  onChange: (mode: VisualMode) => void;
  compact?: boolean;
}

export const VisualModeSelector: React.FC<VisualModeSelectorProps> = ({
  value,
  onChange,
  compact = false,
}) => {
  const modes = Object.keys(VISUAL_MODE_INFO) as VisualMode[];

  if (compact) {
    return (
      <div className="flex flex-wrap gap-1">
        {modes.map((mode) => (
          <button
            key={mode}
            onClick={() => onChange(mode)}
            className={`p-2 rounded-lg transition-all ${
              value === mode
                ? 'bg-white/20 ring-1 ring-white/30'
                : 'hover:bg-white/10'
            }`}
            title={VISUAL_MODE_INFO[mode].name}
          >
            {MODE_ICONS[mode]}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs font-mono uppercase tracking-widest opacity-60">Visual Mode</p>
      <div className="grid grid-cols-2 gap-2">
        {modes.map((mode) => (
          <motion.button
            key={mode}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onChange(mode)}
            className={`relative flex items-center gap-3 p-3 rounded-lg border transition-all ${
              value === mode
                ? 'border-white/30 bg-white/10'
                : 'border-white/10 hover:border-white/20'
            }`}
          >
            <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center">
              {MODE_ICONS[mode]}
            </div>
            <div className="text-left">
              <p className="text-sm font-medium">{VISUAL_MODE_INFO[mode].name}</p>
              <p className="text-xs opacity-50">{VISUAL_MODE_INFO[mode].description}</p>
            </div>
            {value === mode && (
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
