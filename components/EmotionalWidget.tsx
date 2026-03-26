// Emotional State Widget - Shows current mood on home screen (PWA Widget API)
// Also provides in-app mini widget component

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Smile, Frown, Meh, Sun, Moon, Cloud, Zap, TrendingUp, TrendingDown, Minus, RefreshCw } from 'lucide-react';
import { EMOTION_CATEGORIES, MOOD_EMOJIS } from '../types';
import syncService from '../services/syncService';
import { EmotionalStateRecord } from '../services/offlineDB';

interface EmotionalWidgetProps {
  compact?: boolean;
  onExpand?: () => void;
}

// Mood to icon mapping
const getMoodIcon = (mood: number) => {
  if (mood >= 4) return <Smile className="w-6 h-6 text-green-400" />;
  if (mood >= 3) return <Meh className="w-6 h-6 text-yellow-400" />;
  return <Frown className="w-6 h-6 text-red-400" />;
};

// Get trend icon
const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
  switch (trend) {
    case 'up': return <TrendingUp className="w-4 h-4 text-green-400" />;
    case 'down': return <TrendingDown className="w-4 h-4 text-red-400" />;
    default: return <Minus className="w-4 h-4 text-white/40" />;
  }
};

// Get time of day greeting
const getGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour < 6) return 'Night owl';
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  if (hour < 21) return 'Good evening';
  return 'Night owl';
};

// Format relative time
const formatRelativeTime = (timestamp: number): string => {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString();
};

export const EmotionalWidget: React.FC<EmotionalWidgetProps> = ({ compact = false, onExpand }) => {
  const [currentState, setCurrentState] = useState<EmotionalStateRecord | null>(null);
  const [recentStates, setRecentStates] = useState<EmotionalStateRecord[]>([]);
  const [trend, setTrend] = useState<'up' | 'down' | 'stable'>('stable');
  const [isLoading, setIsLoading] = useState(true);

  const loadState = useCallback(async () => {
    try {
      const current = await syncService.getCurrentEmotionalState();
      if (current) {
        setCurrentState(current);
      }

      // Load recent history for trend
      const { offlineDB } = await import('../services/offlineDB');
      const history = await offlineDB.emotionalState.getHistory(10);
      setRecentStates(history);

      // Calculate trend from recent moods
      if (history.length >= 3) {
        const recentAvg = history.slice(0, 3).reduce((s, h) => s + h.mood, 0) / 3;
        const olderAvg = history.slice(3, 6).reduce((s, h) => s + h.mood, 0) / Math.min(history.length - 3, 3);
        if (olderAvg > 0) {
          setTrend(recentAvg > olderAvg + 0.3 ? 'up' : recentAvg < olderAvg - 0.3 ? 'down' : 'stable');
        }
      }
    } catch (err) {
      console.error('[Widget] Failed to load state:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadState();

    // Listen for updates via BroadcastChannel
    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel('aetheria-widget');
      channel.onmessage = (event) => {
        if (event.data.type === 'emotional-state-update') {
          setCurrentState(event.data.data);
          loadState();
        }
      };
    } catch {
      // BroadcastChannel not supported
    }

    return () => {
      channel?.close();
    };
  }, [loadState]);

  // Compact widget (for home screen / notification area)
  if (compact) {
    return (
      <motion.button
        onClick={onExpand}
        className="flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 rounded-xl backdrop-blur-sm hover:bg-white/10 transition-colors"
        whileTap={{ scale: 0.95 }}
      >
        {currentState ? (
          <>
            <div
              className="w-3 h-3 rounded-full animate-pulse"
              style={{ backgroundColor: currentState.color }}
            />
            <span className="text-xs text-white/70">
              {currentState.phrase || MOOD_EMOJIS[currentState.mood]}
            </span>
          </>
        ) : (
          <>
            <Heart className="w-3 h-3 text-white/40" />
            <span className="text-xs text-white/40">No mood set</span>
          </>
        )}
      </motion.button>
    );
  }

  // Full widget
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-2xl overflow-hidden backdrop-blur-xl"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <div className="flex items-center gap-2">
          <Heart className="w-4 h-4 text-purple-400" />
          <span className="text-sm font-medium text-white/80">Emotional State</span>
        </div>
        <button
          onClick={loadState}
          className="p-1 rounded-lg hover:bg-white/10 transition-colors"
          title="Refresh"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-white/40 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Current State */}
      {currentState ? (
        <div className="px-4 pb-4">
          {/* Mood display */}
          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center relative overflow-hidden"
              style={{ 
                backgroundColor: `${currentState.color}20`,
                border: `1px solid ${currentState.color}40`,
              }}
            >
              <div 
                className="absolute inset-0 animate-pulse opacity-30"
                style={{ backgroundColor: currentState.color }}
              />
              <span className="text-2xl relative z-10">{MOOD_EMOJIS[currentState.mood]}</span>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-white font-medium">{currentState.phrase}</span>
                {getTrendIcon(trend)}
              </div>
              <span className="text-xs text-white/40">
                {formatRelativeTime(currentState.timestamp)}
              </span>
            </div>
          </div>

          {/* Emotion tags */}
          {currentState.emotions.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {currentState.emotions.map((emotionId) => {
                const emotion = EMOTION_CATEGORIES.find(e => e.id === emotionId);
                return emotion ? (
                  <span
                    key={emotionId}
                    className="px-2 py-0.5 text-[10px] rounded-full border"
                    style={{
                      backgroundColor: `${emotion.color}15`,
                      borderColor: `${emotion.color}30`,
                      color: emotion.color,
                    }}
                  >
                    {emotion.label}
                  </span>
                ) : null;
              })}
            </div>
          )}

          {/* Mini mood history bar */}
          {recentStates.length > 1 && (
            <div className="flex items-end gap-0.5 h-6">
              {recentStates.slice(0, 7).reverse().map((state, i) => (
                <div
                  key={state.id}
                  className="flex-1 rounded-sm transition-all"
                  style={{
                    height: `${(state.mood / 5) * 100}%`,
                    backgroundColor: state.color,
                    opacity: 0.4 + (i / 7) * 0.6,
                  }}
                  title={`${MOOD_EMOJIS[state.mood]} - ${formatRelativeTime(state.timestamp)}`}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="px-4 pb-4 text-center">
          <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mx-auto mb-2">
            <Meh className="w-6 h-6 text-white/20" />
          </div>
          <p className="text-sm text-white/40 mb-1">{getGreeting()}</p>
          <p className="text-xs text-white/25">
            Complete a check-in to see your emotional state
          </p>
        </div>
      )}
    </motion.div>
  );
};

// ============================================
// PWA WIDGET DATA ENDPOINT HELPER
// ============================================

// Generates the adaptive card JSON for the PWA widget (used by /api/widget/emotional-state)
export function generateWidgetData(state: EmotionalStateRecord | null) {
  if (!state) {
    return {
      type: 'AdaptiveCard',
      version: '1.5',
      body: [
        {
          type: 'TextBlock',
          text: 'Aetheria',
          weight: 'Bolder',
          size: 'Medium',
        },
        {
          type: 'TextBlock',
          text: 'No mood recorded yet',
          wrap: true,
          color: 'Light',
        },
      ],
      actions: [
        {
          type: 'Action.Execute',
          title: 'Check In',
          verb: 'open',
          data: { url: '/?action=checkin' },
        },
      ],
    };
  }

  return {
    type: 'AdaptiveCard',
    version: '1.5',
    body: [
      {
        type: 'ColumnSet',
        columns: [
          {
            type: 'Column',
            width: 'auto',
            items: [
              {
                type: 'TextBlock',
                text: MOOD_EMOJIS[state.mood],
                size: 'ExtraLarge',
              },
            ],
          },
          {
            type: 'Column',
            width: 'stretch',
            items: [
              {
                type: 'TextBlock',
                text: state.phrase,
                weight: 'Bolder',
                size: 'Medium',
                wrap: true,
              },
              {
                type: 'TextBlock',
                text: state.emotions.map(id => {
                  const e = EMOTION_CATEGORIES.find(c => c.id === id);
                  return e?.label || id;
                }).join(', '),
                size: 'Small',
                color: 'Light',
                wrap: true,
              },
            ],
          },
        ],
      },
    ],
    actions: [
      {
        type: 'Action.Execute',
        title: 'Update',
        verb: 'open',
        data: { url: '/?action=checkin' },
      },
    ],
  };
}

export default EmotionalWidget;
