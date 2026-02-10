// Music Reactive Component - Audio-driven visualization
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mic, MicOff, Music, Volume2, Settings2 } from 'lucide-react';
import { AudioReactiveSettings, VisualParams } from '../types';

interface MusicReactiveProps {
  isOpen: boolean;
  onClose: () => void;
  onParamsChange: (params: Partial<VisualParams>) => void;
  currentParams: VisualParams;
}

export const MusicReactive: React.FC<MusicReactiveProps> = ({
  isOpen,
  onClose,
  onParamsChange,
  currentParams,
}) => {
  const [isActive, setIsActive] = useState(false);
  const [settings, setSettings] = useState<AudioReactiveSettings>({
    enabled: false,
    source: 'microphone',
    sensitivity: 1.0,
    frequencyBands: {
      bass: true,
      mid: true,
      treble: true,
    },
  });
  const [audioLevel, setAudioLevel] = useState({ bass: 0, mid: 0, treble: 0, overall: 0 });
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const animationRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAnalysis();
    };
  }, []);

  const startAnalysis = useCallback(async () => {
    try {
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });
      streamRef.current = stream;

      // Create audio context and analyser
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioContext;

      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      analyserRef.current = analyser;

      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      sourceRef.current = source;

      setIsActive(true);
      setSettings(prev => ({ ...prev, enabled: true }));

      // Start analysis loop
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const analyze = () => {
        if (!analyserRef.current) return;

        analyserRef.current.getByteFrequencyData(dataArray);

        // Calculate frequency bands
        const bassEnd = Math.floor(bufferLength * 0.1);
        const midEnd = Math.floor(bufferLength * 0.5);

        let bassSum = 0;
        let midSum = 0;
        let trebleSum = 0;

        for (let i = 0; i < bufferLength; i++) {
          if (i < bassEnd) {
            bassSum += dataArray[i];
          } else if (i < midEnd) {
            midSum += dataArray[i];
          } else {
            trebleSum += dataArray[i];
          }
        }

        const bass = (bassSum / bassEnd / 255) * settings.sensitivity;
        const mid = (midSum / (midEnd - bassEnd) / 255) * settings.sensitivity;
        const treble = (trebleSum / (bufferLength - midEnd) / 255) * settings.sensitivity;
        const overall = (bass + mid + treble) / 3;

        setAudioLevel({ bass, mid, treble, overall });

        // Update visual params based on audio
        const newSpeed = 0.3 + (settings.frequencyBands.bass ? bass : 0) * 1.5;
        const newDistort = 0.2 + (settings.frequencyBands.treble ? treble : 0) * 0.6;
        
        // Color shift based on mid frequencies
        if (settings.frequencyBands.mid && mid > 0.3) {
          const hue = (mid * 360) % 360;
          const saturation = 70 + mid * 30;
          const lightness = 50 + mid * 20;
          // Convert HSL to Hex (simplified)
          const color = hslToHex(hue, saturation, lightness);
          
          onParamsChange({
            speed: Math.min(2, newSpeed),
            distort: Math.min(1, newDistort),
            color,
          });
        } else {
          onParamsChange({
            speed: Math.min(2, newSpeed),
            distort: Math.min(1, newDistort),
          });
        }

        animationRef.current = requestAnimationFrame(analyze);
      };

      analyze();

    } catch (error) {
      console.error('Failed to access microphone:', error);
      alert('Failed to access microphone. Please allow microphone access and try again.');
    }
  }, [settings, onParamsChange]);

  const stopAnalysis = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }

    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    setIsActive(false);
    setSettings(prev => ({ ...prev, enabled: false }));
    setAudioLevel({ bass: 0, mid: 0, treble: 0, overall: 0 });
  }, []);

  const toggleActive = useCallback(() => {
    if (isActive) {
      stopAnalysis();
    } else {
      startAnalysis();
    }
  }, [isActive, startAnalysis, stopAnalysis]);

  // Helper function to convert HSL to Hex
  const hslToHex = (h: number, s: number, l: number): string => {
    s /= 100;
    l /= 100;
    const a = s * Math.min(l, 1 - l);
    const f = (n: number) => {
      const k = (n + h / 30) % 12;
      const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return Math.round(255 * color).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
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
            className="relative w-full max-w-sm mx-4 bg-[#0a0a0a] border border-white/10 rounded-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Music className="w-5 h-5" />
                <h3 className="font-display text-lg font-bold">Music Reactive</h3>
              </div>
              <button
                onClick={onClose}
                className="p-1 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Main Toggle */}
              <div className="text-center">
                <button
                  onClick={toggleActive}
                  className={`relative w-24 h-24 rounded-full transition-all ${
                    isActive
                      ? 'bg-gradient-to-br from-purple-500 to-pink-500'
                      : 'bg-white/10 hover:bg-white/20'
                  }`}
                >
                  <div className="absolute inset-0 flex items-center justify-center">
                    {isActive ? (
                      <MicOff className="w-10 h-10" />
                    ) : (
                      <Mic className="w-10 h-10" />
                    )}
                  </div>
                  
                  {/* Pulse animation when active */}
                  {isActive && (
                    <motion.div
                      className="absolute inset-0 rounded-full bg-purple-500/50"
                      animate={{
                        scale: [1, 1.2 + audioLevel.overall * 0.5, 1],
                        opacity: [0.5, 0, 0.5],
                      }}
                      transition={{
                        duration: 0.5,
                        repeat: Infinity,
                      }}
                    />
                  )}
                </button>
                
                <p className="mt-4 text-sm text-white/60">
                  {isActive ? 'Tap to stop listening' : 'Tap to start listening'}
                </p>
              </div>

              {/* Audio Levels */}
              {isActive && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="space-y-3"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-white/50 uppercase tracking-widest">Audio Levels</span>
                    <Volume2 className="w-4 h-4 text-white/50" />
                  </div>
                  
                  <div className="space-y-2">
                    {[
                      { label: 'Bass', value: audioLevel.bass, color: '#EF4444' },
                      { label: 'Mid', value: audioLevel.mid, color: '#10B981' },
                      { label: 'Treble', value: audioLevel.treble, color: '#3B82F6' },
                    ].map(({ label, value, color }) => (
                      <div key={label} className="flex items-center gap-3">
                        <span className="text-xs w-12 text-white/50">{label}</span>
                        <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                          <motion.div
                            className="h-full rounded-full"
                            style={{ backgroundColor: color }}
                            animate={{ width: `${Math.min(value * 100, 100)}%` }}
                            transition={{ duration: 0.1 }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Settings */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs text-white/50 uppercase tracking-widest">
                  <Settings2 className="w-4 h-4" />
                  <span>Settings</span>
                </div>

                {/* Sensitivity */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Sensitivity</span>
                    <span className="text-xs text-white/50">{settings.sensitivity.toFixed(1)}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="2"
                    step="0.1"
                    value={settings.sensitivity}
                    onChange={(e) => setSettings(prev => ({ ...prev, sensitivity: parseFloat(e.target.value) }))}
                    className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                {/* Frequency Bands */}
                <div className="space-y-2">
                  <span className="text-sm">Active Bands</span>
                  <div className="flex gap-2">
                    {(['bass', 'mid', 'treble'] as const).map((band) => (
                      <button
                        key={band}
                        onClick={() => setSettings(prev => ({
                          ...prev,
                          frequencyBands: {
                            ...prev.frequencyBands,
                            [band]: !prev.frequencyBands[band],
                          },
                        }))}
                        className={`flex-1 py-2 text-sm rounded-lg border transition-colors capitalize ${
                          settings.frequencyBands[band]
                            ? 'border-white/30 bg-white/10'
                            : 'border-white/10 opacity-50'
                        }`}
                      >
                        {band}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Note */}
              <p className="text-xs text-white/30 text-center">
                The visualization will react to audio from your microphone
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
