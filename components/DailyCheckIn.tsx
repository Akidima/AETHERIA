// Daily Check-in Component - Mood tracking with streaks
import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Flame, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { DailyCheckIn as CheckInType, EMOTION_CATEGORIES, MOOD_EMOJIS, VisualParams } from '../types';

interface DailyCheckInProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (checkIn: Omit<CheckInType, 'id' | 'createdAt'>) => void;
  onVisualize?: (params: VisualParams) => void;
  streak: number;
  todayCompleted: boolean;
}

const STORAGE_KEY = 'aetheria_checkins';

export const DailyCheckIn: React.FC<DailyCheckInProps> = ({
  isOpen,
  onClose,
  onComplete,
  onVisualize,
  streak,
  todayCompleted,
}) => {
  const [step, setStep] = useState(0);
  const [mood, setMood] = useState(3);
  const [selectedEmotions, setSelectedEmotions] = useState<string[]>([]);
  const [note, setNote] = useState('');

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setStep(0);
      setMood(3);
      setSelectedEmotions([]);
      setNote('');
    }
  }, [isOpen]);

  const toggleEmotion = useCallback((emotionId: string) => {
    setSelectedEmotions(prev => 
      prev.includes(emotionId)
        ? prev.filter(e => e !== emotionId)
        : [...prev, emotionId]
    );
  }, []);

  const handleComplete = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    
    // Calculate blended color from selected emotions
    const selectedColors = selectedEmotions
      .map(id => EMOTION_CATEGORIES.find(e => e.id === id)?.color)
      .filter(Boolean) as string[];
    
    let blendedColor = '#8B5CF6'; // default purple
    if (selectedColors.length > 0) {
      // Average the colors
      const avgR = Math.round(selectedColors.reduce((sum, c) => sum + parseInt(c.slice(1, 3), 16), 0) / selectedColors.length);
      const avgG = Math.round(selectedColors.reduce((sum, c) => sum + parseInt(c.slice(3, 5), 16), 0) / selectedColors.length);
      const avgB = Math.round(selectedColors.reduce((sum, c) => sum + parseInt(c.slice(5, 7), 16), 0) / selectedColors.length);
      blendedColor = `#${avgR.toString(16).padStart(2, '0')}${avgG.toString(16).padStart(2, '0')}${avgB.toString(16).padStart(2, '0')}`;
    }

    const params: VisualParams = {
      color: blendedColor,
      speed: 0.3 + (mood / 5) * 0.7, // 0.3 - 1.0 based on mood
      distort: 0.5 - (mood / 10), // Less distortion for better moods
      phrase: `Mood: ${MOOD_EMOJIS[mood]}`,
      explanation: selectedEmotions.length > 0 
        ? `Feeling ${selectedEmotions.map(id => EMOTION_CATEGORIES.find(e => e.id === id)?.label).join(', ')}`
        : 'Daily check-in complete',
    };

    onComplete({
      date: today,
      mood,
      emotions: selectedEmotions,
      note: note.trim() || undefined,
      params,
    });

    if (onVisualize) {
      onVisualize(params);
    }

    onClose();
  }, [mood, selectedEmotions, note, onComplete, onVisualize, onClose]);

  const nextStep = () => setStep(prev => Math.min(prev + 1, 2));
  const prevStep = () => setStep(prev => Math.max(prev - 1, 0));

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
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5" />
                <h2 className="font-display text-xl font-bold">Daily Check-in</h2>
              </div>
              <div className="flex items-center gap-3">
                {streak > 0 && (
                  <div className="flex items-center gap-1 px-2 py-1 bg-orange-500/20 border border-orange-500/30 rounded-full">
                    <Flame className="w-4 h-4 text-orange-400" />
                    <span className="text-sm font-mono text-orange-400">{streak}</span>
                  </div>
                )}
                <button
                  onClick={onClose}
                  className="p-2 text-white/60 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Already completed message */}
            {todayCompleted ? (
              <div className="p-8 text-center">
                <div className="text-6xl mb-4">✅</div>
                <h3 className="font-display text-xl font-bold mb-2">Already checked in today!</h3>
                <p className="text-white/60 mb-4">Come back tomorrow to continue your streak.</p>
                {streak > 0 && (
                  <div className="flex items-center justify-center gap-2 text-orange-400">
                    <Flame className="w-5 h-5" />
                    <span className="font-bold">{streak} day streak</span>
                  </div>
                )}
              </div>
            ) : (
              <>
                {/* Progress Indicators */}
                <div className="flex justify-center gap-2 pt-4">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        i <= step ? 'bg-white' : 'bg-white/20'
                      }`}
                    />
                  ))}
                </div>

                {/* Content */}
                <div className="p-6">
                  <AnimatePresence mode="wait">
                    {/* Step 0: Mood */}
                    {step === 0 && (
                      <motion.div
                        key="mood"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-6"
                      >
                        <p className="text-center text-lg">How are you feeling overall?</p>
                        <div className="flex justify-center gap-4">
                          {[1, 2, 3, 4, 5].map((value) => (
                            <button
                              key={value}
                              onClick={() => setMood(value)}
                              className={`text-4xl transition-transform hover:scale-110 ${
                                mood === value ? 'scale-125' : 'opacity-50'
                              }`}
                            >
                              {MOOD_EMOJIS[value]}
                            </button>
                          ))}
                        </div>
                        <p className="text-center text-sm text-white/50">
                          {mood === 1 && 'Not great'}
                          {mood === 2 && 'Could be better'}
                          {mood === 3 && 'Okay'}
                          {mood === 4 && 'Pretty good'}
                          {mood === 5 && 'Fantastic!'}
                        </p>
                      </motion.div>
                    )}

                    {/* Step 1: Emotions */}
                    {step === 1 && (
                      <motion.div
                        key="emotions"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-4"
                      >
                        <p className="text-center text-lg">What emotions are present?</p>
                        <p className="text-center text-sm text-white/50">Select all that apply</p>
                        <div className="grid grid-cols-2 gap-2">
                          {EMOTION_CATEGORIES.map((emotion) => (
                            <button
                              key={emotion.id}
                              onClick={() => toggleEmotion(emotion.id)}
                              className={`flex items-center gap-2 p-3 rounded-lg border transition-all ${
                                selectedEmotions.includes(emotion.id)
                                  ? 'border-white/30 bg-white/10'
                                  : 'border-white/10 hover:border-white/20'
                              }`}
                            >
                              <span className="text-xl">{emotion.emoji}</span>
                              <span className="text-sm">{emotion.label}</span>
                              <div
                                className="w-3 h-3 rounded-full ml-auto"
                                style={{ backgroundColor: emotion.color }}
                              />
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}

                    {/* Step 2: Note */}
                    {step === 2 && (
                      <motion.div
                        key="note"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-4"
                      >
                        <p className="text-center text-lg">Anything on your mind?</p>
                        <p className="text-center text-sm text-white/50">Optional - add a note for today</p>
                        <textarea
                          value={note}
                          onChange={(e) => setNote(e.target.value)}
                          placeholder="Write a few thoughts..."
                          className="w-full h-32 bg-white/5 border border-white/10 rounded-lg p-3 resize-none focus:outline-none focus:border-white/30"
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between p-6 border-t border-white/10">
                  <button
                    onClick={prevStep}
                    disabled={step === 0}
                    className="flex items-center gap-1 px-4 py-2 text-sm disabled:opacity-30 hover:bg-white/5 rounded-lg transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Back
                  </button>
                  
                  {step < 2 ? (
                    <button
                      onClick={nextStep}
                      className="flex items-center gap-1 px-4 py-2 text-sm bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                    >
                      Next
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={handleComplete}
                      className="px-6 py-2 text-sm bg-white text-black font-medium rounded-lg hover:bg-white/90 transition-colors"
                    >
                      Complete Check-in
                    </button>
                  )}
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Hook for managing check-ins
export function useCheckIns() {
  const [checkIns, setCheckIns] = useState<CheckInType[]>([]);
  const [streak, setStreak] = useState(0);
  const [todayCompleted, setTodayCompleted] = useState(false);

  // Load check-ins from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as CheckInType[];
        setCheckIns(parsed);
        
        // Calculate streak
        const today = new Date().toISOString().split('T')[0];
        setTodayCompleted(parsed.some(c => c.date === today));
        
        let currentStreak = 0;
        const sortedDates = [...new Set(parsed.map(c => c.date))].sort().reverse();
        
        for (let i = 0; i < sortedDates.length; i++) {
          const expectedDate = new Date();
          expectedDate.setDate(expectedDate.getDate() - i);
          const expected = expectedDate.toISOString().split('T')[0];
          
          if (sortedDates[i] === expected) {
            currentStreak++;
          } else if (i === 0 && sortedDates[i] === new Date(Date.now() - 86400000).toISOString().split('T')[0]) {
            // Allow yesterday if today not completed yet
            currentStreak++;
          } else {
            break;
          }
        }
        
        setStreak(currentStreak);
      }
    } catch (e) {
      console.warn('Failed to load check-ins');
    }
  }, []);

  const addCheckIn = useCallback((checkIn: Omit<CheckInType, 'id' | 'createdAt'>) => {
    const newCheckIn: CheckInType = {
      ...checkIn,
      id: Date.now().toString(),
      createdAt: Date.now(),
    };

    setCheckIns(prev => {
      const updated = [newCheckIn, ...prev];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });

    setTodayCompleted(true);
    setStreak(prev => prev + 1);

    return newCheckIn;
  }, []);

  return { checkIns, streak, todayCompleted, addCheckIn };
}
