// Breathing & Grounding Exercises Component
// Interactive breathing guides, SOS mode, grounding exercises, session tracking, reminders
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Play, Pause, RotateCcw, Volume2, VolumeX, ChevronLeft,
  Clock, Plus, Trash2, Bell, BellOff, Settings, AlertTriangle,
  Activity, Waves, Hand, Timer, Check, ChevronRight
} from 'lucide-react';
import {
  VisualParams, BreathingTechnique, BreathingPattern, BreathingPreset,
  BreathingSession, GroundingExercise,
  BREATHING_PRESETS, GROUNDING_EXERCISES,
} from '../types';
import { useBreathingStore } from '../store/useStore';
import { audioService } from '../services/audioService';

// ============================================
// PROPS
// ============================================
interface BreathingExercisesProps {
  isOpen: boolean;
  onClose: () => void;
  onParamsChange: (params: VisualParams) => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

type BreathPhase = 'inhale' | 'hold' | 'exhale' | 'holdAfter' | 'idle';
type ViewMode = 'menu' | 'breathing' | 'grounding' | 'custom' | 'history' | 'reminders' | 'sos';

// ============================================
// MAIN COMPONENT
// ============================================
export const BreathingExercises: React.FC<BreathingExercisesProps> = ({
  isOpen,
  onClose,
  onParamsChange,
  soundEnabled,
  onToggleSound,
}) => {
  const [view, setView] = useState<ViewMode>('menu');
  const [activePreset, setActivePreset] = useState<BreathingPreset | null>(null);
  const [activeGrounding, setActiveGrounding] = useState<GroundingExercise | null>(null);
  const [groundingStep, setGroundingStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [phase, setPhase] = useState<BreathPhase>('idle');
  const [phaseTime, setPhaseTime] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [guidance, setGuidance] = useState('');
  const [sessionStartTime, setSessionStartTime] = useState(0);

  // Custom pattern state
  const [customName, setCustomName] = useState('');
  const [customInhale, setCustomInhale] = useState(4);
  const [customHold, setCustomHold] = useState(4);
  const [customExhale, setCustomExhale] = useState(4);
  const [customHoldAfter, setCustomHoldAfter] = useState(4);

  // Reminder state
  const [reminderTime, setReminderTime] = useState('09:00');
  const [reminderTechnique, setReminderTechnique] = useState<BreathingTechnique>('box');

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const {
    sessions,
    customPatterns,
    reminders,
    totalSessions,
    totalMinutes,
    addSession,
    addCustomPattern,
    removeCustomPattern,
    addReminder,
    updateReminder,
    removeReminder,
    getWeeklyStats,
  } = useBreathingStore();

  const weeklyStats = useMemo(() => getWeeklyStats(), [sessions]);

  // Clean up on close
  useEffect(() => {
    if (!isOpen) {
      setIsPlaying(false);
      setActivePreset(null);
      setActiveGrounding(null);
      setPhase('idle');
      setView('menu');
      setGroundingStep(0);
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
  }, [isOpen]);

  // Breathing cycle logic
  useEffect(() => {
    if (!isPlaying || !activePreset) return;

    const { pattern, guidance: presetGuidance } = activePreset;
    const phases: { phase: BreathPhase; duration: number; guidanceIndex: number }[] = ([
      { phase: 'inhale' as BreathPhase, duration: pattern.inhale, guidanceIndex: 0 },
      { phase: 'hold' as BreathPhase, duration: pattern.hold, guidanceIndex: 1 },
      { phase: 'exhale' as BreathPhase, duration: pattern.exhale, guidanceIndex: 2 },
      { phase: 'holdAfter' as BreathPhase, duration: pattern.holdAfter, guidanceIndex: 3 },
    ]).filter(p => p.duration > 0);

    let currentPhaseIndex = 0;
    let currentPhaseTime = 0;
    let currentTotalTime = totalTime;

    setPhase(phases[0].phase);
    setGuidance(presetGuidance?.[phases[0].guidanceIndex] || getDefaultGuidance(phases[0].phase));

    intervalRef.current = setInterval(() => {
      currentPhaseTime += 0.1;
      currentTotalTime += 0.1;
      setPhaseTime(currentPhaseTime);
      setTotalTime(currentTotalTime);

      if (currentPhaseTime >= phases[currentPhaseIndex].duration) {
        currentPhaseTime = 0;
        currentPhaseIndex = (currentPhaseIndex + 1) % phases.length;

        const newPhase = phases[currentPhaseIndex];
        setPhase(newPhase.phase);
        setGuidance(presetGuidance?.[newPhase.guidanceIndex] || getDefaultGuidance(newPhase.phase));
      }

      // Check if session is complete (SOS mode has no time limit)
      if (activePreset.duration > 0 && currentTotalTime >= activePreset.duration) {
        setIsPlaying(false);
        setPhase('idle');
        setGuidance('Session complete. Well done.');
        completeSession(currentTotalTime);
      }
    }, 100);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying, activePreset]);

  // Update visuals based on phase
  useEffect(() => {
    if (!activePreset || phase === 'idle') return;

    const baseParams = activePreset.visualParams;
    const modifiedParams = { ...baseParams };

    switch (phase) {
      case 'inhale':
        modifiedParams.speed = baseParams.speed * 1.5;
        modifiedParams.distort = baseParams.distort * 0.5;
        break;
      case 'hold':
        modifiedParams.speed = baseParams.speed * 0.3;
        modifiedParams.distort = baseParams.distort * 1.2;
        break;
      case 'exhale':
        modifiedParams.speed = baseParams.speed * 0.8;
        modifiedParams.distort = baseParams.distort * 0.8;
        break;
      case 'holdAfter':
        modifiedParams.speed = baseParams.speed * 0.2;
        modifiedParams.distort = baseParams.distort * 0.3;
        break;
    }

    onParamsChange(modifiedParams);
  }, [phase, activePreset, onParamsChange]);

  const getDefaultGuidance = (p: BreathPhase): string => {
    switch (p) {
      case 'inhale': return 'Breathe in...';
      case 'hold': return 'Hold...';
      case 'exhale': return 'Breathe out...';
      case 'holdAfter': return 'Rest...';
      default: return '';
    }
  };

  const completeSession = useCallback((duration: number) => {
    if (!activePreset) return;
    const session: BreathingSession = {
      id: Date.now().toString(),
      technique: activePreset.id,
      techniqueName: activePreset.name,
      pattern: activePreset.pattern,
      duration: Math.round(duration),
      completedAt: Date.now(),
      date: new Date().toISOString().split('T')[0],
    };
    addSession(session);
  }, [activePreset, addSession]);

  const startBreathing = useCallback((preset: BreathingPreset) => {
    setActivePreset(preset);
    setTotalTime(0);
    setPhaseTime(0);
    setIsPlaying(true);
    setSessionStartTime(Date.now());
    setView(preset.id === 'sos' ? 'sos' : 'breathing');
    onParamsChange(preset.visualParams);

    if (soundEnabled) {
      audioService.start(preset.visualParams.color, preset.visualParams.speed, preset.visualParams.distort);
    }
  }, [soundEnabled, onParamsChange]);

  const stopSOS = useCallback(() => {
    if (activePreset && totalTime > 10) {
      completeSession(totalTime);
    }
    setIsPlaying(false);
    setPhase('idle');
    setActivePreset(null);
    setView('menu');
    setTotalTime(0);
  }, [activePreset, totalTime, completeSession]);

  const togglePlay = () => {
    if (!isPlaying && activePreset && activePreset.duration > 0 && totalTime >= activePreset.duration) {
      // Reset if session was completed
      setTotalTime(0);
      setPhaseTime(0);
    }
    setIsPlaying(!isPlaying);
  };

  const resetSession = () => {
    setTotalTime(0);
    setPhaseTime(0);
    setPhase('idle');
    setIsPlaying(false);
  };

  const handleEndSession = useCallback(() => {
    if (totalTime > 10) {
      completeSession(totalTime);
    }
    setIsPlaying(false);
    setPhase('idle');
    setActivePreset(null);
    setView('menu');
    setTotalTime(0);
  }, [totalTime, completeSession]);

  const getPhaseProgress = (): number => {
    if (!activePreset || phase === 'idle') return 0;
    const duration = activePreset.pattern[phase] || 1;
    return Math.min(phaseTime / duration, 1);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const startCustomBreathing = () => {
    if (!customName.trim()) return;
    const customPreset: BreathingPreset = {
      id: 'custom',
      name: customName,
      description: 'Custom pattern',
      icon: '🎛️',
      pattern: { inhale: customInhale, hold: customHold, exhale: customExhale, holdAfter: customHoldAfter },
      duration: 300,
      visualParams: { color: '#A78BFA', speed: 0.35, distort: 0.25, phrase: customName, explanation: 'Your personalized breathing pattern.' },
      guidance: ['Breathe in...', 'Hold...', 'Breathe out...', 'Rest...'],
      category: 'calming',
    };
    startBreathing(customPreset);
  };

  const saveCustomPattern = () => {
    if (!customName.trim()) return;
    addCustomPattern(customName, { inhale: customInhale, hold: customHold, exhale: customExhale, holdAfter: customHoldAfter });
    setCustomName('');
  };

  const handleAddReminder = () => {
    addReminder(reminderTime, reminderTechnique, [0, 1, 2, 3, 4, 5, 6]);
    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  };

  // Start grounding exercise
  const startGrounding = (exercise: GroundingExercise) => {
    setActiveGrounding(exercise);
    setGroundingStep(0);
    setView('grounding');
    onParamsChange(exercise.visualParams);
  };

  const getBreathingScale = (): number => {
    if (phase === 'inhale') return 1 + getPhaseProgress() * 0.4;
    if (phase === 'exhale') return 1.4 - getPhaseProgress() * 0.4;
    if (phase === 'hold') return 1.4;
    if (phase === 'holdAfter') return 1;
    return 1;
  };

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
            className="relative w-full max-w-2xl mx-4 max-h-[85vh] overflow-hidden bg-[#0a0a0a] border border-white/10 rounded-2xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/10 flex-shrink-0">
              <div className="flex items-center gap-3">
                {view !== 'menu' && (
                  <button
                    onClick={() => {
                      if (isPlaying && view === 'sos') {
                        stopSOS();
                      } else if (isPlaying) {
                        handleEndSession();
                      } else {
                        setView('menu');
                        setActivePreset(null);
                        setActiveGrounding(null);
                      }
                    }}
                    className="p-1 text-white/60 hover:text-white transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                )}
                <Waves className="w-5 h-5 text-cyan-400" />
                <h2 className="font-display text-xl font-bold">
                  {view === 'sos' ? 'Panic SOS' : view === 'grounding' ? 'Grounding' : view === 'breathing' ? (activePreset?.name || 'Breathing') : 'Breathe & Ground'}
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={onToggleSound}
                  className="p-2 rounded-full hover:bg-white/10 transition-colors"
                >
                  {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </button>
                <button
                  onClick={onClose}
                  className="p-2 text-white/60 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <AnimatePresence mode="wait">
                {/* ===== MENU VIEW ===== */}
                {view === 'menu' && (
                  <motion.div
                    key="menu"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-6"
                  >
                    {/* Quick Stats */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="p-3 bg-white/5 rounded-xl text-center">
                        <p className="text-2xl font-bold">{totalSessions}</p>
                        <p className="text-[10px] text-white/40 font-mono uppercase">Total Sessions</p>
                      </div>
                      <div className="p-3 bg-white/5 rounded-xl text-center">
                        <p className="text-2xl font-bold">{totalMinutes}</p>
                        <p className="text-[10px] text-white/40 font-mono uppercase">Minutes</p>
                      </div>
                      <div className="p-3 bg-white/5 rounded-xl text-center">
                        <p className="text-2xl font-bold">{weeklyStats.totalSessions}</p>
                        <p className="text-[10px] text-white/40 font-mono uppercase">This Week</p>
                      </div>
                    </div>

                    {/* SOS Button */}
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        const sosPreset = BREATHING_PRESETS.find(p => p.id === 'sos')!;
                        startBreathing(sosPreset);
                      }}
                      className="w-full p-5 rounded-xl border-2 border-red-500/30 bg-red-500/5 hover:bg-red-500/10 text-left transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center text-2xl">
                          🆘
                        </div>
                        <div className="flex-1">
                          <h3 className="font-display text-lg font-bold text-red-400">Panic SOS</h3>
                          <p className="text-sm text-white/50">Immediate calming. Tap to begin.</p>
                        </div>
                        <AlertTriangle className="w-5 h-5 text-red-400/60" />
                      </div>
                    </motion.button>

                    {/* Breathing Techniques */}
                    <div>
                      <h3 className="text-sm font-mono uppercase tracking-widest text-white/50 mb-3">
                        Breathing Techniques
                      </h3>
                      <div className="space-y-2">
                        {BREATHING_PRESETS.filter(p => p.id !== 'sos').map((preset) => (
                          <motion.button
                            key={preset.id}
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                            onClick={() => startBreathing(preset)}
                            className="w-full p-4 rounded-xl border border-white/10 hover:border-white/20 bg-white/[0.02] text-left transition-all"
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-2xl">{preset.icon}</span>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <h4 className="text-sm font-bold">{preset.name}</h4>
                                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${
                                    preset.category === 'calming' ? 'border-blue-500/30 text-blue-400' :
                                    preset.category === 'energizing' ? 'border-orange-500/30 text-orange-400' :
                                    'border-purple-500/30 text-purple-400'
                                  }`}>
                                    {preset.category}
                                  </span>
                                </div>
                                <p className="text-xs text-white/40 mt-0.5">{preset.description}</p>
                                <p className="text-[10px] text-white/25 font-mono mt-1">
                                  {preset.pattern.inhale}-{preset.pattern.hold}-{preset.pattern.exhale}-{preset.pattern.holdAfter} • {Math.floor(preset.duration / 60)}min
                                </p>
                              </div>
                              <ChevronRight className="w-4 h-4 text-white/20" />
                            </div>
                          </motion.button>
                        ))}
                      </div>
                    </div>

                    {/* Saved Custom Patterns */}
                    {customPatterns.length > 0 && (
                      <div>
                        <h3 className="text-sm font-mono uppercase tracking-widest text-white/50 mb-3">
                          Your Patterns
                        </h3>
                        <div className="space-y-2">
                          {customPatterns.map(cp => (
                            <div key={cp.id} className="flex items-center gap-2">
                              <button
                                onClick={() => {
                                  const preset: BreathingPreset = {
                                    id: 'custom',
                                    name: cp.name,
                                    description: 'Custom pattern',
                                    icon: '🎛️',
                                    pattern: cp.pattern,
                                    duration: 300,
                                    visualParams: { color: '#A78BFA', speed: 0.35, distort: 0.25, phrase: cp.name, explanation: 'Your personalized breathing pattern.' },
                                    guidance: ['Breathe in...', 'Hold...', 'Breathe out...', 'Rest...'],
                                    category: 'calming',
                                  };
                                  startBreathing(preset);
                                }}
                                className="flex-1 p-3 rounded-lg border border-white/10 hover:border-white/20 bg-white/[0.02] text-left text-sm"
                              >
                                <span className="font-medium">{cp.name}</span>
                                <span className="text-white/30 font-mono text-xs ml-2">
                                  {cp.pattern.inhale}-{cp.pattern.hold}-{cp.pattern.exhale}-{cp.pattern.holdAfter}
                                </span>
                              </button>
                              <button
                                onClick={() => removeCustomPattern(cp.id)}
                                className="p-2 text-white/20 hover:text-red-400 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Grounding Exercises */}
                    <div>
                      <h3 className="text-sm font-mono uppercase tracking-widest text-white/50 mb-3">
                        Grounding Exercises
                      </h3>
                      <div className="space-y-2">
                        {GROUNDING_EXERCISES.map((exercise) => (
                          <motion.button
                            key={exercise.id}
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                            onClick={() => startGrounding(exercise)}
                            className="w-full p-4 rounded-xl border border-white/10 hover:border-white/20 bg-white/[0.02] text-left transition-all"
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-2xl">{exercise.icon}</span>
                              <div className="flex-1">
                                <h4 className="text-sm font-bold">{exercise.name}</h4>
                                <p className="text-xs text-white/40 mt-0.5">{exercise.description}</p>
                              </div>
                              <ChevronRight className="w-4 h-4 text-white/20" />
                            </div>
                          </motion.button>
                        ))}
                      </div>
                    </div>

                    {/* Navigation Buttons */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => setView('custom')}
                        className="flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border border-white/10 hover:border-white/20 bg-white/[0.02] text-sm text-white/60 hover:text-white transition-all"
                      >
                        <Plus className="w-4 h-4" /> Custom Pattern
                      </button>
                      <button
                        onClick={() => setView('history')}
                        className="flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border border-white/10 hover:border-white/20 bg-white/[0.02] text-sm text-white/60 hover:text-white transition-all"
                      >
                        <Clock className="w-4 h-4" /> History
                      </button>
                      <button
                        onClick={() => setView('reminders')}
                        className="flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border border-white/10 hover:border-white/20 bg-white/[0.02] text-sm text-white/60 hover:text-white transition-all"
                      >
                        <Bell className="w-4 h-4" /> Reminders
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* ===== SOS VIEW ===== */}
                {view === 'sos' && (
                  <motion.div
                    key="sos"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-center space-y-8"
                  >
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 }}
                      className="text-white/40 text-sm"
                    >
                      You are safe. This will pass.
                    </motion.p>

                    {/* Large breathing circle */}
                    <div className="relative w-72 h-72 mx-auto">
                      <div className="absolute inset-0 rounded-full border-2 border-cyan-500/10" />
                      <svg className="absolute inset-0 w-full h-full -rotate-90">
                        <circle
                          cx="144"
                          cy="144"
                          r="136"
                          fill="none"
                          stroke="#38BDF8"
                          strokeWidth="3"
                          strokeDasharray={`${getPhaseProgress() * 854} 854`}
                          strokeLinecap="round"
                          className="transition-all duration-100"
                          opacity={0.4}
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <motion.div
                          animate={{ scale: getBreathingScale() }}
                          transition={{ duration: 0.3, ease: 'easeInOut' }}
                          className="w-28 h-28 rounded-full bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center"
                        >
                          <motion.div
                            animate={{ scale: getBreathingScale() * 0.6 }}
                            transition={{ duration: 0.3, ease: 'easeInOut' }}
                            className="w-16 h-16 rounded-full bg-cyan-400/30"
                          />
                        </motion.div>
                      </div>
                    </div>

                    <motion.p
                      key={guidance}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="font-display text-2xl text-cyan-300"
                    >
                      {guidance || 'Focus on your breath...'}
                    </motion.p>

                    <p className="font-mono text-white/40 text-sm">{formatTime(totalTime)}</p>

                    <button
                      onClick={stopSOS}
                      className="px-8 py-3 bg-white/10 hover:bg-white/20 rounded-full border border-white/20 text-sm transition-colors"
                    >
                      I feel better now
                    </button>
                  </motion.div>
                )}

                {/* ===== BREATHING VIEW ===== */}
                {view === 'breathing' && activePreset && (
                  <motion.div
                    key="breathing"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-center space-y-8"
                  >
                    {/* Breathing Circle */}
                    <div className="relative w-64 h-64 mx-auto">
                      <div className="absolute inset-0 rounded-full border-2 border-white/10" />
                      <svg className="absolute inset-0 w-full h-full -rotate-90">
                        <circle
                          cx="128"
                          cy="128"
                          r="120"
                          fill="none"
                          stroke={activePreset.visualParams.color}
                          strokeWidth="4"
                          strokeDasharray={`${getPhaseProgress() * 754} 754`}
                          strokeLinecap="round"
                          className="transition-all duration-100"
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <motion.div
                          animate={{ scale: getBreathingScale() }}
                          transition={{ duration: 0.3, ease: 'easeInOut' }}
                          className="w-24 h-24 rounded-full"
                          style={{ backgroundColor: activePreset.visualParams.color, opacity: 0.5 }}
                        />
                      </div>
                    </div>

                    {/* Phase Label */}
                    <div>
                      <motion.p
                        key={guidance}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="font-display text-2xl"
                      >
                        {guidance || 'Ready'}
                      </motion.p>
                      <p className="text-xs text-white/30 font-mono mt-2 uppercase tracking-widest">
                        {phase !== 'idle' ? phase.replace('holdAfter', 'hold') : 'paused'}
                      </p>
                    </div>

                    {/* Timer */}
                    <div>
                      <p className="font-mono text-white/60">
                        {formatTime(totalTime)}
                        {activePreset.duration > 0 && (
                          <span className="text-white/30"> / {formatTime(activePreset.duration)}</span>
                        )}
                      </p>
                      {activePreset.duration > 0 && (
                        <div className="w-48 mx-auto h-1 bg-white/5 rounded-full overflow-hidden mt-2">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${Math.min((totalTime / activePreset.duration) * 100, 100)}%`,
                              backgroundColor: activePreset.visualParams.color,
                            }}
                          />
                        </div>
                      )}
                    </div>

                    {/* Pattern Info */}
                    <p className="text-xs text-white/20 font-mono">
                      Pattern: {activePreset.pattern.inhale}-{activePreset.pattern.hold}-{activePreset.pattern.exhale}-{activePreset.pattern.holdAfter}
                    </p>

                    {/* Controls */}
                    <div className="flex items-center justify-center gap-4">
                      <button
                        onClick={resetSession}
                        className="p-3 rounded-full border border-white/10 hover:border-white/30 transition-colors"
                      >
                        <RotateCcw className="w-5 h-5" />
                      </button>
                      <button
                        onClick={togglePlay}
                        className="p-4 rounded-full bg-white text-black hover:bg-white/90 transition-colors"
                      >
                        {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
                      </button>
                      <button
                        onClick={handleEndSession}
                        className="p-3 rounded-full border border-white/10 hover:border-white/30 transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* ===== GROUNDING VIEW ===== */}
                {view === 'grounding' && activeGrounding && (
                  <motion.div
                    key="grounding"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-6"
                  >
                    {/* Progress */}
                    <div className="flex items-center gap-2">
                      {activeGrounding.steps.map((_, i) => (
                        <div
                          key={i}
                          className={`flex-1 h-1.5 rounded-full transition-all ${
                            i < groundingStep ? 'bg-green-400' :
                            i === groundingStep ? 'bg-white/40' :
                            'bg-white/10'
                          }`}
                        />
                      ))}
                    </div>

                    {/* Current Step */}
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={groundingStep}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="text-center py-8"
                      >
                        {groundingStep < activeGrounding.steps.length ? (
                          <>
                            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                              <span className="text-3xl">
                                {activeGrounding.steps[groundingStep].sense === 'sight' ? '👁️' :
                                 activeGrounding.steps[groundingStep].sense === 'touch' ? '✋' :
                                 activeGrounding.steps[groundingStep].sense === 'hearing' ? '👂' :
                                 activeGrounding.steps[groundingStep].sense === 'smell' ? '👃' :
                                 activeGrounding.steps[groundingStep].sense === 'taste' ? '👅' :
                                 activeGrounding.icon}
                              </span>
                            </div>
                            <h3 className="font-display text-xl font-bold mb-3">
                              {activeGrounding.steps[groundingStep].label}
                            </h3>
                            <p className="text-white/60 text-sm max-w-md mx-auto leading-relaxed">
                              {activeGrounding.steps[groundingStep].prompt}
                            </p>
                            <p className="text-[10px] text-white/20 font-mono mt-4">
                              Step {groundingStep + 1} of {activeGrounding.steps.length}
                            </p>
                          </>
                        ) : (
                          <>
                            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                              <Check className="w-8 h-8 text-green-400" />
                            </div>
                            <h3 className="font-display text-xl font-bold mb-2">Complete</h3>
                            <p className="text-white/60 text-sm">You did great. Take a moment to notice how you feel.</p>
                          </>
                        )}
                      </motion.div>
                    </AnimatePresence>

                    {/* Navigation */}
                    <div className="flex items-center justify-center gap-4">
                      {groundingStep > 0 && (
                        <button
                          onClick={() => setGroundingStep(s => s - 1)}
                          className="px-6 py-2.5 rounded-full border border-white/10 hover:border-white/30 text-sm transition-colors"
                        >
                          Back
                        </button>
                      )}
                      {groundingStep < activeGrounding.steps.length ? (
                        <button
                          onClick={() => setGroundingStep(s => s + 1)}
                          className="px-8 py-2.5 rounded-full bg-white text-black hover:bg-white/90 text-sm font-medium transition-colors"
                        >
                          {groundingStep === activeGrounding.steps.length - 1 ? 'Finish' : 'Next'}
                        </button>
                      ) : (
                        <button
                          onClick={() => { setView('menu'); setActiveGrounding(null); }}
                          className="px-8 py-2.5 rounded-full bg-white text-black hover:bg-white/90 text-sm font-medium transition-colors"
                        >
                          Done
                        </button>
                      )}
                    </div>
                  </motion.div>
                )}

                {/* ===== CUSTOM PATTERN VIEW ===== */}
                {view === 'custom' && (
                  <motion.div
                    key="custom"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-6"
                  >
                    <p className="text-white/50 text-sm">Create your own breathing pattern by setting the duration for each phase.</p>

                    <div>
                      <label className="text-xs font-mono text-white/40 uppercase tracking-widest">Pattern Name</label>
                      <input
                        type="text"
                        value={customName}
                        onChange={(e) => setCustomName(e.target.value)}
                        placeholder="My Custom Pattern"
                        className="w-full mt-2 p-3 bg-white/5 border border-white/10 rounded-xl text-sm outline-none focus:border-white/30 transition-colors"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {[
                        { label: 'Inhale', value: customInhale, setter: setCustomInhale, color: 'text-cyan-400' },
                        { label: 'Hold', value: customHold, setter: setCustomHold, color: 'text-yellow-400' },
                        { label: 'Exhale', value: customExhale, setter: setCustomExhale, color: 'text-green-400' },
                        { label: 'Hold After', value: customHoldAfter, setter: setCustomHoldAfter, color: 'text-purple-400' },
                      ].map(({ label, value, setter, color }) => (
                        <div key={label}>
                          <label className={`text-xs font-mono uppercase tracking-widest ${color}`}>{label}</label>
                          <div className="flex items-center gap-3 mt-2">
                            <input
                              type="range"
                              min={0}
                              max={12}
                              step={1}
                              value={value}
                              onChange={(e) => setter(Number(e.target.value))}
                              className="flex-1 accent-white"
                            />
                            <span className="text-sm font-mono w-6 text-right">{value}s</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <p className="text-xs text-white/20 font-mono text-center">
                      Pattern: {customInhale}-{customHold}-{customExhale}-{customHoldAfter} • Cycle: {customInhale + customHold + customExhale + customHoldAfter}s
                    </p>

                    <div className="flex gap-3">
                      <button
                        onClick={saveCustomPattern}
                        disabled={!customName.trim()}
                        className="flex-1 py-3 rounded-xl border border-white/10 hover:border-white/20 text-sm text-white/60 hover:text-white transition-all disabled:opacity-30"
                      >
                        Save Pattern
                      </button>
                      <button
                        onClick={startCustomBreathing}
                        disabled={!customName.trim()}
                        className="flex-1 py-3 rounded-xl bg-white text-black hover:bg-white/90 text-sm font-medium transition-colors disabled:opacity-30"
                      >
                        Start Now
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* ===== HISTORY VIEW ===== */}
                {view === 'history' && (
                  <motion.div
                    key="history"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-6"
                  >
                    {/* Weekly Stats */}
                    <div className="p-4 bg-white/5 rounded-xl">
                      <h3 className="text-sm font-mono uppercase tracking-widest text-white/50 mb-3">This Week</h3>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-2xl font-bold">{weeklyStats.totalSessions}</p>
                          <p className="text-[10px] text-white/40 font-mono uppercase">Sessions</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold">{weeklyStats.totalMinutes}</p>
                          <p className="text-[10px] text-white/40 font-mono uppercase">Minutes</p>
                        </div>
                      </div>
                      {Object.keys(weeklyStats.techniques).length > 0 && (
                        <div className="mt-3 space-y-1">
                          {Object.entries(weeklyStats.techniques).map(([name, count]) => (
                            <div key={name} className="flex items-center justify-between text-xs">
                              <span className="text-white/50">{name}</span>
                              <span className="font-mono text-white/30">{count}x</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Session List */}
                    <div>
                      <h3 className="text-sm font-mono uppercase tracking-widest text-white/50 mb-3">Recent Sessions</h3>
                      {sessions.length === 0 ? (
                        <div className="text-center py-8">
                          <Activity className="w-8 h-8 mx-auto mb-2 opacity-20" />
                          <p className="text-sm text-white/30">No sessions yet. Start breathing!</p>
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-[40vh] overflow-y-auto">
                          {sessions.slice(0, 30).map(s => (
                            <div key={s.id} className="flex items-center gap-3 p-3 bg-white/[0.02] rounded-lg border border-white/5">
                              <div className="text-lg">
                                {BREATHING_PRESETS.find(p => p.id === s.technique)?.icon || '🎛️'}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm truncate">{s.techniqueName}</p>
                                <p className="text-[10px] text-white/30 font-mono">{s.date}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-mono text-white/60">{formatTime(s.duration)}</p>
                                <p className="text-[10px] text-white/20 font-mono">
                                  {s.pattern.inhale}-{s.pattern.hold}-{s.pattern.exhale}-{s.pattern.holdAfter}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}

                {/* ===== REMINDERS VIEW ===== */}
                {view === 'reminders' && (
                  <motion.div
                    key="reminders"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-6"
                  >
                    <p className="text-white/50 text-sm">
                      Set reminders to practice breathing exercises regularly.
                      {!('Notification' in window) && ' (Notifications not supported in this browser)'}
                    </p>

                    {/* Add Reminder */}
                    <div className="p-4 bg-white/5 rounded-xl space-y-3">
                      <h4 className="text-sm font-mono text-white/40 uppercase tracking-widest">Add Reminder</h4>
                      <div className="flex gap-3">
                        <input
                          type="time"
                          value={reminderTime}
                          onChange={(e) => setReminderTime(e.target.value)}
                          className="p-2 bg-white/5 border border-white/10 rounded-lg text-sm outline-none focus:border-white/30 transition-colors"
                        />
                        <select
                          value={reminderTechnique}
                          onChange={(e) => setReminderTechnique(e.target.value as BreathingTechnique)}
                          className="flex-1 p-2 bg-white/5 border border-white/10 rounded-lg text-sm outline-none focus:border-white/30 transition-colors [&>option]:bg-[#0a0a0a]"
                        >
                          {BREATHING_PRESETS.filter(p => p.id !== 'sos').map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                        </select>
                      </div>
                      <button
                        onClick={handleAddReminder}
                        className="w-full py-2 rounded-lg bg-white/10 hover:bg-white/20 text-sm transition-colors"
                      >
                        Add Reminder
                      </button>
                    </div>

                    {/* Existing Reminders */}
                    {reminders.length === 0 ? (
                      <div className="text-center py-8">
                        <BellOff className="w-8 h-8 mx-auto mb-2 opacity-20" />
                        <p className="text-sm text-white/30">No reminders set</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {reminders.map(r => {
                          const preset = BREATHING_PRESETS.find(p => p.id === r.technique);
                          return (
                            <div key={r.id} className="flex items-center gap-3 p-3 bg-white/[0.02] rounded-lg border border-white/5">
                              <button
                                onClick={() => updateReminder(r.id, { enabled: !r.enabled })}
                                className={`p-1 transition-colors ${r.enabled ? 'text-green-400' : 'text-white/20'}`}
                              >
                                {r.enabled ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
                              </button>
                              <div className="flex-1">
                                <p className="text-sm font-mono">{r.time}</p>
                                <p className="text-[10px] text-white/30">{preset?.name || r.technique}</p>
                              </div>
                              <button
                                onClick={() => removeReminder(r.id)}
                                className="p-1 text-white/20 hover:text-red-400 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default BreathingExercises;
