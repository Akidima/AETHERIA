// AchievementToast - extracted from GamificationHub.tsx for lazy-loading support
// This component is always-rendered so it must be statically imported,
// while GamificationHub can be lazy-loaded separately.
import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ACHIEVEMENTS } from '../types';

const TIER_COLORS: Record<string, { bg: string; border: string; text: string; glow: string }> = {
  bronze: { bg: 'bg-amber-900/20', border: 'border-amber-700/40', text: 'text-amber-500', glow: '#92400E' },
  silver: { bg: 'bg-gray-400/10', border: 'border-gray-400/30', text: 'text-gray-300', glow: '#9CA3AF' },
  gold: { bg: 'bg-yellow-500/15', border: 'border-yellow-500/40', text: 'text-yellow-400', glow: '#EAB308' },
  platinum: { bg: 'bg-cyan-400/10', border: 'border-cyan-400/30', text: 'text-cyan-300', glow: '#22D3EE' },
};

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
