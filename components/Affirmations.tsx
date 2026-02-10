// Affirmations Component - AI-generated personalized affirmations
import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, RefreshCw, Copy, Check, Heart, Bookmark } from 'lucide-react';
import { Affirmation, VisualParams } from '../types';

interface AffirmationsProps {
  isOpen: boolean;
  onClose: () => void;
  currentEmotion?: string;
  currentParams?: VisualParams;
}

// Pre-defined affirmations by category
const AFFIRMATION_BANK: Record<string, string[]> = {
  encouragement: [
    "You are capable of handling whatever comes your way today.",
    "Your potential is limitless, and today is full of possibilities.",
    "Every step forward, no matter how small, is progress.",
    "You have overcome challenges before, and you will overcome this too.",
    "Your courage is stronger than your fear.",
  ],
  gratitude: [
    "There is so much beauty in your life, even in the small moments.",
    "You are surrounded by love, even when it's hard to see.",
    "Every breath is a gift, and you are worthy of abundance.",
    "The universe conspires in your favor.",
    "You attract positivity and good energy.",
  ],
  strength: [
    "You are resilient, and this too shall pass.",
    "Your strength runs deeper than you know.",
    "Challenges are opportunities for growth in disguise.",
    "You are the author of your own story.",
    "Within you lies infinite power to create change.",
  ],
  peace: [
    "In this moment, you are exactly where you need to be.",
    "Peace flows through you like a gentle stream.",
    "You release what no longer serves you.",
    "Your mind is calm, your heart is open.",
    "Serenity is your natural state.",
  ],
  growth: [
    "Every day, you are becoming a better version of yourself.",
    "Your journey is unique, and your path is valid.",
    "Mistakes are just lessons in beautiful disguise.",
    "You are constantly evolving and expanding.",
    "The best is yet to come.",
  ],
};

// Map emotions/colors to affirmation categories
const EMOTION_TO_CATEGORY: Record<string, string> = {
  happy: 'gratitude',
  joy: 'gratitude',
  excited: 'encouragement',
  sad: 'encouragement',
  anxious: 'peace',
  worried: 'peace',
  calm: 'peace',
  peaceful: 'peace',
  angry: 'strength',
  frustrated: 'strength',
  tired: 'encouragement',
  hopeful: 'growth',
  grateful: 'gratitude',
  loved: 'gratitude',
};

const STORAGE_KEY = 'aetheria_saved_affirmations';

export const Affirmations: React.FC<AffirmationsProps> = ({
  isOpen,
  onClose,
  currentEmotion,
  currentParams,
}) => {
  const [currentAffirmation, setCurrentAffirmation] = useState<Affirmation | null>(null);
  const [savedAffirmations, setSavedAffirmations] = useState<Affirmation[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showSaved, setShowSaved] = useState(false);

  // Load saved affirmations
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setSavedAffirmations(JSON.parse(saved));
      }
    } catch (e) {
      console.warn('Failed to load saved affirmations');
    }
  }, []);

  // Generate initial affirmation when opened
  useEffect(() => {
    if (isOpen && !currentAffirmation) {
      generateAffirmation();
    }
  }, [isOpen]);

  const getCategory = useCallback((): string => {
    // Try to match emotion
    if (currentEmotion) {
      const emotion = currentEmotion.toLowerCase();
      for (const [key, category] of Object.entries(EMOTION_TO_CATEGORY)) {
        if (emotion.includes(key)) {
          return category;
        }
      }
    }
    
    // Default based on color hue
    if (currentParams?.color) {
      const hex = currentParams.color.replace('#', '');
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      
      // Simple hue-based categorization
      if (r > g && r > b) return 'strength'; // Red tones
      if (g > r && g > b) return 'growth'; // Green tones
      if (b > r && b > g) return 'peace'; // Blue tones
      if (r > 200 && g > 200) return 'gratitude'; // Warm/yellow tones
    }
    
    // Random category
    const categories = Object.keys(AFFIRMATION_BANK);
    return categories[Math.floor(Math.random() * categories.length)];
  }, [currentEmotion, currentParams]);

  const generateAffirmation = useCallback(() => {
    setIsGenerating(true);
    
    // Simulate generation delay for effect
    setTimeout(() => {
      const category = getCategory();
      const affirmations = AFFIRMATION_BANK[category] || AFFIRMATION_BANK.encouragement;
      const text = affirmations[Math.floor(Math.random() * affirmations.length)];
      
      setCurrentAffirmation({
        id: Date.now().toString(),
        text,
        emotion: currentEmotion || 'general',
        category: category as Affirmation['category'],
      });
      setIsGenerating(false);
    }, 600);
  }, [getCategory, currentEmotion]);

  const handleCopy = useCallback(() => {
    if (!currentAffirmation) return;
    navigator.clipboard.writeText(currentAffirmation.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [currentAffirmation]);

  const handleSave = useCallback(() => {
    if (!currentAffirmation) return;
    
    const isAlreadySaved = savedAffirmations.some(a => a.text === currentAffirmation.text);
    if (isAlreadySaved) return;

    setSavedAffirmations(prev => {
      const updated = [currentAffirmation, ...prev].slice(0, 50); // Keep max 50
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, [currentAffirmation, savedAffirmations]);

  const handleRemoveSaved = useCallback((id: string) => {
    setSavedAffirmations(prev => {
      const updated = prev.filter(a => a.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const isSaved = currentAffirmation && savedAffirmations.some(a => a.text === currentAffirmation.text);

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
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                <h3 className="font-display text-lg font-bold">Affirmations</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowSaved(!showSaved)}
                  className={`p-2 rounded-lg transition-colors ${
                    showSaved ? 'bg-white/10' : 'hover:bg-white/10'
                  }`}
                  title="Saved affirmations"
                >
                  <Bookmark className={`w-4 h-4 ${showSaved ? 'fill-current' : ''}`} />
                </button>
                <button
                  onClick={onClose}
                  className="p-1 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              {showSaved ? (
                // Saved Affirmations View
                <div className="space-y-4">
                  <h4 className="text-sm font-mono uppercase tracking-widest opacity-60">Saved ({savedAffirmations.length})</h4>
                  {savedAffirmations.length === 0 ? (
                    <div className="text-center py-8">
                      <Bookmark className="w-10 h-10 mx-auto mb-3 opacity-20" />
                      <p className="text-white/50">No saved affirmations yet</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[50vh] overflow-y-auto">
                      {savedAffirmations.map((affirmation) => (
                        <motion.div
                          key={affirmation.id}
                          layout
                          className="group flex items-start gap-3 p-3 bg-white/5 rounded-lg"
                        >
                          <Heart className="w-4 h-4 mt-0.5 text-pink-400 flex-shrink-0" />
                          <p className="flex-1 text-sm">{affirmation.text}</p>
                          <button
                            onClick={() => handleRemoveSaved(affirmation.id)}
                            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white/10 rounded transition-all"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                // Current Affirmation View
                <div className="space-y-6">
                  {/* Affirmation Display */}
                  <div className="relative min-h-[150px] flex items-center justify-center">
                    <AnimatePresence mode="wait">
                      {isGenerating ? (
                        <motion.div
                          key="loading"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                        >
                          <Sparkles className="w-8 h-8 animate-pulse" />
                        </motion.div>
                      ) : currentAffirmation ? (
                        <motion.div
                          key={currentAffirmation.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          className="text-center"
                        >
                          <p className="text-xl md:text-2xl font-display leading-relaxed">
                            "{currentAffirmation.text}"
                          </p>
                          <p className="mt-4 text-xs text-white/40 uppercase tracking-widest">
                            {currentAffirmation.category}
                          </p>
                        </motion.div>
                      ) : null}
                    </AnimatePresence>
                  </div>

                  {/* Actions */}
                  <div className="flex justify-center gap-3">
                    <button
                      onClick={generateAffirmation}
                      disabled={isGenerating}
                      className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors disabled:opacity-50"
                    >
                      <RefreshCw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
                      <span className="text-sm">New</span>
                    </button>
                    
                    <button
                      onClick={handleCopy}
                      className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                    >
                      {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                      <span className="text-sm">{copied ? 'Copied' : 'Copy'}</span>
                    </button>
                    
                    <button
                      onClick={handleSave}
                      disabled={isSaved}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                        isSaved
                          ? 'bg-pink-500/20 text-pink-400'
                          : 'bg-white/10 hover:bg-white/20'
                      }`}
                    >
                      <Heart className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
                      <span className="text-sm">{isSaved ? 'Saved' : 'Save'}</span>
                    </button>
                  </div>

                  {/* Tip */}
                  <p className="text-center text-xs text-white/30">
                    Affirmations are personalized based on your current emotional state
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
