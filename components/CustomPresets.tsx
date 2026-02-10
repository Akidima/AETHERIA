// Custom Presets Component - Save and load parameter combinations
import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Bookmark, Trash2, Play, Plus, Globe, Lock } from 'lucide-react';
import { CustomPreset, VisualParams, VisualMode } from '../types';

interface CustomPresetsProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (preset: CustomPreset) => void;
  currentParams: VisualParams;
  currentMode: VisualMode;
}

const STORAGE_KEY = 'aetheria_presets';

export const CustomPresets: React.FC<CustomPresetsProps> = ({
  isOpen,
  onClose,
  onSelect,
  currentParams,
  currentMode,
}) => {
  const [presets, setPresets] = useState<CustomPreset[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');
  const [isPublic, setIsPublic] = useState(false);

  // Load presets from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setPresets(JSON.parse(saved));
      }
    } catch (e) {
      console.warn('Failed to load presets');
    }
  }, []);

  // Save presets to localStorage
  const savePresets = useCallback((updated: CustomPreset[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to save presets');
    }
  }, []);

  const handleAddPreset = useCallback(() => {
    if (!newPresetName.trim()) return;

    const newPreset: CustomPreset = {
      id: Date.now().toString(),
      name: newPresetName.trim(),
      params: currentParams,
      visualMode: currentMode,
      createdAt: Date.now(),
      isPublic,
    };

    setPresets(prev => {
      const updated = [newPreset, ...prev];
      savePresets(updated);
      return updated;
    });

    setNewPresetName('');
    setShowAddForm(false);
    setIsPublic(false);
  }, [newPresetName, currentParams, currentMode, isPublic, savePresets]);

  const handleDeletePreset = useCallback((id: string) => {
    setPresets(prev => {
      const updated = prev.filter(p => p.id !== id);
      savePresets(updated);
      return updated;
    });
  }, [savePresets]);

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
            className="relative w-full max-w-md mx-4 max-h-[80vh] overflow-hidden bg-[#0a0a0a] border border-white/10 rounded-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <div className="flex items-center gap-3">
                <Bookmark className="w-5 h-5" />
                <h2 className="font-display text-xl font-bold">My Presets</h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-white/60 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Add New Button */}
            <div className="p-4 border-b border-white/10">
              {!showAddForm ? (
                <button
                  onClick={() => setShowAddForm(true)}
                  className="w-full flex items-center justify-center gap-2 p-3 border border-dashed border-white/20 rounded-lg hover:border-white/40 hover:bg-white/5 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span className="text-sm">Save Current as Preset</span>
                </button>
              ) : (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-3"
                >
                  {/* Preview */}
                  <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                    <div
                      className="w-10 h-10 rounded-lg"
                      style={{ backgroundColor: currentParams.color }}
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{currentParams.phrase}</p>
                      <p className="text-xs text-white/50">
                        Speed: {currentParams.speed.toFixed(2)} • Distort: {currentParams.distort.toFixed(2)}
                      </p>
                    </div>
                  </div>

                  {/* Name Input */}
                  <input
                    type="text"
                    value={newPresetName}
                    onChange={(e) => setNewPresetName(e.target.value)}
                    placeholder="Preset name..."
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-white/30"
                    autoFocus
                  />

                  {/* Public Toggle */}
                  <button
                    onClick={() => setIsPublic(!isPublic)}
                    className={`flex items-center gap-2 w-full p-3 rounded-lg border transition-colors ${
                      isPublic ? 'border-green-500/30 bg-green-500/10' : 'border-white/10 bg-white/5'
                    }`}
                  >
                    {isPublic ? (
                      <Globe className="w-4 h-4 text-green-400" />
                    ) : (
                      <Lock className="w-4 h-4 text-white/50" />
                    )}
                    <span className="text-sm">{isPublic ? 'Public' : 'Private'}</span>
                  </button>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setShowAddForm(false);
                        setNewPresetName('');
                        setIsPublic(false);
                      }}
                      className="flex-1 px-4 py-2 text-sm border border-white/10 rounded-lg hover:bg-white/5 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAddPreset}
                      disabled={!newPresetName.trim()}
                      className="flex-1 px-4 py-2 text-sm bg-white text-black font-medium rounded-lg hover:bg-white/90 transition-colors disabled:opacity-50"
                    >
                      Save Preset
                    </button>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Presets List */}
            <div className="overflow-y-auto max-h-[50vh]">
              {presets.length === 0 ? (
                <div className="p-8 text-center">
                  <Bookmark className="w-10 h-10 mx-auto mb-3 opacity-20" />
                  <p className="text-white/50">No presets saved yet</p>
                  <p className="text-xs text-white/30 mt-1">Save your favorite combinations to use later</p>
                </div>
              ) : (
                <div className="p-2 space-y-2">
                  {presets.map((preset) => (
                    <motion.div
                      key={preset.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="group flex items-center gap-3 p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                    >
                      <div
                        className="w-10 h-10 rounded-lg flex-shrink-0"
                        style={{ backgroundColor: preset.params.color }}
                      />
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium truncate">{preset.name}</p>
                          {preset.isPublic && (
                            <Globe className="w-3 h-3 text-green-400 flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-white/50 truncate">
                          {preset.params.phrase}
                        </p>
                      </div>

                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => onSelect(preset)}
                          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                          title="Apply Preset"
                        >
                          <Play className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeletePreset(preset.id)}
                          className="p-2 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"
                          title="Delete Preset"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Hook for managing presets
export function usePresets() {
  const [presets, setPresets] = useState<CustomPreset[]>([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setPresets(JSON.parse(saved));
      }
    } catch (e) {
      console.warn('Failed to load presets');
    }
  }, []);

  const addPreset = useCallback((preset: Omit<CustomPreset, 'id' | 'createdAt'>) => {
    const newPreset: CustomPreset = {
      ...preset,
      id: Date.now().toString(),
      createdAt: Date.now(),
    };

    setPresets(prev => {
      const updated = [newPreset, ...prev];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });

    return newPreset;
  }, []);

  const deletePreset = useCallback((id: string) => {
    setPresets(prev => {
      const updated = prev.filter(p => p.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  return { presets, addPreset, deletePreset };
}
