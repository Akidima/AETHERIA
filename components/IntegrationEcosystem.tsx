import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Calendar,
  Music,
  Activity,
  FileUp,
  CloudSun,
  Link2,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';
import { DailyCheckIn, IntegrationConnections, MusicMoodMatch, WeatherMoodPoint } from '../types';
import { integrationService } from '../services/integrationService';

interface IntegrationEcosystemProps {
  isOpen: boolean;
  onClose: () => void;
  checkIns: DailyCheckIn[];
}

export const IntegrationEcosystem: React.FC<IntegrationEcosystemProps> = ({
  isOpen,
  onClose,
  checkIns,
}) => {
  const [connections, setConnections] = useState<IntegrationConnections>(() => integrationService.getConnections());
  const [calendarInput, setCalendarInput] = useState('');
  const [calendarImportCount, setCalendarImportCount] = useState(0);
  const [musicMatch, setMusicMatch] = useState<MusicMoodMatch | null>(null);
  const [heartRate, setHeartRate] = useState('72');
  const [therapyPlatform, setTherapyPlatform] = useState<'betterhelp' | 'talkspace'>('betterhelp');
  const [weatherData, setWeatherData] = useState<WeatherMoodPoint[]>([]);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState<string | null>(null);

  const latestCheckIn = checkIns[0];

  const eventCorrelations = useMemo(
    () => integrationService.getCalendarMoodCorrelations(checkIns).slice(0, 6),
    [checkIns, calendarImportCount]
  );

  const wearableCorrelations = useMemo(
    () => integrationService.getWearableMoodCorrelations(checkIns).slice(0, 6),
    [checkIns, heartRate]
  );

  const connectCalendar = (provider: 'google-calendar' | 'apple-calendar') => {
    const next = integrationService.updateConnections({ calendar: provider });
    setConnections(next);
  };

  const connectMusic = (provider: 'spotify' | 'apple-music') => {
    const next = integrationService.updateConnections({ music: provider });
    setConnections(next);
  };

  const connectWearable = (provider: 'apple-watch' | 'fitbit') => {
    const next = integrationService.updateConnections({ wearable: provider });
    setConnections(next);
  };

  const toggleTherapy = (platform: 'betterhelp' | 'talkspace') => {
    const has = connections.therapy.includes(platform);
    const therapy = has
      ? connections.therapy.filter((item) => item !== platform)
      : [...connections.therapy, platform];
    const next = integrationService.updateConnections({ therapy });
    setConnections(next);
  };

  const connectWeather = () => {
    const next = integrationService.updateConnections({ weather: true });
    setConnections(next);
  };

  const importCalendarEvents = () => {
    const rows = calendarInput
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);

    const parsed = rows
      .map((row) => {
        const [dateRaw, ...titleParts] = row.split('|').map((part) => part.trim());
        const title = titleParts.join(' | ');
        if (!dateRaw || !title) return null;
        if (!/^\d{4}-\d{2}-\d{2}$/.test(dateRaw)) return null;
        return { date: dateRaw, title };
      })
      .filter((item): item is { date: string; title: string } => !!item);

    if (parsed.length === 0) return;

    integrationService.addCalendarEvents(parsed);
    setCalendarInput('');
    setCalendarImportCount((count) => count + parsed.length);
  };

  const generateMusicMoodMatch = () => {
    if (!latestCheckIn || !connections.music) return;
    const match = integrationService.getMusicMoodMatch(
      latestCheckIn.mood,
      latestCheckIn.emotions,
      connections.music
    );
    setMusicMatch(match);
  };

  const addWearableSample = () => {
    if (!connections.wearable) return;
    const value = Number(heartRate);
    if (!Number.isFinite(value) || value < 35 || value > 220) return;

    integrationService.addWearableSample({
      source: connections.wearable,
      heartRate: value,
      recordedAt: new Date().toISOString(),
    });
    setHeartRate(String(value));
  };

  const exportForTherapy = (format: 'json' | 'csv') => {
    const payload = integrationService.createTherapyExport(checkIns, therapyPlatform, format);
    const url = URL.createObjectURL(payload.blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = payload.filename;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const analyzeWeatherImpact = async () => {
    if (!checkIns.length) return;
    setWeatherLoading(true);
    setWeatherError(null);

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 });
      });

      const points = await integrationService.fetchWeatherMoodCorrelations(
        checkIns,
        position.coords.latitude,
        position.coords.longitude
      );

      setWeatherData(points.slice(0, 14));
      connectWeather();
    } catch {
      setWeatherError('Weather analysis needs location permission and network access.');
    } finally {
      setWeatherLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-200 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            onClick={(event) => event.stopPropagation()}
            className="relative w-full max-w-4xl mx-4 max-h-[85vh] overflow-y-auto bg-[#0a0a0a] border border-white/10 rounded-2xl"
          >
            <div className="sticky top-0 flex items-center justify-between p-6 border-b border-white/10 bg-[#0a0a0a] z-10">
              <div className="flex items-center gap-3">
                <Link2 className="w-5 h-5" />
                <h2 className="font-display text-xl font-bold">Integration Ecosystem</h2>
              </div>
              <button
                onClick={onClose}
                aria-label="Close integration ecosystem"
                title="Close"
                className="p-2 text-white/60 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs font-mono uppercase tracking-widest">
                <div className={`p-2 rounded-lg border ${connections.calendar ? 'border-green-500/40 bg-green-500/10' : 'border-white/10 bg-white/5'}`}>Calendar</div>
                <div className={`p-2 rounded-lg border ${connections.music ? 'border-green-500/40 bg-green-500/10' : 'border-white/10 bg-white/5'}`}>Music</div>
                <div className={`p-2 rounded-lg border ${connections.wearable ? 'border-green-500/40 bg-green-500/10' : 'border-white/10 bg-white/5'}`}>Wearables</div>
                <div className={`p-2 rounded-lg border ${connections.therapy.length > 0 ? 'border-green-500/40 bg-green-500/10' : 'border-white/10 bg-white/5'}`}>Therapy</div>
                <div className={`p-2 rounded-lg border ${connections.weather ? 'border-green-500/40 bg-green-500/10' : 'border-white/10 bg-white/5'}`}>Weather</div>
              </div>

              <section className="p-4 bg-white/5 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2"><Calendar className="w-4 h-4" />Calendar integration</div>
                  <div className="flex gap-2">
                    <button onClick={() => connectCalendar('google-calendar')} className="px-3 py-1 text-xs rounded-lg border border-white/20 hover:bg-white/10">Google</button>
                    <button onClick={() => connectCalendar('apple-calendar')} className="px-3 py-1 text-xs rounded-lg border border-white/20 hover:bg-white/10">Apple</button>
                  </div>
                </div>
                <textarea
                  value={calendarInput}
                  onChange={(event) => setCalendarInput(event.target.value)}
                  placeholder="YYYY-MM-DD | Event title"
                  className="w-full min-h-21 px-3 py-2 text-sm bg-black/30 border border-white/10 rounded-lg"
                />
                <button onClick={importCalendarEvents} className="px-3 py-2 text-xs rounded-lg border border-white/20 hover:bg-white/10">Import events</button>
                {eventCorrelations.length > 0 && (
                  <div className="space-y-1 text-xs text-white/70">
                    {eventCorrelations.map((row) => (
                      <div key={row.date} className="flex items-center justify-between">
                        <span>{row.date} · mood {row.mood}/5</span>
                        <span>{row.events.length} events</span>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section className="p-4 bg-white/5 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2"><Music className="w-4 h-4" />Spotify / Apple Music mood match</div>
                  <div className="flex gap-2">
                    <button onClick={() => connectMusic('spotify')} className="px-3 py-1 text-xs rounded-lg border border-white/20 hover:bg-white/10">Spotify</button>
                    <button onClick={() => connectMusic('apple-music')} className="px-3 py-1 text-xs rounded-lg border border-white/20 hover:bg-white/10">Apple Music</button>
                  </div>
                </div>
                <button onClick={generateMusicMoodMatch} className="px-3 py-2 text-xs rounded-lg border border-white/20 hover:bg-white/10" disabled={!connections.music || !latestCheckIn}>Generate match</button>
                {musicMatch && (
                  <div className="p-3 rounded-lg border border-white/10 bg-black/20 text-xs space-y-1">
                    <div>Mood profile: {musicMatch.moodLabel}</div>
                    <div>Query: {musicMatch.query}</div>
                    <a href={musicMatch.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-white hover:text-green-300">
                      Open in {musicMatch.provider === 'spotify' ? 'Spotify' : 'Apple Music'}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </section>

              <section className="p-4 bg-white/5 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2"><Activity className="w-4 h-4" />Wearable data (heart rate)</div>
                  <div className="flex gap-2">
                    <button onClick={() => connectWearable('apple-watch')} className="px-3 py-1 text-xs rounded-lg border border-white/20 hover:bg-white/10">Apple Watch</button>
                    <button onClick={() => connectWearable('fitbit')} className="px-3 py-1 text-xs rounded-lg border border-white/20 hover:bg-white/10">Fitbit</button>
                  </div>
                </div>
                <div className="flex gap-2">
                  <input
                    value={heartRate}
                    onChange={(event) => setHeartRate(event.target.value)}
                    type="number"
                    min={35}
                    max={220}
                    placeholder="Heart rate"
                    title="Heart rate in BPM"
                    className="w-32 px-3 py-2 text-sm bg-black/30 border border-white/10 rounded-lg"
                  />
                  <button onClick={addWearableSample} className="px-3 py-2 text-xs rounded-lg border border-white/20 hover:bg-white/10" disabled={!connections.wearable}>Add sample</button>
                </div>
                {wearableCorrelations.length > 0 && (
                  <div className="space-y-1 text-xs text-white/70">
                    {wearableCorrelations.map((row) => (
                      <div key={row.date} className="flex items-center justify-between">
                        <span>{row.date} · mood {row.mood}/5</span>
                        <span>{row.averageHeartRate} bpm ({row.sampleCount})</span>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section className="p-4 bg-white/5 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2"><FileUp className="w-4 h-4" />Therapy platform export</div>
                  <div className="flex gap-2">
                    <button onClick={() => toggleTherapy('betterhelp')} className={`px-3 py-1 text-xs rounded-lg border ${connections.therapy.includes('betterhelp') ? 'border-green-500/40 bg-green-500/10' : 'border-white/20 hover:bg-white/10'}`}>BetterHelp</button>
                    <button onClick={() => toggleTherapy('talkspace')} className={`px-3 py-1 text-xs rounded-lg border ${connections.therapy.includes('talkspace') ? 'border-green-500/40 bg-green-500/10' : 'border-white/20 hover:bg-white/10'}`}>Talkspace</button>
                  </div>
                </div>
                <div className="flex gap-2">
                  <select
                    value={therapyPlatform}
                    onChange={(event) => setTherapyPlatform(event.target.value as 'betterhelp' | 'talkspace')}
                    title="Therapy platform"
                    className="px-3 py-2 text-xs bg-black/30 border border-white/10 rounded-lg"
                  >
                    <option value="betterhelp">BetterHelp</option>
                    <option value="talkspace">Talkspace</option>
                  </select>
                  <button onClick={() => exportForTherapy('json')} className="px-3 py-2 text-xs rounded-lg border border-white/20 hover:bg-white/10">Export JSON</button>
                  <button onClick={() => exportForTherapy('csv')} className="px-3 py-2 text-xs rounded-lg border border-white/20 hover:bg-white/10">Export CSV</button>
                </div>
              </section>

              <section className="p-4 bg-white/5 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2"><CloudSun className="w-4 h-4" />Weather impact on mood</div>
                  <button onClick={analyzeWeatherImpact} className="px-3 py-1 text-xs rounded-lg border border-white/20 hover:bg-white/10 inline-flex items-center gap-1" disabled={weatherLoading}>
                    <RefreshCw className={`w-3 h-3 ${weatherLoading ? 'animate-spin' : ''}`} /> Analyze
                  </button>
                </div>
                {weatherError && <div className="text-xs text-red-300">{weatherError}</div>}
                {weatherData.length > 0 && (
                  <div className="space-y-1 text-xs text-white/70">
                    {weatherData.map((point) => (
                      <div key={point.date} className="flex items-center justify-between">
                        <span>{point.date} · mood {point.mood}/5</span>
                        <span>{point.temperatureC == null ? '—' : `${point.temperatureC.toFixed(1)}°C`} · rain {point.precipitationMm ?? 0}mm</span>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
