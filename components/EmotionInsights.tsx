// Emotion Insights Component - Analytics dashboard
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, TrendingUp, TrendingDown, Minus, Flame, Calendar, BarChart3, PieChart } from 'lucide-react';
import { DailyCheckIn, EmotionInsights as InsightsType, EMOTION_CATEGORIES, MOOD_EMOJIS } from '../types';

interface EmotionInsightsProps {
  isOpen: boolean;
  onClose: () => void;
  checkIns: DailyCheckIn[];
  streak: number;
}

type Period = 'week' | 'month' | 'year';

export const EmotionInsights: React.FC<EmotionInsightsProps> = ({
  isOpen,
  onClose,
  checkIns,
  streak,
}) => {
  const [period, setPeriod] = useState<Period>('week');

  const insights = useMemo((): InsightsType => {
    const now = new Date();
    let startDate: Date;
    
    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
    }

    const filteredCheckIns = checkIns.filter(c => new Date(c.date) >= startDate);
    
    // Calculate average mood
    const averageMood = filteredCheckIns.length > 0
      ? filteredCheckIns.reduce((sum, c) => sum + c.mood, 0) / filteredCheckIns.length
      : 0;

    // Calculate mood trend (compare first half to second half)
    const midPoint = Math.floor(filteredCheckIns.length / 2);
    const firstHalf = filteredCheckIns.slice(midPoint);
    const secondHalf = filteredCheckIns.slice(0, midPoint);
    const firstAvg = firstHalf.length > 0 ? firstHalf.reduce((sum, c) => sum + c.mood, 0) / firstHalf.length : 0;
    const secondAvg = secondHalf.length > 0 ? secondHalf.reduce((sum, c) => sum + c.mood, 0) / secondHalf.length : 0;
    const moodTrend = secondAvg - firstAvg;

    // Calculate top emotions
    const emotionCounts: Record<string, number> = {};
    filteredCheckIns.forEach(c => {
      c.emotions.forEach(e => {
        emotionCounts[e] = (emotionCounts[e] || 0) + 1;
      });
    });
    const topEmotions = Object.entries(emotionCounts)
      .map(([emotion, count]) => ({ emotion, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Calculate longest streak
    const allDates = [...new Set(checkIns.map(c => c.date))].sort();
    let longestStreak = 0;
    let currentStreak = 1;
    
    for (let i = 1; i < allDates.length; i++) {
      const prevDate = new Date(allDates[i - 1]);
      const currDate = new Date(allDates[i]);
      const diffDays = (currDate.getTime() - prevDate.getTime()) / (24 * 60 * 60 * 1000);
      
      if (diffDays === 1) {
        currentStreak++;
        longestStreak = Math.max(longestStreak, currentStreak);
      } else {
        currentStreak = 1;
      }
    }
    longestStreak = Math.max(longestStreak, currentStreak);

    // Mood by day
    const moodByDay = filteredCheckIns
      .map(c => ({ date: c.date, mood: c.mood }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Color usage
    const colorCounts: Record<string, number> = {};
    filteredCheckIns.forEach(c => {
      if (c.params?.color) {
        colorCounts[c.params.color] = (colorCounts[c.params.color] || 0) + 1;
      }
    });
    const colorUsage = Object.entries(colorCounts)
      .map(([color, count]) => ({ color, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);

    return {
      period,
      totalCheckIns: filteredCheckIns.length,
      averageMood,
      moodTrend,
      topEmotions,
      streakDays: streak,
      longestStreak,
      moodByDay,
      colorUsage,
    };
  }, [checkIns, period, streak]);

  const getTrendIcon = () => {
    if (insights.moodTrend > 0.1) return <TrendingUp className="w-5 h-5 text-green-400" />;
    if (insights.moodTrend < -0.1) return <TrendingDown className="w-5 h-5 text-red-400" />;
    return <Minus className="w-5 h-5 text-white/50" />;
  };

  const getTrendText = () => {
    if (insights.moodTrend > 0.1) return 'Improving';
    if (insights.moodTrend < -0.1) return 'Declining';
    return 'Stable';
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
            className="relative w-full max-w-2xl mx-4 max-h-[85vh] overflow-y-auto bg-[#0a0a0a] border border-white/10 rounded-2xl"
          >
            {/* Header */}
            <div className="sticky top-0 flex items-center justify-between p-6 border-b border-white/10 bg-[#0a0a0a] z-10">
              <div className="flex items-center gap-3">
                <BarChart3 className="w-5 h-5" />
                <h2 className="font-display text-xl font-bold">Emotion Insights</h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-white/60 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Period Selector */}
            <div className="flex justify-center gap-2 p-4 border-b border-white/10">
              {(['week', 'month', 'year'] as Period[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    period === p
                      ? 'bg-white text-black'
                      : 'bg-white/5 hover:bg-white/10'
                  }`}
                >
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>

            {/* Content */}
            {insights.totalCheckIns === 0 ? (
              <div className="p-12 text-center">
                <Calendar className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <h3 className="font-display text-lg font-bold mb-2">No data yet</h3>
                <p className="text-white/50">Complete daily check-ins to see your insights.</p>
              </div>
            ) : (
              <div className="p-6 space-y-6">
                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {/* Total Check-ins */}
                  <div className="p-4 bg-white/5 rounded-xl">
                    <Calendar className="w-5 h-5 mb-2 opacity-60" />
                    <p className="text-2xl font-bold">{insights.totalCheckIns}</p>
                    <p className="text-xs text-white/50">Check-ins</p>
                  </div>

                  {/* Average Mood */}
                  <div className="p-4 bg-white/5 rounded-xl">
                    <span className="text-2xl">{MOOD_EMOJIS[Math.round(insights.averageMood)] || '😐'}</span>
                    <p className="text-2xl font-bold">{insights.averageMood.toFixed(1)}</p>
                    <p className="text-xs text-white/50">Avg Mood</p>
                  </div>

                  {/* Mood Trend */}
                  <div className="p-4 bg-white/5 rounded-xl">
                    {getTrendIcon()}
                    <p className="text-lg font-bold mt-1">{getTrendText()}</p>
                    <p className="text-xs text-white/50">Trend</p>
                  </div>

                  {/* Streak */}
                  <div className="p-4 bg-white/5 rounded-xl">
                    <Flame className="w-5 h-5 mb-2 text-orange-400" />
                    <p className="text-2xl font-bold">{insights.streakDays}</p>
                    <p className="text-xs text-white/50">Day Streak</p>
                  </div>
                </div>

                {/* Mood Chart */}
                {insights.moodByDay.length > 1 && (
                  <div className="p-4 bg-white/5 rounded-xl">
                    <h3 className="text-sm font-mono uppercase tracking-widest opacity-60 mb-4">Mood Over Time</h3>
                    <div className="h-32 flex items-end gap-1">
                      {insights.moodByDay.slice(-14).map((day, i) => (
                        <div
                          key={day.date}
                          className="flex-1 flex flex-col items-center gap-1"
                        >
                          <div
                            className="w-full rounded-t transition-all"
                            style={{
                              height: `${(day.mood / 5) * 100}%`,
                              backgroundColor: `hsl(${(day.mood - 1) * 30}, 70%, 50%)`,
                              minHeight: '4px',
                            }}
                          />
                          <span className="text-[8px] opacity-30">
                            {new Date(day.date).getDate()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Top Emotions */}
                {insights.topEmotions.length > 0 && (
                  <div className="p-4 bg-white/5 rounded-xl">
                    <h3 className="text-sm font-mono uppercase tracking-widest opacity-60 mb-4">Top Emotions</h3>
                    <div className="space-y-3">
                      {insights.topEmotions.map(({ emotion, count }) => {
                        const emotionData = EMOTION_CATEGORIES.find(e => e.id === emotion);
                        const maxCount = insights.topEmotions[0]?.count || 1;
                        
                        return (
                          <div key={emotion} className="flex items-center gap-3">
                            <span className="text-xl">{emotionData?.emoji || '❓'}</span>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm">{emotionData?.label || emotion}</span>
                                <span className="text-xs opacity-50">{count}</span>
                              </div>
                              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${(count / maxCount) * 100}%` }}
                                  className="h-full rounded-full"
                                  style={{ backgroundColor: emotionData?.color || '#8B5CF6' }}
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Color Usage */}
                {insights.colorUsage.length > 0 && (
                  <div className="p-4 bg-white/5 rounded-xl">
                    <h3 className="text-sm font-mono uppercase tracking-widest opacity-60 mb-4">Color Palette</h3>
                    <div className="flex gap-2 flex-wrap">
                      {insights.colorUsage.map(({ color, count }) => (
                        <div
                          key={color}
                          className="flex items-center gap-2 px-3 py-2 bg-white/5 rounded-lg"
                        >
                          <div
                            className="w-5 h-5 rounded-full"
                            style={{ backgroundColor: color }}
                          />
                          <span className="text-xs">{count}×</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Achievements */}
                <div className="p-4 bg-white/5 rounded-xl">
                  <h3 className="text-sm font-mono uppercase tracking-widest opacity-60 mb-4">Achievements</h3>
                  <div className="flex flex-wrap gap-2">
                    {insights.streakDays >= 3 && (
                      <span className="px-3 py-1 bg-orange-500/20 text-orange-400 rounded-full text-sm">
                        🔥 3+ Day Streak
                      </span>
                    )}
                    {insights.streakDays >= 7 && (
                      <span className="px-3 py-1 bg-orange-500/20 text-orange-400 rounded-full text-sm">
                        🔥 Week Warrior
                      </span>
                    )}
                    {insights.totalCheckIns >= 10 && (
                      <span className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-sm">
                        ✨ 10+ Check-ins
                      </span>
                    )}
                    {insights.averageMood >= 4 && (
                      <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm">
                        😊 Positive Vibes
                      </span>
                    )}
                    {insights.longestStreak >= 14 && (
                      <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-sm">
                        🏆 Two Week Champion
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
