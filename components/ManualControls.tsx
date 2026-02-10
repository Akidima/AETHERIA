// Manual Controls Component - Color picker and sliders
import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sliders, RotateCcw, Save, Palette } from 'lucide-react';
import { VisualParams, CustomPreset, VisualMode } from '../types';

interface ManualControlsProps {
  isOpen: boolean;
  onClose: () => void;
  params: VisualParams;
  onParamsChange: (params: VisualParams) => void;
  visualMode: VisualMode;
  onSavePreset?: (preset: Omit<CustomPreset, 'id' | 'createdAt'>) => void;
}

// Predefined color palette
const COLOR_PALETTE = [
  '#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
  '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE',
  '#85C1E9', '#F8B500', '#00CED1', '#FF69B4', '#32CD32',
  '#FF4500', '#9370DB', '#20B2AA', '#FFB6C1', '#87CEEB',
];

export const ManualControls: React.FC<ManualControlsProps> = ({
  isOpen,
  onClose,
  params,
  onParamsChange,
  visualMode,
  onSavePreset,
}) => {
  const [presetName, setPresetName] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [customColor, setCustomColor] = useState(params.color);

  const handleColorChange = useCallback((color: string) => {
    setCustomColor(color);
    onParamsChange({ ...params, color });
  }, [params, onParamsChange]);

  const handleSpeedChange = useCallback((speed: number) => {
    onParamsChange({ ...params, speed });
  }, [params, onParamsChange]);

  const handleDistortChange = useCallback((distort: number) => {
    onParamsChange({ ...params, distort });
  }, [params, onParamsChange]);

  const handleReset = useCallback(() => {
    onParamsChange({
      color: '#ffffff',
      speed: 0.5,
      distort: 0.3,
      phrase: params.phrase,
      explanation: params.explanation,
    });
    setCustomColor('#ffffff');
  }, [params.phrase, params.explanation, onParamsChange]);

  const handleSavePreset = useCallback(() => {
    if (presetName.trim() && onSavePreset) {
      onSavePreset({
        name: presetName.trim(),
        params,
        visualMode,
        isPublic: false,
      });
      setPresetName('');
      setShowSaveDialog(false);
    }
  }, [presetName, params, visualMode, onSavePreset]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, x: 300 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 300 }}
          className="fixed top-24 right-20 w-80 bg-black/90 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden z-50"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            <div className="flex items-center gap-2">
              <Sliders className="w-5 h-5" />
              <h3 className="font-display text-lg font-bold">Manual Controls</h3>
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 space-y-6 max-h-[60vh] overflow-y-auto">
            {/* Color Picker Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-mono uppercase tracking-widest opacity-60">Color</label>
                <div 
                  className="w-6 h-6 rounded-full border border-white/20"
                  style={{ backgroundColor: customColor }}
                />
              </div>
              
              {/* Color Palette */}
              <div className="grid grid-cols-10 gap-1">
                {COLOR_PALETTE.map((color) => (
                  <button
                    key={color}
                    onClick={() => handleColorChange(color)}
                    className={`w-6 h-6 rounded-full transition-transform hover:scale-110 ${
                      customColor === color ? 'ring-2 ring-white ring-offset-2 ring-offset-black' : ''
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>

              {/* Custom Color Input */}
              <div className="flex items-center gap-2">
                <Palette className="w-4 h-4 opacity-50" />
                <input
                  type="color"
                  value={customColor}
                  onChange={(e) => handleColorChange(e.target.value)}
                  className="w-8 h-8 rounded cursor-pointer bg-transparent border-0"
                />
                <input
                  type="text"
                  value={customColor}
                  onChange={(e) => {
                    if (/^#[0-9A-Fa-f]{0,6}$/.test(e.target.value)) {
                      setCustomColor(e.target.value);
                      if (e.target.value.length === 7) {
                        handleColorChange(e.target.value);
                      }
                    }
                  }}
                  className="flex-1 bg-white/5 border border-white/10 rounded px-2 py-1 text-sm font-mono"
                  placeholder="#FFFFFF"
                />
              </div>
            </div>

            {/* Speed Slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-mono uppercase tracking-widest opacity-60">Speed</label>
                <span className="text-xs font-mono opacity-60">{params.speed.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0"
                max="2"
                step="0.01"
                value={params.speed}
                onChange={(e) => handleSpeedChange(parseFloat(e.target.value))}
                className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer slider"
              />
              <div className="flex justify-between text-xs opacity-40">
                <span>Slow</span>
                <span>Fast</span>
              </div>
            </div>

            {/* Distortion Slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-mono uppercase tracking-widest opacity-60">Distortion</label>
                <span className="text-xs font-mono opacity-60">{params.distort.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={params.distort}
                onChange={(e) => handleDistortChange(parseFloat(e.target.value))}
                className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer slider"
              />
              <div className="flex justify-between text-xs opacity-40">
                <span>Smooth</span>
                <span>Chaotic</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              <button
                onClick={handleReset}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                <span className="text-sm">Reset</span>
              </button>
              <button
                onClick={() => setShowSaveDialog(true)}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg transition-colors"
              >
                <Save className="w-4 h-4" />
                <span className="text-sm">Save Preset</span>
              </button>
            </div>

            {/* Save Preset Dialog */}
            <AnimatePresence>
              {showSaveDialog && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="p-3 bg-white/5 border border-white/10 rounded-lg space-y-3"
                >
                  <input
                    type="text"
                    value={presetName}
                    onChange={(e) => setPresetName(e.target.value)}
                    placeholder="Preset name..."
                    className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-sm"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowSaveDialog(false)}
                      className="flex-1 px-3 py-1.5 text-sm border border-white/10 rounded hover:bg-white/5 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSavePreset}
                      disabled={!presetName.trim()}
                      className="flex-1 px-3 py-1.5 text-sm bg-white/20 rounded hover:bg-white/30 transition-colors disabled:opacity-50"
                    >
                      Save
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Slider Styles */}
          <style>{`
            .slider::-webkit-slider-thumb {
              appearance: none;
              width: 16px;
              height: 16px;
              border-radius: 50%;
              background: white;
              cursor: pointer;
              border: 2px solid rgba(255,255,255,0.3);
            }
            .slider::-moz-range-thumb {
              width: 16px;
              height: 16px;
              border-radius: 50%;
              background: white;
              cursor: pointer;
              border: 2px solid rgba(255,255,255,0.3);
            }
          `}</style>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
