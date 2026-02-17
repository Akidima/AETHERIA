// Community Leaderboard Component
// Privacy-focused, opt-in leaderboards with anonymous display names
import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Crown, Shield, Eye, EyeOff, RefreshCw, ChevronUp, ChevronDown,
  User, Trophy, Flame, BookOpen, Activity, Sparkles, BarChart3
} from 'lucide-react';
import {
  LeaderboardPeriod, LeaderboardCategory, LeaderboardEntry,
  LeaderboardPrivacySettings, LEADERBOARD_AVATARS,
} from '../types';
import { useLeaderboardStore, useGamificationStore, useBreathingStore } from '../store/useStore';

// ============================================
// PROPS
// ============================================
interface CommunityLeaderboardProps {
  isOpen: boolean;
  onClose: () => void;
}

// ============================================
// CONSTANTS
// ============================================
type TabType = 'leaderboard' | 'privacy';

const PERIOD_OPTIONS: { id: LeaderboardPeriod; label: string }[] = [
  { id: 'weekly', label: 'Weekly' },
  { id: 'monthly', label: 'Monthly' },
  { id: 'all-time', label: 'All Time' },
];

const CATEGORY_OPTIONS: { id: LeaderboardCategory; label: string; icon: string }[] = [
  { id: 'xp', label: 'XP', icon: '⚡' },
  { id: 'streak', label: 'Streak', icon: '🔥' },
  { id: 'check-ins', label: 'Check-ins', icon: '📅' },
  { id: 'journal', label: 'Journal', icon: '📖' },
  { id: 'breathing', label: 'Breathing', icon: '🫧' },
  { id: 'visualizations', label: 'Visuals', icon: '🎨' },
];

const CATEGORY_UNITS: Record<LeaderboardCategory, string> = {
  'xp': 'XP',
  'streak': 'days',
  'check-ins': 'check-ins',
  'journal': 'entries',
  'breathing': 'sessions',
  'visualizations': 'visuals',
};

// ============================================
// MAIN COMPONENT
// ============================================
export const CommunityLeaderboard: React.FC<CommunityLeaderboardProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<TabType>('leaderboard');
  const [period, setPeriod] = useState<LeaderboardPeriod>('weekly');
  const [category, setCategory] = useState<LeaderboardCategory>('xp');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Privacy form state
  const [nameInput, setNameInput] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('🌟');

  const {
    privacy, setPrivacy, optIn, optOut,
    getLeaderboard, refreshLeaderboard,
  } = useLeaderboardStore();

  // Sync form with stored privacy settings on open
  useEffect(() => {
    if (isOpen) {
      setNameInput(privacy.displayName || '');
      setSelectedAvatar(privacy.avatarEmoji || '🌟');
      // Load initial leaderboard
      refreshLeaderboard(category, period);
    }
  }, [isOpen]);

  // Refresh when category or period changes
  useEffect(() => {
    if (isOpen) {
      refreshLeaderboard(category, period);
    }
  }, [category, period]);

  const entries = useMemo(
    () => getLeaderboard(category, period),
    [category, period, privacy.optedIn, isRefreshing]
  );

  const handleRefresh = () => {
    setIsRefreshing(true);
    refreshLeaderboard(category, period);
    setTimeout(() => setIsRefreshing(false), 600);
  };

  const handleOptIn = () => {
    const name = nameInput.trim() || 'Anonymous';
    optIn(name);
    setPrivacy({ avatarEmoji: selectedAvatar });
    // Refresh to show user in leaderboard
    setTimeout(() => refreshLeaderboard(category, period), 100);
  };

  const handleOptOut = () => {
    optOut();
    setTimeout(() => refreshLeaderboard(category, period), 100);
  };

  const toggleMetric = (key: keyof LeaderboardPrivacySettings) => {
    if (typeof privacy[key] === 'boolean') {
      setPrivacy({ [key]: !privacy[key] } as Partial<LeaderboardPrivacySettings>);
    }
  };

  // Find current user position
  const userEntry = useMemo(
    () => entries.find(e => e.isCurrentUser),
    [entries]
  );

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'leaderboard', label: 'Leaderboard', icon: <Crown className="w-3.5 h-3.5" /> },
    { id: 'privacy', label: 'Privacy', icon: <Shield className="w-3.5 h-3.5" /> },
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
                <Crown className="w-5 h-5 text-amber-400" />
                <h2 className="font-display text-xl font-bold">Community Leaderboard</h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-white/60 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
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
                {/* ===== LEADERBOARD TAB ===== */}
                {activeTab === 'leaderboard' && (
                  <motion.div
                    key="leaderboard"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-4"
                  >
                    {/* Not opted in banner */}
                    {!privacy.optedIn && (
                      <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl">
                        <div className="flex items-start gap-3">
                          <Shield className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm text-amber-200/80">
                              You are not on the leaderboard. Opt in from the Privacy tab to appear anonymously.
                            </p>
                            <button
                              onClick={() => setActiveTab('privacy')}
                              className="text-xs text-amber-400 hover:text-amber-300 mt-1 underline underline-offset-2"
                            >
                              Go to Privacy Settings
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Period selector */}
                    <div className="flex items-center gap-2">
                      {PERIOD_OPTIONS.map(opt => (
                        <button
                          key={opt.id}
                          onClick={() => setPeriod(opt.id)}
                          className={`px-3 py-1.5 rounded-lg text-xs border transition-colors ${
                            period === opt.id
                              ? 'border-white/30 bg-white/10 text-white'
                              : 'border-white/10 text-white/40 hover:text-white/60'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                      <button
                        onClick={handleRefresh}
                        className="ml-auto p-1.5 rounded-lg border border-white/10 text-white/40 hover:text-white/60 transition-colors"
                        title="Refresh"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                      </button>
                    </div>

                    {/* Category selector */}
                    <div className="flex flex-wrap gap-1.5">
                      {CATEGORY_OPTIONS.map(opt => (
                        <button
                          key={opt.id}
                          onClick={() => setCategory(opt.id)}
                          className={`px-3 py-1.5 rounded-lg text-xs border transition-colors ${
                            category === opt.id
                              ? 'border-white/30 bg-white/10 text-white'
                              : 'border-white/10 text-white/40 hover:text-white/60'
                          }`}
                        >
                          {opt.icon} {opt.label}
                        </button>
                      ))}
                    </div>

                    {/* Current user position (if opted in and not in top visible) */}
                    {userEntry && userEntry.rank > 10 && (
                      <div className="p-3 bg-amber-500/5 border border-amber-500/20 rounded-xl">
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-mono text-white/40 w-6 text-center">
                            #{userEntry.rank}
                          </span>
                          <span className="text-lg">{userEntry.avatarEmoji}</span>
                          <div className="flex-1 min-w-0">
                            <span className="text-sm font-bold text-amber-300 truncate block">
                              {userEntry.displayName} (You)
                            </span>
                          </div>
                          <span className="text-sm font-mono text-white/60">
                            {userEntry.value.toLocaleString()}
                          </span>
                          <span className="text-[10px] font-mono text-white/30">
                            {CATEGORY_UNITS[category]}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Leaderboard entries */}
                    <div className="space-y-1">
                      {entries.length === 0 ? (
                        <div className="text-center py-12">
                          <Crown className="w-8 h-8 mx-auto mb-2 opacity-20" />
                          <p className="text-sm text-white/30">No leaderboard data yet</p>
                          <button
                            onClick={handleRefresh}
                            className="text-xs text-white/40 hover:text-white/60 mt-2 underline underline-offset-2"
                          >
                            Refresh
                          </button>
                        </div>
                      ) : (
                        entries.map((entry) => (
                          <LeaderboardRow
                            key={`${entry.rank}-${entry.displayName}`}
                            entry={entry}
                            category={category}
                          />
                        ))
                      )}
                    </div>
                  </motion.div>
                )}

                {/* ===== PRIVACY TAB ===== */}
                {activeTab === 'privacy' && (
                  <motion.div
                    key="privacy"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-6"
                  >
                    {/* Opt-in toggle */}
                    <div className="p-4 bg-white/5 rounded-xl">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {privacy.optedIn ? (
                            <Eye className="w-4 h-4 text-green-400" />
                          ) : (
                            <EyeOff className="w-4 h-4 text-white/40" />
                          )}
                          <h3 className="text-sm font-bold">
                            {privacy.optedIn ? 'You are on the leaderboard' : 'Join the leaderboard'}
                          </h3>
                        </div>
                        <button
                          onClick={privacy.optedIn ? handleOptOut : handleOptIn}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                            privacy.optedIn
                              ? 'border-red-500/30 text-red-400 hover:bg-red-500/10'
                              : 'border-green-500/30 text-green-400 hover:bg-green-500/10'
                          }`}
                        >
                          {privacy.optedIn ? 'Opt Out' : 'Opt In'}
                        </button>
                      </div>
                      <p className="text-xs text-white/40">
                        {privacy.optedIn
                          ? 'Your anonymous profile appears on leaderboards. No personal data is shared.'
                          : 'Appear on leaderboards with an anonymous display name. Your identity stays private.'}
                      </p>
                    </div>

                    {/* Display Name */}
                    <div>
                      <label className="text-sm font-mono uppercase tracking-widest text-white/50 block mb-2">
                        Display Name
                      </label>
                      <input
                        type="text"
                        value={nameInput}
                        onChange={(e) => setNameInput(e.target.value.slice(0, 20))}
                        placeholder="Anonymous"
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm outline-none focus:border-white/30 transition-colors placeholder:text-white/20"
                      />
                      <p className="text-[10px] text-white/25 mt-1 font-mono">
                        {nameInput.length}/20 characters. This name is shown publicly.
                      </p>
                    </div>

                    {/* Avatar Selection */}
                    <div>
                      <label className="text-sm font-mono uppercase tracking-widest text-white/50 block mb-2">
                        Avatar
                      </label>
                      <div className="grid grid-cols-8 gap-2">
                        {LEADERBOARD_AVATARS.map(emoji => (
                          <button
                            key={emoji}
                            onClick={() => setSelectedAvatar(emoji)}
                            className={`p-2 text-xl rounded-lg border transition-all text-center ${
                              selectedAvatar === emoji
                                ? 'border-white/40 bg-white/10 scale-110'
                                : 'border-white/5 hover:border-white/20 hover:bg-white/5'
                            }`}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Save profile button */}
                    {privacy.optedIn && (
                      <button
                        onClick={() => {
                          const name = nameInput.trim() || 'Anonymous';
                          setPrivacy({ displayName: name, avatarEmoji: selectedAvatar });
                          refreshLeaderboard(category, period);
                        }}
                        className="w-full py-3 bg-white/10 border border-white/10 rounded-xl text-sm font-medium hover:bg-white/15 transition-colors"
                      >
                        Save Profile
                      </button>
                    )}

                    {/* Metric Visibility */}
                    <div>
                      <label className="text-sm font-mono uppercase tracking-widest text-white/50 block mb-3">
                        Visible Metrics
                      </label>
                      <p className="text-xs text-white/30 mb-3">
                        Choose which metrics to include in leaderboards.
                      </p>
                      <div className="space-y-2">
                        {[
                          { key: 'showXP' as const, label: 'XP & Level', icon: '⚡' },
                          { key: 'showStreak' as const, label: 'Streak', icon: '🔥' },
                          { key: 'showCheckIns' as const, label: 'Check-ins', icon: '📅' },
                          { key: 'showJournal' as const, label: 'Journal Entries', icon: '📖' },
                          { key: 'showBreathing' as const, label: 'Breathing Sessions', icon: '🫧' },
                          { key: 'showVisualizations' as const, label: 'Visualizations', icon: '🎨' },
                        ].map(metric => (
                          <button
                            key={metric.key}
                            onClick={() => toggleMetric(metric.key)}
                            className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                              privacy[metric.key]
                                ? 'border-white/15 bg-white/5'
                                : 'border-white/5 opacity-50'
                            }`}
                          >
                            <span className="text-lg">{metric.icon}</span>
                            <span className="text-sm flex-1 text-left">{metric.label}</span>
                            <div className={`w-8 h-4 rounded-full transition-colors relative ${
                              privacy[metric.key] ? 'bg-green-500/40' : 'bg-white/10'
                            }`}>
                              <div className={`absolute top-0.5 w-3 h-3 rounded-full transition-all ${
                                privacy[metric.key]
                                  ? 'right-0.5 bg-green-400'
                                  : 'left-0.5 bg-white/30'
                              }`} />
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Privacy notice */}
                    <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl">
                      <div className="flex items-start gap-3">
                        <Shield className="w-4 h-4 text-white/30 flex-shrink-0 mt-0.5" />
                        <div className="space-y-1">
                          <p className="text-xs text-white/40">
                            Your privacy is important. Leaderboard data is generated locally and never leaves your device. No personal information is collected or shared.
                          </p>
                          <p className="text-xs text-white/25">
                            You can opt out at any time to remove yourself from all leaderboards.
                          </p>
                        </div>
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
// SUB-COMPONENT: Leaderboard Row
// ============================================
const LeaderboardRow: React.FC<{
  entry: LeaderboardEntry;
  category: LeaderboardCategory;
}> = ({ entry, category }) => {
  const rankColors: Record<number, string> = {
    1: 'text-yellow-400',
    2: 'text-gray-300',
    3: 'text-amber-600',
  };

  const rankBg: Record<number, string> = {
    1: 'bg-yellow-500/5 border-yellow-500/20',
    2: 'bg-gray-400/5 border-gray-400/15',
    3: 'bg-amber-600/5 border-amber-600/15',
  };

  const isTop3 = entry.rank <= 3;

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: entry.rank * 0.02 }}
      className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
        entry.isCurrentUser
          ? 'bg-amber-500/10 border-amber-500/25'
          : isTop3
            ? rankBg[entry.rank] || 'border-white/5'
            : 'border-transparent hover:bg-white/[0.02]'
      }`}
    >
      {/* Rank */}
      <span className={`text-sm font-mono w-8 text-center font-bold ${
        entry.isCurrentUser
          ? 'text-amber-400'
          : isTop3
            ? rankColors[entry.rank] || 'text-white/40'
            : 'text-white/30'
      }`}>
        {isTop3 ? ['', '🥇', '🥈', '🥉'][entry.rank] : `#${entry.rank}`}
      </span>

      {/* Avatar */}
      <span className="text-xl">{entry.avatarEmoji}</span>

      {/* Name & Level */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={`text-sm font-medium truncate ${
            entry.isCurrentUser ? 'text-amber-200' : 'text-white/80'
          }`}>
            {entry.displayName}
          </span>
          {entry.isCurrentUser && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full border border-amber-500/30 text-amber-400 font-mono">
              YOU
            </span>
          )}
        </div>
        <span className="text-[10px] font-mono text-white/25">
          Lv. {entry.level}
        </span>
      </div>

      {/* Value */}
      <div className="text-right">
        <span className={`text-sm font-bold ${
          entry.isCurrentUser ? 'text-amber-300' : isTop3 ? 'text-white/90' : 'text-white/60'
        }`}>
          {entry.value.toLocaleString()}
        </span>
        <span className="text-[10px] font-mono text-white/25 block">
          {CATEGORY_UNITS[category]}
        </span>
      </div>
    </motion.div>
  );
};

export default CommunityLeaderboard;
