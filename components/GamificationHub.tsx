// Gamification Hub Component
// XP progress, achievement badges, active challenges, unlocked rewards
import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Trophy, Star, Flame, Zap, Lock, Unlock, Target,
  ChevronRight, Sparkles, Award, Clock
} from 'lucide-react';
import { Achievement, ACHIEVEMENTS, CHALLENGE_POOL, XP_LEVELS } from '../types';
import { useGamificationStore } from '../store/useStore';

// ============================================
// PROPS
// ============================================
interface GamificationHubProps {
  isOpen: boolean;
  onClose: () => void;
}

// ============================================
// TIER COLORS
// ============================================
const TIER_COLORS: Record<string, { bg: string; border: string; text: string; glow: string }> = {
  bronze: { bg: 'bg-amber-900/20', border: 'border-amber-700/40', text: 'text-amber-500', glow: '#92400E' },
  silver: { bg: 'bg-gray-400/10', border: 'border-gray-400/30', text: 'text-gray-300', glow: '#9CA3AF' },
  gold: { bg: 'bg-yellow-500/15', border: 'border-yellow-500/40', text: 'text-yellow-400', glow: '#EAB308' },
  platinum: { bg: 'bg-cyan-400/10', border: 'border-cyan-400/30', text: 'text-cyan-300', glow: '#22D3EE' },
};

const CATEGORY_LABELS: Record<string, { label: string; icon: string }> = {
  streak: { label: 'Streaks', icon: '🔥' },
  emotion: { label: 'Emotions', icon: '🎭' },
  journal: { label: 'Journal', icon: '📖' },
  exploration: { label: 'Exploration', icon: '🎨' },
  mastery: { label: 'Mastery', icon: '🏆' },
  social: { label: 'Social', icon: '👥' },
};

type TabType = 'overview' | 'achievements' | 'challenges' | 'rewards';

// ============================================
// SUB-COMPONENT: Achievement Badge
// ============================================
const AchievementBadge: React.FC<{
  achievement: Achievement;
  unlocked: boolean;
  isNew?: boolean;
}> = ({ achievement, unlocked, isNew }) => {
  const tier = TIER_COLORS[achievement.tier] || TIER_COLORS.bronze;

  return (
    <motion.div
      initial={isNew ? { scale: 0.8, opacity: 0 } : false}
      animate={{ scale: 1, opacity: 1 }}
      className={`relative p-3 rounded-xl border transition-all ${
        unlocked
          ? `${tier.bg} ${tier.border} hover:scale-[1.02]`
          : 'bg-white/[0.02] border-white/5 opacity-40'
      }`}
    >
      {isNew && (
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-pulse" />
      )}
      <div className="flex items-start gap-3">
        <div className={`text-2xl ${unlocked ? '' : 'grayscale'}`}>
          {unlocked ? achievement.icon : '🔒'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className={`text-sm font-bold truncate ${unlocked ? tier.text : 'text-white/30'}`}>
              {achievement.title}
            </h4>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${
              unlocked ? `${tier.border} ${tier.text}` : 'border-white/10 text-white/20'
            }`}>
              {achievement.tier}
            </span>
          </div>
          <p className="text-xs text-white/40 mt-0.5">{achievement.description}</p>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-[10px] font-mono text-white/30">+{achievement.xpReward} XP</span>
            {achievement.unlocksVisualization && (
              <span className="text-[10px] font-mono text-purple-400/60">
                + {achievement.unlocksVisualization} mode
              </span>
            )}
            {achievement.unlocksTheme && (
              <span className="text-[10px] font-mono text-cyan-400/60">
                + {achievement.unlocksTheme} theme
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================
export const GamificationHub: React.FC<GamificationHubProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);

  const { progress, newAchievements, clearNewAchievements, refreshChallenges, getActiveChallenges } = useGamificationStore();

  // Refresh challenges on open
  useEffect(() => {
    if (isOpen) {
      refreshChallenges();
    }
  }, [isOpen, refreshChallenges]);

  // Clear new achievements notification on tab visit
  useEffect(() => {
    if (activeTab === 'achievements' && newAchievements.length > 0) {
      const timer = setTimeout(clearNewAchievements, 3000);
      return () => clearTimeout(timer);
    }
  }, [activeTab, newAchievements, clearNewAchievements]);

  // Current level info
  const levelInfo = useMemo(() => {
    const current = XP_LEVELS.find(l => l.level === progress.level) || XP_LEVELS[0];
    const next = XP_LEVELS.find(l => l.level === progress.level + 1);
    const xpInLevel = progress.xp - current.xpRequired;
    const xpForLevel = next ? next.xpRequired - current.xpRequired : 1;
    const progressPercent = next ? Math.min((xpInLevel / xpForLevel) * 100, 100) : 100;

    return { current, next, xpInLevel, xpForLevel, progressPercent };
  }, [progress.xp, progress.level]);

  // Active challenges
  const activeChallenges = useMemo(() => getActiveChallenges(), [progress.activeChallenges]);

  // Achievement stats
  const achievementStats = useMemo(() => {
    const total = ACHIEVEMENTS.length;
    const unlocked = progress.unlockedAchievements.length;
    const byCategory: Record<string, { total: number; unlocked: number }> = {};

    ACHIEVEMENTS.forEach(a => {
      if (!byCategory[a.category]) {
        byCategory[a.category] = { total: 0, unlocked: 0 };
      }
      byCategory[a.category].total++;
      if (progress.unlockedAchievements.includes(a.id)) {
        byCategory[a.category].unlocked++;
      }
    });

    return { total, unlocked, byCategory };
  }, [progress.unlockedAchievements]);

  // Filtered achievements
  const filteredAchievements = useMemo(() => {
    let list = [...ACHIEVEMENTS];
    if (categoryFilter) {
      list = list.filter(a => a.category === categoryFilter);
    }
    // Sort: unlocked first, then by tier
    const tierOrder = { platinum: 0, gold: 1, silver: 2, bronze: 3 };
    list.sort((a, b) => {
      const aUnlocked = progress.unlockedAchievements.includes(a.id) ? 0 : 1;
      const bUnlocked = progress.unlockedAchievements.includes(b.id) ? 0 : 1;
      if (aUnlocked !== bUnlocked) return aUnlocked - bUnlocked;
      return (tierOrder[a.tier] || 3) - (tierOrder[b.tier] || 3);
    });
    return list;
  }, [categoryFilter, progress.unlockedAchievements]);

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Overview', icon: <Star className="w-3.5 h-3.5" /> },
    { id: 'achievements', label: 'Achievements', icon: <Trophy className="w-3.5 h-3.5" /> },
    { id: 'challenges', label: 'Challenges', icon: <Target className="w-3.5 h-3.5" /> },
    { id: 'rewards', label: 'Rewards', icon: <Sparkles className="w-3.5 h-3.5" /> },
  ];

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
                <Trophy className="w-5 h-5 text-yellow-400" />
                <h2 className="font-display text-xl font-bold">Gamification Hub</h2>
                {newAchievements.length > 0 && (
                  <span className="px-2 py-0.5 bg-yellow-500/20 border border-yellow-500/30 rounded-full text-xs text-yellow-400 animate-pulse">
                    {newAchievements.length} new!
                  </span>
                )}
              </div>
              <button
                onClick={onClose}
                className="p-2 text-white/60 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* XP Bar (always visible) */}
            <div className="px-6 py-4 border-b border-white/5 flex-shrink-0">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-yellow-400" />
                  <span className="font-display text-sm font-bold">
                    Level {progress.level}
                  </span>
                  <span className="text-xs text-white/40 font-mono">
                    {levelInfo.current.title}
                  </span>
                </div>
                <span className="text-xs font-mono text-white/40">
                  {progress.xp.toLocaleString()} XP
                  {levelInfo.next && (
                    <span> / {levelInfo.next.xpRequired.toLocaleString()}</span>
                  )}
                </span>
              </div>
              <div className="h-2.5 bg-white/5 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${levelInfo.progressPercent}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  className="h-full rounded-full bg-gradient-to-r from-yellow-500 to-amber-400"
                />
              </div>
              {levelInfo.next && (
                <p className="text-[10px] text-white/25 mt-1 font-mono">
                  {levelInfo.xpForLevel - levelInfo.xpInLevel} XP to {levelInfo.next.title}
                </p>
              )}
            </div>

            {/* Tab Navigation */}
            <div className="flex border-b border-white/5 px-6 flex-shrink-0">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-white text-white'
                      : 'border-transparent text-white/40 hover:text-white/60'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <AnimatePresence mode="wait">
                {/* ===== OVERVIEW TAB ===== */}
                {activeTab === 'overview' && (
                  <motion.div
                    key="overview"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-6"
                  >
                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="p-3 bg-white/5 rounded-xl text-center">
                        <p className="text-2xl font-bold">{progress.totalCheckIns}</p>
                        <p className="text-[10px] text-white/40 font-mono uppercase">Check-ins</p>
                      </div>
                      <div className="p-3 bg-white/5 rounded-xl text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Flame className="w-4 h-4 text-orange-400" />
                          <p className="text-2xl font-bold">{progress.currentStreak}</p>
                        </div>
                        <p className="text-[10px] text-white/40 font-mono uppercase">Streak</p>
                      </div>
                      <div className="p-3 bg-white/5 rounded-xl text-center">
                        <p className="text-2xl font-bold">{progress.totalJournalEntries}</p>
                        <p className="text-[10px] text-white/40 font-mono uppercase">Journal</p>
                      </div>
                      <div className="p-3 bg-white/5 rounded-xl text-center">
                        <p className="text-2xl font-bold">{progress.totalVisualizations}</p>
                        <p className="text-[10px] text-white/40 font-mono uppercase">Visuals</p>
                      </div>
                    </div>

                    {/* Achievement Progress */}
                    <div className="p-4 bg-white/5 rounded-xl">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-mono uppercase tracking-widest text-white/50">
                          Achievements
                        </h3>
                        <span className="text-xs font-mono text-white/30">
                          {achievementStats.unlocked}/{achievementStats.total}
                        </span>
                      </div>
                      <div className="h-2 bg-white/5 rounded-full overflow-hidden mb-3">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${(achievementStats.unlocked / achievementStats.total) * 100}%` }}
                          className="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500"
                        />
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {Object.entries(achievementStats.byCategory).map(([cat, stats]) => (
                          <div key={cat} className="flex items-center gap-2 text-xs">
                            <span>{CATEGORY_LABELS[cat]?.icon || '?'}</span>
                            <span className="text-white/50">{CATEGORY_LABELS[cat]?.label || cat}</span>
                            <span className="text-white/30 ml-auto font-mono">{stats.unlocked}/{stats.total}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Active Challenges Preview */}
                    {activeChallenges.length > 0 && (
                      <div className="p-4 bg-white/5 rounded-xl">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-sm font-mono uppercase tracking-widest text-white/50">
                            Active Challenges
                          </h3>
                          <button
                            onClick={() => setActiveTab('challenges')}
                            className="text-xs text-white/30 hover:text-white/60 flex items-center gap-1"
                          >
                            View all <ChevronRight className="w-3 h-3" />
                          </button>
                        </div>
                        <div className="space-y-2">
                          {activeChallenges.slice(0, 3).map(c => {
                            const def = CHALLENGE_POOL.find(d => d.id === c.challengeId);
                            if (!def) return null;
                            const pct = Math.min((c.progress / def.requirement.value) * 100, 100);
                            const completed = c.progress >= def.requirement.value;

                            return (
                              <div key={c.challengeId} className="flex items-center gap-3">
                                <span className="text-lg">{def.icon}</span>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between">
                                    <span className={`text-xs ${completed ? 'text-green-400' : 'text-white/70'}`}>
                                      {def.title}
                                    </span>
                                    <span className="text-[10px] font-mono text-white/30">
                                      {c.progress}/{def.requirement.value}
                                    </span>
                                  </div>
                                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden mt-1">
                                    <div
                                      className={`h-full rounded-full transition-all ${
                                        completed ? 'bg-green-400' : 'bg-white/30'
                                      }`}
                                      style={{ width: `${pct}%` }}
                                    />
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Recent Unlocks */}
                    {progress.unlockedAchievements.length > 0 && (
                      <div>
                        <h3 className="text-sm font-mono uppercase tracking-widest text-white/50 mb-3">
                          Recent Unlocks
                        </h3>
                        <div className="space-y-2">
                          {progress.unlockedAchievements.slice(-3).reverse().map(id => {
                            const a = ACHIEVEMENTS.find(x => x.id === id);
                            if (!a) return null;
                            return (
                              <AchievementBadge
                                key={id}
                                achievement={a}
                                unlocked
                                isNew={newAchievements.includes(id)}
                              />
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* ===== ACHIEVEMENTS TAB ===== */}
                {activeTab === 'achievements' && (
                  <motion.div
                    key="achievements"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-4"
                  >
                    {/* Category Filter */}
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        onClick={() => setCategoryFilter(null)}
                        className={`px-3 py-1.5 rounded-lg text-xs border transition-colors ${
                          !categoryFilter
                            ? 'border-white/30 bg-white/10 text-white'
                            : 'border-white/10 text-white/40 hover:text-white/60'
                        }`}
                      >
                        All ({achievementStats.unlocked}/{achievementStats.total})
                      </button>
                      {Object.entries(CATEGORY_LABELS).map(([cat, info]) => {
                        const stats = achievementStats.byCategory[cat];
                        if (!stats) return null;
                        return (
                          <button
                            key={cat}
                            onClick={() => setCategoryFilter(categoryFilter === cat ? null : cat)}
                            className={`px-3 py-1.5 rounded-lg text-xs border transition-colors ${
                              categoryFilter === cat
                                ? 'border-white/30 bg-white/10 text-white'
                                : 'border-white/10 text-white/40 hover:text-white/60'
                            }`}
                          >
                            {info.icon} {info.label} ({stats.unlocked}/{stats.total})
                          </button>
                        );
                      })}
                    </div>

                    {/* Achievement Grid */}
                    <div className="space-y-2">
                      {filteredAchievements.map(a => (
                        <AchievementBadge
                          key={a.id}
                          achievement={a}
                          unlocked={progress.unlockedAchievements.includes(a.id)}
                          isNew={newAchievements.includes(a.id)}
                        />
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* ===== CHALLENGES TAB ===== */}
                {activeTab === 'challenges' && (
                  <motion.div
                    key="challenges"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-6"
                  >
                    {/* Active Challenges */}
                    <div>
                      <h3 className="text-sm font-mono uppercase tracking-widest text-white/50 mb-3">
                        Active Challenges
                      </h3>
                      {activeChallenges.length === 0 ? (
                        <div className="text-center py-8">
                          <Target className="w-8 h-8 mx-auto mb-2 opacity-20" />
                          <p className="text-sm text-white/30">No active challenges. Check back soon!</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {activeChallenges.map(c => {
                            const def = CHALLENGE_POOL.find(d => d.id === c.challengeId);
                            if (!def) return null;
                            const pct = Math.min((c.progress / def.requirement.value) * 100, 100);
                            const completed = c.progress >= def.requirement.value;
                            const timeLeft = c.expiresAt - Date.now();
                            const hoursLeft = Math.max(0, Math.floor(timeLeft / (1000 * 60 * 60)));
                            const daysLeft = Math.floor(hoursLeft / 24);

                            return (
                              <div
                                key={c.challengeId}
                                className={`p-4 rounded-xl border transition-all ${
                                  completed
                                    ? 'bg-green-500/5 border-green-500/20'
                                    : 'bg-white/[0.02] border-white/10'
                                }`}
                              >
                                <div className="flex items-start gap-3">
                                  <span className="text-2xl">{def.icon}</span>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-1">
                                      <h4 className={`text-sm font-bold ${
                                        completed ? 'text-green-400' : 'text-white/80'
                                      }`}>
                                        {def.title}
                                      </h4>
                                      <span className={`text-[10px] px-2 py-0.5 rounded-full border ${
                                        def.type === 'daily'
                                          ? 'border-blue-500/30 text-blue-400'
                                          : 'border-purple-500/30 text-purple-400'
                                      }`}>
                                        {def.type}
                                      </span>
                                    </div>
                                    <p className="text-xs text-white/40 mb-2">{def.description}</p>
                                    <div className="flex items-center gap-3">
                                      <div className="flex-1">
                                        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                          <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${pct}%` }}
                                            className={`h-full rounded-full ${
                                              completed
                                                ? 'bg-green-400'
                                                : 'bg-gradient-to-r from-blue-500 to-purple-500'
                                            }`}
                                          />
                                        </div>
                                      </div>
                                      <span className="text-xs font-mono text-white/40">
                                        {c.progress}/{def.requirement.value}
                                      </span>
                                    </div>
                                    <div className="flex items-center justify-between mt-2">
                                      <span className="text-[10px] font-mono text-white/25 flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {daysLeft > 0 ? `${daysLeft}d ${hoursLeft % 24}h` : `${hoursLeft}h`} left
                                      </span>
                                      <span className="text-[10px] font-mono text-yellow-400/60">
                                        +{def.xpReward} XP
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Completed Count */}
                    <div className="p-4 bg-white/5 rounded-xl">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-white/50">Total Challenges Completed</span>
                        <span className="font-bold text-lg">{progress.totalChallengesCompleted}</span>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* ===== REWARDS TAB ===== */}
                {activeTab === 'rewards' && (
                  <motion.div
                    key="rewards"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-6"
                  >
                    {/* Unlocked Visualizations */}
                    <div>
                      <h3 className="text-sm font-mono uppercase tracking-widest text-white/50 mb-3">
                        Visualization Modes
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {['sphere', 'particles', 'aurora', 'minimal', 'fluid', 'geometric', 'nebula'].map(mode => {
                          const unlocked = progress.unlockedVisualizations.includes(mode as any);
                          const unlockedBy = ACHIEVEMENTS.find(
                            a => a.unlocksVisualization === mode && progress.unlockedAchievements.includes(a.id)
                          );

                          return (
                            <div
                              key={mode}
                              className={`p-3 rounded-xl border text-center transition-all ${
                                unlocked
                                  ? 'bg-purple-500/10 border-purple-500/20'
                                  : 'bg-white/[0.02] border-white/5 opacity-40'
                              }`}
                            >
                              <div className="text-lg mb-1">
                                {unlocked ? <Unlock className="w-5 h-5 mx-auto text-purple-400" /> : <Lock className="w-5 h-5 mx-auto text-white/20" />}
                              </div>
                              <p className={`text-sm font-medium capitalize ${unlocked ? 'text-white/80' : 'text-white/20'}`}>
                                {mode}
                              </p>
                              {unlocked && unlockedBy && (
                                <p className="text-[10px] text-purple-400/50 mt-1">{unlockedBy.icon} {unlockedBy.title}</p>
                              )}
                              {!unlocked && (
                                <p className="text-[10px] text-white/15 mt-1">Locked</p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Unlocked Themes */}
                    <div>
                      <h3 className="text-sm font-mono uppercase tracking-widest text-white/50 mb-3">
                        Themes
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {['dark', 'light', 'cosmic', 'minimal', 'custom'].map(theme => {
                          const unlocked = progress.unlockedThemes.includes(theme as any);

                          return (
                            <div
                              key={theme}
                              className={`p-3 rounded-xl border text-center transition-all ${
                                unlocked
                                  ? 'bg-cyan-500/10 border-cyan-500/20'
                                  : 'bg-white/[0.02] border-white/5 opacity-40'
                              }`}
                            >
                              <div className="text-lg mb-1">
                                {unlocked ? <Unlock className="w-5 h-5 mx-auto text-cyan-400" /> : <Lock className="w-5 h-5 mx-auto text-white/20" />}
                              </div>
                              <p className={`text-sm font-medium capitalize ${unlocked ? 'text-white/80' : 'text-white/20'}`}>
                                {theme}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Level Roadmap */}
                    <div>
                      <h3 className="text-sm font-mono uppercase tracking-widest text-white/50 mb-3">
                        Level Roadmap
                      </h3>
                      <div className="space-y-1">
                        {XP_LEVELS.map(lvl => {
                          const reached = progress.level >= lvl.level;
                          const isCurrent = progress.level === lvl.level;

                          return (
                            <div
                              key={lvl.level}
                              className={`flex items-center gap-3 p-2 rounded-lg transition-all ${
                                isCurrent ? 'bg-yellow-500/10 border border-yellow-500/20' : ''
                              }`}
                            >
                              <span className={`text-xs font-mono w-6 text-center ${
                                reached ? 'text-yellow-400' : 'text-white/15'
                              }`}>
                                {lvl.level}
                              </span>
                              <span className={`text-sm flex-1 ${
                                reached ? 'text-white/70' : 'text-white/20'
                              }`}>
                                {lvl.title}
                              </span>
                              <span className="text-[10px] font-mono text-white/20">
                                {lvl.xpRequired.toLocaleString()} XP
                              </span>
                              {reached && (
                                <Award className="w-3.5 h-3.5 text-yellow-400/60" />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
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

// ============================================
// ACHIEVEMENT TOAST (for notifications)
// ============================================
interface AchievementToastProps {
  achievementIds: string[];
  onDismiss: () => void;
}

export const AchievementToast: React.FC<AchievementToastProps> = ({ achievementIds, onDismiss }) => {
  useEffect(() => {
    if (achievementIds.length > 0) {
      const timer = setTimeout(onDismiss, 5000);
      return () => clearTimeout(timer);
    }
  }, [achievementIds, onDismiss]);

  if (achievementIds.length === 0) return null;

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[300] flex flex-col gap-2">
      <AnimatePresence>
        {achievementIds.map(id => {
          const achievement = ACHIEVEMENTS.find(a => a.id === id);
          if (!achievement) return null;
          const tier = TIER_COLORS[achievement.tier] || TIER_COLORS.bronze;

          return (
            <motion.div
              key={id}
              initial={{ opacity: 0, y: -30, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.9 }}
              className={`flex items-center gap-3 px-5 py-3 rounded-xl border backdrop-blur-xl ${tier.bg} ${tier.border}`}
              style={{ boxShadow: `0 0 30px ${tier.glow}30` }}
              onClick={onDismiss}
            >
              <span className="text-2xl">{achievement.icon}</span>
              <div>
                <p className="text-xs font-mono uppercase tracking-widest text-white/50">Achievement Unlocked</p>
                <p className={`text-sm font-bold ${tier.text}`}>{achievement.title}</p>
              </div>
              <span className="text-xs font-mono text-yellow-400/60 ml-4">+{achievement.xpReward} XP</span>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

export default GamificationHub;
