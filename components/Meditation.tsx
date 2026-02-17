// Guided Meditation Component
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, X, RotateCcw, Volume2, VolumeX } from 'lucide-react';
import { MeditationSession, MEDITATION_PRESETS, VisualParams } from '../types';
import { audioService } from '../services/audioService';

interface MeditationProps {
  isOpen: boolean;
  onClose: () => void;
  onParamsChange: (params: VisualParams) => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

type BreathPhase = 'inhale' | 'hold' | 'exhale' | 'holdAfter' | 'idle';

export const Meditation: React.FC<MeditationProps> = ({
  isOpen,
  onClose,
  onParamsChange,
  soundEnabled,
  onToggleSound,
}) => {
  const [selectedSession, setSelectedSession] = useState<MeditationSession | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [phase, setPhase] = useState<BreathPhase>('idle');
  const [phaseTime, setPhaseTime] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [guidance, setGuidance] = useState('');
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Clean up on close
  useEffect(() => {
    if (!isOpen) {
      setIsPlaying(false);
      setSelectedSession(null);
      setPhase('idle');
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
  }, [isOpen]);

  // Breathing cycle logic
  useEffect(() => {
    if (!isPlaying || !selectedSession) return;

    const { breathPattern, guidance: sessionGuidance } = selectedSession;
    const phases: { phase: BreathPhase; duration: number; guidanceIndex: number }[] = ([
      { phase: 'inhale' as BreathPhase, duration: breathPattern.inhale, guidanceIndex: 0 },
      { phase: 'hold' as BreathPhase, duration: breathPattern.hold, guidanceIndex: 1 },
      { phase: 'exhale' as BreathPhase, duration: breathPattern.exhale, guidanceIndex: 2 },
      { phase: 'holdAfter' as BreathPhase, duration: breathPattern.holdAfter, guidanceIndex: 3 },
    ]).filter(p => p.duration > 0);

    let currentPhaseIndex = 0;
    let currentPhaseTime = 0;

    setPhase(phases[0].phase);
    setGuidance(sessionGuidance?.[phases[0].guidanceIndex] || getDefaultGuidance(phases[0].phase));

    intervalRef.current = setInterval(() => {
      currentPhaseTime += 0.1;
      setPhaseTime(currentPhaseTime);
      setTotalTime(prev => prev + 0.1);

      // Check if phase is complete
      if (currentPhaseTime >= phases[currentPhaseIndex].duration) {
        currentPhaseTime = 0;
        currentPhaseIndex = (currentPhaseIndex + 1) % phases.length;
        
        const newPhase = phases[currentPhaseIndex];
        setPhase(newPhase.phase);
        setGuidance(sessionGuidance?.[newPhase.guidanceIndex] || getDefaultGuidance(newPhase.phase));
      }

      // Check if session is complete
      if (totalTime >= selectedSession.duration) {
        setIsPlaying(false);
        setPhase('idle');
        setGuidance('Session complete. Well done.');
      }
    }, 100);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying, selectedSession]);

  // Update visuals based on phase
  useEffect(() => {
    if (!selectedSession || phase === 'idle') return;

    const baseParams = selectedSession.visualParams;
    let modifiedParams = { ...baseParams };

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
  }, [phase, selectedSession, onParamsChange]);

  const getDefaultGuidance = (phase: BreathPhase): string => {
    switch (phase) {
      case 'inhale': return 'Breathe in...';
      case 'hold': return 'Hold...';
      case 'exhale': return 'Breathe out...';
      case 'holdAfter': return 'Rest...';
      default: return '';
    }
  };

  const startSession = (session: MeditationSession) => {
    setSelectedSession(session);
    setTotalTime(0);
    setPhaseTime(0);
    setIsPlaying(true);
    onParamsChange(session.visualParams);
    
    if (soundEnabled) {
      audioService.start(session.visualParams.color, session.visualParams.speed, session.visualParams.distort);
    }
  };

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const resetSession = () => {
    setTotalTime(0);
    setPhaseTime(0);
    setPhase('idle');
    setIsPlaying(false);
  };

  const getPhaseProgress = (): number => {
    if (!selectedSession || phase === 'idle') return 0;
    const duration = selectedSession.breathPattern[phase] || 1;
    return phaseTime / duration;
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[150] bg-black/95 backdrop-blur-xl flex items-center justify-center"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="w-full max-w-lg mx-4"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <h2 className="font-display text-3xl font-bold uppercase tracking-tighter">
                Meditation
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={onToggleSound}
                  className="p-2 rounded-full hover:bg-white/10 transition-colors"
                >
                  {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                </button>
                <button
                  onClick={onClose}
                  className="p-2 rounded-full hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {!selectedSession ? (
              // Session Selection
              <div className="space-y-4">
                <p className="text-white/60 font-mono text-sm">Choose a session</p>
                {MEDITATION_PRESETS.map((session) => (
                  <motion.button
                    key={session.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => startSession(session)}
                    className="w-full p-6 rounded-xl border border-white/10 hover:border-white/30 bg-white/5 text-left transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className="w-12 h-12 rounded-full"
                        style={{ backgroundColor: session.visualParams.color }}
                      />
                      <div className="flex-1">
                        <h3 className="font-display text-xl font-bold">{session.name}</h3>
                        <p className="text-sm text-white/60">
                          {Math.floor(session.duration / 60)} minutes • {session.breathPattern.inhale}-{session.breathPattern.hold}-{session.breathPattern.exhale} breathing
                        </p>
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
            ) : (
              // Active Session
              <div className="text-center space-y-8">
                {/* Breathing Circle */}
                <div className="relative w-64 h-64 mx-auto">
                  {/* Background circle */}
                  <div className="absolute inset-0 rounded-full border-2 border-white/10" />
                  
                  {/* Progress circle */}
                  <svg className="absolute inset-0 w-full h-full -rotate-90">
                    <circle
                      cx="128"
                      cy="128"
                      r="120"
                      fill="none"
                      stroke={selectedSession.visualParams.color}
                      strokeWidth="4"
                      strokeDasharray={`${getPhaseProgress() * 754} 754`}
                      className="transition-all duration-100"
                    />
                  </svg>
                  
                  {/* Inner content */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <motion.div
                      animate={{
                        scale: phase === 'inhale' ? 1.2 : phase === 'exhale' ? 0.8 : 1,
                      }}
                      transition={{ duration: 0.5 }}
                      className="w-24 h-24 rounded-full"
                      style={{ backgroundColor: selectedSession.visualParams.color, opacity: 0.6 }}
                    />
                  </div>
                </div>

                {/* Guidance */}
                <motion.p
                  key={guidance}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="font-display text-2xl"
                >
                  {guidance}
                </motion.p>

                {/* Timer */}
                <p className="font-mono text-white/60">
                  {formatTime(totalTime)} / {formatTime(selectedSession.duration)}
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
                    onClick={() => setSelectedSession(null)}
                    className="p-3 rounded-full border border-white/10 hover:border-white/30 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
