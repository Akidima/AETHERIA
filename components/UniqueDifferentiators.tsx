import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, CloudSun, AudioLines, TimerReset, Palette, Mic, MicOff, WandSparkles, Send } from 'lucide-react';
import { DailyCheckIn, VisualParams } from '../types';
import { predictMoodForecast, transferEmotionToArtStyle } from '../services/aiService';

type DifferentiatorTab = 'forecast' | 'synesthesia' | 'capsules' | 'style-transfer';

interface EmotionTimeCapsule {
  id: string;
  title: string;
  reflection: string;
  createdAt: number;
  unlockAt: number;
  delivered: boolean;
  snapshot: VisualParams;
}

interface UniqueDifferentiatorsProps {
  isOpen: boolean;
  onClose: () => void;
  checkIns: DailyCheckIn[];
  currentParams: VisualParams;
  onApplyVisualization: (params: VisualParams) => void;
}

const CAPSULES_STORAGE_KEY = 'aetheria_emotion_time_capsules';

const SYNESTHESIA_BASE: VisualParams = {
  color: '#a78bfa',
  speed: 0.6,
  distort: 0.4,
  phrase: 'Sonic Prism',
  explanation: 'Environmental sound translated into flowing emotion visuals.',
};

export const UniqueDifferentiators: React.FC<UniqueDifferentiatorsProps> = ({
  isOpen,
  onClose,
  checkIns,
  currentParams,
  onApplyVisualization,
}) => {
  const [activeTab, setActiveTab] = useState<DifferentiatorTab>('forecast');
  const [isForecastLoading, setIsForecastLoading] = useState(false);
  const [forecastSummary, setForecastSummary] = useState('Build a few daily check-ins to unlock your emotional weather forecast.');
  const [forecastDays, setForecastDays] = useState<Array<{ date: string; predictedMood: number; confidence: number; weather: string; insight: string }>>([]);

  const [capsules, setCapsules] = useState<EmotionTimeCapsule[]>([]);
  const [capsuleTitle, setCapsuleTitle] = useState('');
  const [capsuleReflection, setCapsuleReflection] = useState('');
  const [capsuleDeliveryDate, setCapsuleDeliveryDate] = useState('');

  const [styleEmotion, setStyleEmotion] = useState('');
  const [styleName, setStyleName] = useState('Van Gogh');
  const [styleLoading, setStyleLoading] = useState(false);
  const [stylePrompt, setStylePrompt] = useState('');
  const [stylePreview, setStylePreview] = useState<VisualParams | null>(null);

  const [synesthesiaActive, setSynesthesiaActive] = useState(false);
  const [soundLabel, setSoundLabel] = useState('Waiting for ambient sound');
  const [soundEnergy, setSoundEnergy] = useState(0);
  const [soundBrightness, setSoundBrightness] = useState(0);

  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number | null>(null);

  const styleOptions = ['Van Gogh', 'Neo-Tokyo Cyberpunk', 'Watercolor Dream', 'Monochrome Ink', 'Surreal Dali'];

  const dueCapsules = useMemo(
    () => capsules.filter((capsule) => !capsule.delivered && capsule.unlockAt <= Date.now()),
    [capsules]
  );

  const saveCapsules = useCallback((items: EmotionTimeCapsule[]) => {
    setCapsules(items);
    localStorage.setItem(CAPSULES_STORAGE_KEY, JSON.stringify(items));
  }, []);

  const loadForecast = useCallback(async () => {
    setIsForecastLoading(true);
    const forecast = await predictMoodForecast(checkIns);
    setForecastSummary(forecast.summary);
    setForecastDays(forecast.days);
    setIsForecastLoading(false);
  }, [checkIns]);

  useEffect(() => {
    if (!isOpen) return;

    try {
      const raw = localStorage.getItem(CAPSULES_STORAGE_KEY);
      if (raw) {
        setCapsules(JSON.parse(raw));
      } else {
        setCapsules([]);
      }
    } catch {
      setCapsules([]);
    }

    loadForecast();
  }, [isOpen, loadForecast]);

  const stopSynesthesia = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    analyserRef.current = null;
    setSynesthesiaActive(false);
    setSoundEnergy(0);
    setSoundBrightness(0);
    setSoundLabel('Waiting for ambient sound');
  }, []);

  useEffect(() => {
    if (!isOpen) {
      stopSynesthesia();
    }
  }, [isOpen, stopSynesthesia]);

  const startSynesthesia = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const context = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = context;

      const analyser = context.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.75;
      analyserRef.current = analyser;

      const source = context.createMediaStreamSource(stream);
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      setSynesthesiaActive(true);

      const render = () => {
        if (!analyserRef.current) return;

        analyserRef.current.getByteFrequencyData(dataArray);

        const total = dataArray.reduce((sum, value) => sum + value, 0);
        const energy = total / (dataArray.length * 255);

        let weighted = 0;
        for (let i = 0; i < dataArray.length; i++) {
          weighted += i * dataArray[i];
        }
        const centroid = dataArray.length > 0 && total > 0 ? weighted / total / dataArray.length : 0;

        const brightness = Math.max(0.2, Math.min(1, centroid * 1.4 + 0.2));
        const hue = Math.round((centroid * 360 + energy * 110) % 360);
        const saturation = 65 + Math.round(energy * 30);
        const lightness = 38 + Math.round(brightness * 28);

        const descriptor = energy < 0.12 ? 'Quiet Atmosphere' : energy < 0.3 ? 'Conversational Flow' : energy < 0.55 ? 'Urban Pulse' : 'Kinetic Surge';

        setSoundEnergy(energy);
        setSoundBrightness(brightness);
        setSoundLabel(descriptor);

        const visualParams: VisualParams = {
          color: `hsl(${hue}, ${saturation}%, ${lightness}%)`,
          speed: Math.min(2.2, 0.25 + energy * 2.4),
          distort: Math.min(1.3, 0.2 + brightness * 0.9),
          phrase: descriptor,
          explanation: 'Synesthesia mode converts ambient sound signatures into color, flow, and texture in real time.',
        };

        onApplyVisualization(visualParams);
        animationRef.current = requestAnimationFrame(render);
      };

      render();
    } catch {
      stopSynesthesia();
      alert('Microphone access is required for Synesthesia mode.');
    }
  }, [onApplyVisualization, stopSynesthesia]);

  const toggleSynesthesia = useCallback(() => {
    if (synesthesiaActive) {
      stopSynesthesia();
    } else {
      startSynesthesia();
    }
  }, [startSynesthesia, stopSynesthesia, synesthesiaActive]);

  const createCapsule = () => {
    if (!capsuleReflection.trim() || !capsuleDeliveryDate) return;

    const unlockAt = new Date(`${capsuleDeliveryDate}T09:00:00`).getTime();
    if (!Number.isFinite(unlockAt) || unlockAt <= Date.now()) return;

    const capsule: EmotionTimeCapsule = {
      id: `capsule_${Date.now()}`,
      title: capsuleTitle.trim() || 'Reflection capsule',
      reflection: capsuleReflection.trim(),
      createdAt: Date.now(),
      unlockAt,
      delivered: false,
      snapshot: currentParams,
    };

    saveCapsules([capsule, ...capsules].slice(0, 100));
    setCapsuleTitle('');
    setCapsuleReflection('');
    setCapsuleDeliveryDate('');
  };

  const openCapsule = (id: string) => {
    const next = capsules.map((capsule) => (capsule.id === id ? { ...capsule, delivered: true } : capsule));
    const target = next.find((capsule) => capsule.id === id);
    if (target) {
      onApplyVisualization(target.snapshot);
    }
    saveCapsules(next);
  };

  const runStyleTransfer = async () => {
    setStyleLoading(true);
    const result = await transferEmotionToArtStyle(
      styleEmotion.trim() || currentParams.phrase,
      styleName,
      currentParams
    );
    setStylePreview(result.params);
    setStylePrompt(result.stylePrompt);
    setStyleLoading(false);
  };

  const tabClass = (tab: DifferentiatorTab) =>
    `px-3 py-2 rounded-lg border text-xs font-mono uppercase tracking-widest transition-colors ${
      activeTab === tab
        ? 'bg-white/10 border-white/40 text-white'
        : 'bg-transparent border-white/10 text-white/60 hover:border-white/30 hover:text-white'
    }`;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[220] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.98 }}
            className="w-full max-w-5xl max-h-[92vh] overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a0a]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 p-4">
              <div>
                <h3 className="font-display text-xl font-bold uppercase tracking-tight">Unique Differentiators</h3>
                <p className="text-xs text-white/50 font-mono uppercase tracking-widest">Forecast • Synesthesia • Time Capsules • Style Transfer</p>
              </div>
              <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 transition-colors">
                <span className="sr-only">Close unique differentiators</span>
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="border-b border-white/10 px-4 py-3 flex flex-wrap gap-2">
              <button className={tabClass('forecast')} onClick={() => setActiveTab('forecast')}>
                <CloudSun className="w-3.5 h-3.5 inline mr-1" /> Forecast
              </button>
              <button className={tabClass('synesthesia')} onClick={() => setActiveTab('synesthesia')}>
                <AudioLines className="w-3.5 h-3.5 inline mr-1" /> Synesthesia
              </button>
              <button className={tabClass('capsules')} onClick={() => setActiveTab('capsules')}>
                <TimerReset className="w-3.5 h-3.5 inline mr-1" /> Time Capsules
              </button>
              <button className={tabClass('style-transfer')} onClick={() => setActiveTab('style-transfer')}>
                <Palette className="w-3.5 h-3.5 inline mr-1" /> AI Style Transfer
              </button>
            </div>

            <div className="p-4 md:p-6 max-h-[74vh] overflow-y-auto">
              {activeTab === 'forecast' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-display text-lg font-bold">Emotional Weather Forecast</h4>
                      <p className="text-sm text-white/60">AI predicts your next emotional climate from check-in patterns.</p>
                    </div>
                    <button
                      onClick={loadForecast}
                      disabled={isForecastLoading}
                      className="px-4 py-2 rounded-lg border border-white/20 text-sm hover:border-white/40 transition-colors disabled:opacity-60"
                    >
                      {isForecastLoading ? 'Analyzing...' : 'Refresh Forecast'}
                    </button>
                  </div>
                  <div className="p-4 rounded-xl border border-white/10 bg-white/5 text-sm text-white/80">{forecastSummary}</div>
                  <div className="grid md:grid-cols-3 gap-3">
                    {forecastDays.map((day) => (
                      <div key={day.date} className="p-4 rounded-xl border border-white/10 bg-white/5">
                        <p className="text-xs font-mono uppercase tracking-widest text-white/50">{new Date(day.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</p>
                        <p className="mt-2 font-semibold">{day.weather}</p>
                        <p className="text-sm text-white/60 mt-1">Mood {day.predictedMood}/5 • {Math.round(day.confidence * 100)}% confidence</p>
                        <p className="text-sm text-white/75 mt-2">{day.insight}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'synesthesia' && (
                <div className="space-y-5">
                  <div>
                    <h4 className="font-display text-lg font-bold">Synesthesia Mode</h4>
                    <p className="text-sm text-white/60">Translate environmental sound into visuals beyond music-only reactivity.</p>
                  </div>
                  <div className="p-5 rounded-2xl border border-white/10 bg-white/5">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm text-white/50">Live Sound Signature</p>
                        <p className="font-semibold mt-1">{soundLabel}</p>
                      </div>
                      <button
                        onClick={toggleSynesthesia}
                        className={`px-4 py-2 rounded-lg border transition-colors ${synesthesiaActive ? 'border-red-400/40 text-red-300 bg-red-500/10' : 'border-white/20 hover:border-white/40'}`}
                      >
                        {synesthesiaActive ? (
                          <span className="inline-flex items-center gap-2"><MicOff className="w-4 h-4" /> Stop</span>
                        ) : (
                          <span className="inline-flex items-center gap-2"><Mic className="w-4 h-4" /> Start</span>
                        )}
                      </button>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4 mt-4">
                      <div className="p-3 rounded-lg bg-black/30 border border-white/10">
                        <p className="text-xs font-mono uppercase tracking-widest text-white/50">Energy</p>
                        <p className="text-sm mt-2 text-violet-300">{Math.round(soundEnergy * 100)}%</p>
                      </div>
                      <div className="p-3 rounded-lg bg-black/30 border border-white/10">
                        <p className="text-xs font-mono uppercase tracking-widest text-white/50">Brightness</p>
                        <p className="text-sm mt-2 text-cyan-300">{Math.round(soundBrightness * 100)}%</p>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => onApplyVisualization(SYNESTHESIA_BASE)}
                    className="px-4 py-2 rounded-lg border border-white/20 hover:border-white/40 text-sm transition-colors"
                  >
                    Apply Synesthesia Base Visual
                  </button>
                </div>
              )}

              {activeTab === 'capsules' && (
                <div className="grid lg:grid-cols-[1fr_1fr] gap-5">
                  <div className="space-y-3">
                    <h4 className="font-display text-lg font-bold">Emotion Time Capsules</h4>
                    <p className="text-sm text-white/60">Schedule future delivery of today’s reflection and visual snapshot.</p>
                    <input
                      type="text"
                      value={capsuleTitle}
                      onChange={(event) => setCapsuleTitle(event.target.value)}
                      placeholder="Capsule title"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-white/30"
                    />
                    <textarea
                      value={capsuleReflection}
                      onChange={(event) => setCapsuleReflection(event.target.value)}
                      placeholder="Write a reflection for your future self..."
                      className="w-full h-32 bg-white/5 border border-white/10 rounded-xl px-4 py-3 resize-none focus:outline-none focus:border-white/30"
                    />
                    <input
                      type="date"
                      value={capsuleDeliveryDate}
                      onChange={(event) => setCapsuleDeliveryDate(event.target.value)}
                      title="Capsule delivery date"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-white/30"
                    />
                    <button
                      onClick={createCapsule}
                      className="w-full px-4 py-3 rounded-xl bg-white text-black font-medium hover:bg-white/90 transition-colors"
                    >
                      Schedule Capsule
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10">
                      <p className="text-xs font-mono uppercase tracking-widest text-emerald-200/80">Ready to open</p>
                      {dueCapsules.length === 0 ? (
                        <p className="text-sm text-white/70 mt-2">No capsules are ready yet.</p>
                      ) : (
                        <div className="mt-2 space-y-2">
                          {dueCapsules.map((capsule) => (
                            <div key={capsule.id} className="p-3 rounded-lg bg-black/30 border border-white/10">
                              <p className="font-medium">{capsule.title}</p>
                              <p className="text-sm text-white/70 mt-1 line-clamp-2">{capsule.reflection}</p>
                              <button
                                onClick={() => openCapsule(capsule.id)}
                                className="mt-2 px-3 py-1.5 rounded-md border border-white/20 text-xs hover:border-white/40 transition-colors"
                              >
                                Open & Revisit Visual
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      {capsules.filter((capsule) => !capsule.delivered && capsule.unlockAt > Date.now()).slice(0, 5).map((capsule) => (
                        <div key={capsule.id} className="p-3 rounded-lg border border-white/10 bg-white/5">
                          <p className="font-medium">{capsule.title}</p>
                          <p className="text-xs text-white/50 mt-1">
                            Delivers {new Date(capsule.unlockAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'style-transfer' && (
                <div className="space-y-4">
                  <div>
                    <h4 className="font-display text-lg font-bold">AI Art Style Transfer</h4>
                    <p className="text-sm text-white/60">Turn your emotion into a chosen artistic signature and apply it instantly.</p>
                  </div>
                  <div className="grid md:grid-cols-[1fr_auto] gap-3">
                    <input
                      type="text"
                      value={styleEmotion}
                      onChange={(event) => setStyleEmotion(event.target.value)}
                      placeholder={`Emotion seed (default: ${currentParams.phrase})`}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-white/30"
                    />
                    <select
                      value={styleName}
                      onChange={(event) => setStyleName(event.target.value)}
                      title="Art style"
                      className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-white/30"
                    >
                      {styleOptions.map((option) => (
                        <option key={option} value={option} className="bg-[#0a0a0a]">
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    onClick={runStyleTransfer}
                    disabled={styleLoading}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white text-black font-medium hover:bg-white/90 transition-colors disabled:opacity-70"
                  >
                    {styleLoading ? <WandSparkles className="w-4 h-4 animate-pulse" /> : <Send className="w-4 h-4" />}
                    {styleLoading ? 'Transferring...' : 'Generate Style Transfer'}
                  </button>

                  {stylePreview && (
                    <div className="p-4 rounded-xl border border-white/10 bg-white/5">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl border border-white/15 bg-white/10 flex items-center justify-center text-[10px] font-mono text-white/70">{stylePreview.color}</div>
                        <div>
                          <p className="font-semibold">{stylePreview.phrase}</p>
                          <p className="text-xs text-white/60">Speed {stylePreview.speed.toFixed(2)} • Distort {stylePreview.distort.toFixed(2)}</p>
                        </div>
                      </div>
                      <p className="text-sm text-white/70 mt-3">{stylePrompt || stylePreview.explanation}</p>
                      <button
                        onClick={() => onApplyVisualization(stylePreview)}
                        className="mt-3 px-4 py-2 rounded-lg border border-white/20 hover:border-white/40 text-sm transition-colors"
                      >
                        Apply Styled Emotion
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
