// Emotion Timeline Component - Visual journey through emotions
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Play, Pause, SkipBack, SkipForward, Clock } from 'lucide-react';
import { HistoryEntry, VisualParams } from '../types';

interface EmotionTimelineProps {
  isOpen: boolean;
  onClose: () => void;
  history: HistoryEntry[];
  onSelectEntry: (params: VisualParams) => void;
}

export const EmotionTimeline: React.FC<EmotionTimelineProps> = ({
  isOpen,
  onClose,
  history,
  onSelectEntry,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(3000); // ms per emotion

  // Auto-play through emotions
  React.useEffect(() => {
    if (!isPlaying || history.length === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => {
        const next = prev + 1;
        if (next >= history.length) {
          setIsPlaying(false);
          return 0;
        }
        onSelectEntry(history[next].params);
        return next;
      });
    }, playbackSpeed);

    return () => clearInterval(interval);
  }, [isPlaying, history, playbackSpeed, onSelectEntry]);

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const handlePlay = () => {
    if (history.length === 0) return;
    if (currentIndex === 0) {
      onSelectEntry(history[0].params);
    }
    setIsPlaying(true);
  };

  const handlePause = () => {
    setIsPlaying(false);
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      const newIndex = currentIndex - 1;
      setCurrentIndex(newIndex);
      onSelectEntry(history[newIndex].params);
    }
  };

  const handleNext = () => {
    if (currentIndex < history.length - 1) {
      const newIndex = currentIndex + 1;
      setCurrentIndex(newIndex);
      onSelectEntry(history[newIndex].params);
    }
  };

  const handleSelectPoint = (index: number) => {
    setCurrentIndex(index);
    onSelectEntry(history[index].params);
    setIsPlaying(false);
  };

  // Group history by date
  const groupedHistory = history.reduce((acc, entry) => {
    const date = formatDate(entry.timestamp);
    if (!acc[date]) acc[date] = [];
    acc[date].push(entry);
    return acc;
  }, {} as Record<string, HistoryEntry[]>);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[150] bg-black/95 backdrop-blur-xl overflow-hidden"
        >
          {/* Header */}
          <div className="absolute top-0 left-0 right-0 z-10 p-6 flex items-center justify-between bg-gradient-to-b from-black to-transparent">
            <div>
              <h2 className="font-display text-3xl font-bold uppercase tracking-tighter">
                Emotion Timeline
              </h2>
              <p className="text-white/60 font-mono text-sm mt-1">
                {history.length} moments captured
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-3 rounded-full border border-white/10 hover:border-white/30 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Timeline visualization */}
          <div className="absolute inset-0 pt-24 pb-32 px-6 overflow-y-auto">
            {history.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <Clock className="w-12 h-12 text-white/20 mb-4" />
                <p className="text-white/60">No emotions recorded yet.</p>
                <p className="text-white/40 text-sm mt-2">
                  Start expressing yourself to build your timeline.
                </p>
              </div>
            ) : (
              <div className="max-w-4xl mx-auto">
                {/* Visual timeline */}
                <div className="relative">
                  {/* Timeline line */}
                  <div className="absolute left-6 top-0 bottom-0 w-px bg-white/10" />

                  {/* Timeline entries */}
                  {Object.entries(groupedHistory).map(([date, entries]) => (
                    <div key={date} className="mb-8">
                      <div className="sticky top-0 z-10 py-2 bg-black/80 backdrop-blur-sm">
                        <span className="text-xs font-mono uppercase tracking-widest text-white/40 ml-14">
                          {date}
                        </span>
                      </div>

                      {entries.map((entry, entryIndex) => {
                        const globalIndex = history.findIndex((h) => h.id === entry.id);
                        const isActive = globalIndex === currentIndex;

                        return (
                          <motion.button
                            key={entry.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: entryIndex * 0.05 }}
                            onClick={() => handleSelectPoint(globalIndex)}
                            className={`relative flex items-start gap-4 w-full p-4 rounded-lg transition-all text-left ${
                              isActive
                                ? 'bg-white/10'
                                : 'hover:bg-white/5'
                            }`}
                          >
                            {/* Timeline dot */}
                            <div
                              className={`relative z-10 w-3 h-3 rounded-full border-2 transition-all ${
                                isActive
                                  ? 'border-white scale-150'
                                  : 'border-white/30'
                              }`}
                              style={{ backgroundColor: entry.params.color }}
                            />

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3">
                                <div
                                  className="w-8 h-8 rounded-lg flex-shrink-0"
                                  style={{ backgroundColor: entry.params.color }}
                                />
                                <div className="flex-1 min-w-0">
                                  <p className="font-display font-bold truncate">
                                    {entry.params.phrase}
                                  </p>
                                  <p className="text-xs text-white/40">
                                    "{entry.input}" • {formatTime(entry.timestamp)}
                                  </p>
                                </div>
                              </div>
                              {entry.note && (
                                <p className="mt-2 text-sm text-white/60 italic">
                                  "{entry.note}"
                                </p>
                              )}
                            </div>
                          </motion.button>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Playback controls */}
          {history.length > 0 && (
            <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black via-black/90 to-transparent">
              <div className="max-w-md mx-auto">
                {/* Progress bar */}
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-xs font-mono w-8">{currentIndex + 1}</span>
                  <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-white"
                      style={{
                        width: `${((currentIndex + 1) / history.length) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="text-xs font-mono w-8 text-right">{history.length}</span>
                </div>

                {/* Controls */}
                <div className="flex items-center justify-center gap-4">
                  <button
                    onClick={handlePrev}
                    disabled={currentIndex === 0}
                    className="p-2 rounded-full hover:bg-white/10 disabled:opacity-30 transition-colors"
                  >
                    <SkipBack className="w-5 h-5" />
                  </button>

                  <button
                    onClick={isPlaying ? handlePause : handlePlay}
                    className="p-4 rounded-full bg-white text-black hover:bg-white/90 transition-colors"
                  >
                    {isPlaying ? (
                      <Pause className="w-6 h-6" />
                    ) : (
                      <Play className="w-6 h-6 ml-0.5" />
                    )}
                  </button>

                  <button
                    onClick={handleNext}
                    disabled={currentIndex === history.length - 1}
                    className="p-2 rounded-full hover:bg-white/10 disabled:opacity-30 transition-colors"
                  >
                    <SkipForward className="w-5 h-5" />
                  </button>
                </div>

                {/* Speed selector */}
                <div className="flex items-center justify-center gap-2 mt-4">
                  <span className="text-xs text-white/40">Speed:</span>
                  {[
                    { label: '0.5x', value: 6000 },
                    { label: '1x', value: 3000 },
                    { label: '2x', value: 1500 },
                  ].map(({ label, value }) => (
                    <button
                      key={value}
                      onClick={() => setPlaybackSpeed(value)}
                      className={`px-2 py-1 text-xs rounded transition-colors ${
                        playbackSpeed === value
                          ? 'bg-white/20 text-white'
                          : 'text-white/40 hover:text-white'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};
