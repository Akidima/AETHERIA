// Global State Management with Zustand
// @ts-nocheck - Zustand types handled at runtime
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { VisualParams, VisualMode, HistoryEntry, JournalEntry, JournalFilter, GamificationProgress, ActiveChallenge, ACHIEVEMENTS, CHALLENGE_POOL, XP_LEVELS, BreathingSession, BreathingTechnique, BreathingPattern, LeaderboardPrivacySettings, LeaderboardEntry, LeaderboardCategory, LeaderboardPeriod, LEADERBOARD_AVATARS } from '../types';

// User type for auth (simplified to avoid dependency issues)
interface User {
  id: string;
  email?: string;
  user_metadata?: {
    name?: string;
    avatar_url?: string;
  };
}

interface Session {
  user: User;
  access_token: string;
}

// ============================================
// AUTH STORE
// ============================================
interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setSession: (session: Session | null) => void;
  setLoading: (loading: boolean) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  isLoading: true,
  setUser: (user) => set({ user }),
  setSession: (session) => set({ session, user: session?.user ?? null }),
  setLoading: (isLoading) => set({ isLoading }),
  clear: () => set({ user: null, session: null }),
}));

// ============================================
// APP SETTINGS STORE
// ============================================
interface SettingsState {
  soundEnabled: boolean;
  visualMode: VisualMode;
  ambientMode: boolean;
  apiProvider: 'groq' | 'openai';
  toggleSound: () => void;
  setVisualMode: (mode: VisualMode) => void;
  toggleAmbientMode: () => void;
  setApiProvider: (provider: 'groq' | 'openai') => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      soundEnabled: false,
      visualMode: 'sphere',
      ambientMode: false,
      apiProvider: 'groq',
      toggleSound: () => set((state) => ({ soundEnabled: !state.soundEnabled })),
      setVisualMode: (mode) => set({ visualMode: mode }),
      toggleAmbientMode: () => set((state) => ({ ambientMode: !state.ambientMode })),
      setApiProvider: (provider) => set({ apiProvider: provider }),
    }),
    {
      name: 'aetheria-settings',
    }
  )
);

// ============================================
// VISUALIZATION STATE STORE
// ============================================
interface VisualizationState {
  params: VisualParams;
  isLoading: boolean;
  error: string | null;
  setParams: (params: VisualParams) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const INITIAL_PARAMS: VisualParams = {
  color: "#ffffff",
  speed: 0.5,
  distort: 0.3,
  phrase: "Waiting for Input",
  explanation: "Share your thoughts to shape the digital matter."
};

export const useVisualizationStore = create<VisualizationState>((set) => ({
  params: INITIAL_PARAMS,
  isLoading: false,
  error: null,
  setParams: (params) => set({ params, error: null }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error, isLoading: false }),
  reset: () => set({ params: INITIAL_PARAMS, error: null }),
}));

// ============================================
// HISTORY STORE (Local + Cloud Sync)
// ============================================
interface HistoryState {
  entries: HistoryEntry[];
  isCloudSynced: boolean;
  addEntry: (input: string, params: VisualParams) => void;
  removeEntry: (id: string) => void;
  clearHistory: () => void;
  setEntries: (entries: HistoryEntry[]) => void;
  setCloudSynced: (synced: boolean) => void;
}

export const useHistoryStore = create<HistoryState>()(
  persist(
    (set, get) => ({
      entries: [],
      isCloudSynced: false,
      addEntry: (input, params) => {
        const entry: HistoryEntry = {
          id: Date.now().toString(),
          input,
          params,
          timestamp: Date.now(),
        };
        set((state) => ({
          entries: [entry, ...state.entries].slice(0, 100),
        }));
      },
      removeEntry: (id) => {
        set((state) => ({
          entries: state.entries.filter((e) => e.id !== id),
        }));
      },
      clearHistory: () => set({ entries: [] }),
      setEntries: (entries) => set({ entries }),
      setCloudSynced: (isCloudSynced) => set({ isCloudSynced }),
    }),
    {
      name: 'aetheria-history',
    }
  )
);

// ============================================
// UI STATE STORE
// ============================================
interface UIState {
  isMenuOpen: boolean;
  isHistoryOpen: boolean;
  isAuthModalOpen: boolean;
  isShareModalOpen: boolean;
  isGalleryOpen: boolean;
  isFullscreen: boolean;
  isJournalOpen: boolean;
  activeSection: 'menu' | 'manifesto' | 'archive' | 'credits' | 'gallery' | null;
  setMenuOpen: (open: boolean) => void;
  setHistoryOpen: (open: boolean) => void;
  setAuthModalOpen: (open: boolean) => void;
  setShareModalOpen: (open: boolean) => void;
  setGalleryOpen: (open: boolean) => void;
  setFullscreen: (fullscreen: boolean) => void;
  setJournalOpen: (open: boolean) => void;
  setActiveSection: (section: UIState['activeSection']) => void;
}

export const useUIStore = create<UIState>((set) => ({
  isMenuOpen: false,
  isHistoryOpen: false,
  isAuthModalOpen: false,
  isShareModalOpen: false,
  isGalleryOpen: false,
  isFullscreen: false,
  isJournalOpen: false,
  activeSection: null,
  setMenuOpen: (isMenuOpen) => set({ isMenuOpen }),
  setHistoryOpen: (isHistoryOpen) => set({ isHistoryOpen }),
  setAuthModalOpen: (isAuthModalOpen) => set({ isAuthModalOpen }),
  setShareModalOpen: (isShareModalOpen) => set({ isShareModalOpen }),
  setGalleryOpen: (isGalleryOpen) => set({ isGalleryOpen }),
  setFullscreen: (isFullscreen) => set({ isFullscreen }),
  setJournalOpen: (isJournalOpen) => set({ isJournalOpen }),
  setActiveSection: (activeSection) => set({ activeSection }),
}));

// ============================================
// JOURNAL STORE (Local + Cloud Sync)
// ============================================
interface JournalState {
  entries: JournalEntry[];
  activeEntryId: string | null;
  filter: JournalFilter;
  customTags: string[];
  addEntry: (entry: JournalEntry) => void;
  updateEntry: (id: string, updates: Partial<JournalEntry>) => void;
  removeEntry: (id: string) => void;
  setActiveEntry: (id: string | null) => void;
  setFilter: (filter: Partial<JournalFilter>) => void;
  resetFilter: () => void;
  addCustomTag: (tag: string) => void;
  removeCustomTag: (tag: string) => void;
  getFilteredEntries: () => JournalEntry[];
}

const DEFAULT_FILTER: JournalFilter = {
  searchQuery: '',
  tags: [],
  dateRange: { start: null, end: null },
  emotions: [],
  sortBy: 'newest',
  hasVisualization: null,
};

export const useJournalStore = create<JournalState>()(
  persist(
    (set, get) => ({
      entries: [],
      activeEntryId: null,
      filter: DEFAULT_FILTER,
      customTags: [],
      addEntry: (entry) => {
        set((state) => ({
          entries: [entry, ...state.entries],
        }));
      },
      updateEntry: (id, updates) => {
        set((state) => ({
          entries: state.entries.map((e) =>
            e.id === id ? { ...e, ...updates, updatedAt: Date.now() } : e
          ),
        }));
      },
      removeEntry: (id) => {
        set((state) => ({
          entries: state.entries.filter((e) => e.id !== id),
          activeEntryId: state.activeEntryId === id ? null : state.activeEntryId,
        }));
      },
      setActiveEntry: (id) => set({ activeEntryId: id }),
      setFilter: (filterUpdates) => {
        set((state) => ({
          filter: { ...state.filter, ...filterUpdates },
        }));
      },
      resetFilter: () => set({ filter: DEFAULT_FILTER }),
      addCustomTag: (tag) => {
        set((state) => ({
          customTags: state.customTags.includes(tag)
            ? state.customTags
            : [...state.customTags, tag],
        }));
      },
      removeCustomTag: (tag) => {
        set((state) => ({
          customTags: state.customTags.filter((t) => t !== tag),
        }));
      },
      getFilteredEntries: () => {
        const { entries, filter } = get();
        let filtered = [...entries];

        // Search query
        if (filter.searchQuery.trim()) {
          const query = filter.searchQuery.toLowerCase();
          filtered = filtered.filter(
            (e) =>
              e.title.toLowerCase().includes(query) ||
              e.plainText.toLowerCase().includes(query) ||
              e.customTags.some((t) => t.toLowerCase().includes(query)) ||
              e.detectedEmotion?.toLowerCase().includes(query)
          );
        }

        // Tags filter
        if (filter.tags.length > 0) {
          filtered = filtered.filter((e) =>
            filter.tags.some((t) => e.tags.includes(t) || e.customTags.includes(t))
          );
        }

        // Date range
        if (filter.dateRange.start) {
          filtered = filtered.filter((e) => e.createdAt >= filter.dateRange.start!);
        }
        if (filter.dateRange.end) {
          filtered = filtered.filter((e) => e.createdAt <= filter.dateRange.end!);
        }

        // Emotions filter
        if (filter.emotions.length > 0) {
          filtered = filtered.filter(
            (e) => e.detectedEmotion && filter.emotions.includes(e.detectedEmotion)
          );
        }

        // Has visualization
        if (filter.hasVisualization === true) {
          filtered = filtered.filter((e) => !!e.linkedVisualization);
        } else if (filter.hasVisualization === false) {
          filtered = filtered.filter((e) => !e.linkedVisualization);
        }

        // Sort
        switch (filter.sortBy) {
          case 'oldest':
            filtered.sort((a, b) => a.createdAt - b.createdAt);
            break;
          case 'mood-high':
            filtered.sort((a, b) => (b.mood || 0) - (a.mood || 0));
            break;
          case 'mood-low':
            filtered.sort((a, b) => (a.mood || 0) - (b.mood || 0));
            break;
          default:
            filtered.sort((a, b) => b.createdAt - a.createdAt);
        }

        return filtered;
      },
    }),
    {
      name: 'aetheria-journal',
    }
  )
);

// ============================================
// GAMIFICATION STORE
// ============================================
const DEFAULT_PROGRESS: GamificationProgress = {
  xp: 0,
  level: 1,
  totalCheckIns: 0,
  totalJournalEntries: 0,
  totalVisualizations: 0,
  totalTemplatesUsed: 0,
  totalChallengesCompleted: 0,
  uniqueEmotionsUsed: [],
  emotionCounts: {},
  currentStreak: 0,
  longestStreak: 0,
  unlockedAchievements: [],
  unlockedVisualizations: ['sphere', 'particles', 'minimal'],
  unlockedThemes: ['dark', 'light'],
  activeChallenges: [],
  completedChallengeIds: [],
  lastCheckInDate: null,
};

function calculateLevel(xp: number): number {
  let level = 1;
  for (const lvl of XP_LEVELS) {
    if (xp >= lvl.xpRequired) {
      level = lvl.level;
    } else {
      break;
    }
  }
  return level;
}

interface GamificationState {
  progress: GamificationProgress;
  newAchievements: string[]; // IDs of recently unlocked achievements (for notifications)
  addXP: (amount: number) => string[]; // returns newly unlocked achievement IDs
  recordCheckIn: (emotions: string[], streak: number) => string[];
  recordJournalEntry: () => string[];
  recordVisualization: () => string[];
  recordTemplateUsed: () => string[];
  refreshChallenges: () => void;
  updateChallengeProgress: (type: string, increment: number) => void;
  clearNewAchievements: () => void;
  getActiveChallenges: () => (ActiveChallenge & { title: string; description: string; icon: string; requirement: { value: number } })[];
}

export const useGamificationStore = create<GamificationState>()(
  persist(
    (set, get) => ({
      progress: DEFAULT_PROGRESS,
      newAchievements: [],

      addXP: (amount: number) => {
        const newAchievements: string[] = [];
        set((state) => {
          const newXP = state.progress.xp + amount;
          const newLevel = calculateLevel(newXP);
          const updatedProgress = { ...state.progress, xp: newXP, level: newLevel };

          // Check level achievements
          ACHIEVEMENTS.filter(a => a.requirement.type === 'level').forEach(a => {
            if (newLevel >= a.requirement.value && !updatedProgress.unlockedAchievements.includes(a.id)) {
              updatedProgress.unlockedAchievements = [...updatedProgress.unlockedAchievements, a.id];
              updatedProgress.xp += a.xpReward;
              newAchievements.push(a.id);
              if (a.unlocksVisualization && !updatedProgress.unlockedVisualizations.includes(a.unlocksVisualization)) {
                updatedProgress.unlockedVisualizations = [...updatedProgress.unlockedVisualizations, a.unlocksVisualization];
              }
              if (a.unlocksTheme && !updatedProgress.unlockedThemes.includes(a.unlocksTheme)) {
                updatedProgress.unlockedThemes = [...updatedProgress.unlockedThemes, a.unlocksTheme];
              }
            }
          });

          updatedProgress.level = calculateLevel(updatedProgress.xp);
          return { progress: updatedProgress, newAchievements: [...state.newAchievements, ...newAchievements] };
        });
        return newAchievements;
      },

      recordCheckIn: (emotions: string[], streak: number) => {
        const newAchievements: string[] = [];
        set((state) => {
          const p = { ...state.progress };
          p.totalCheckIns += 1;
          p.currentStreak = streak;
          p.longestStreak = Math.max(p.longestStreak, streak);
          p.lastCheckInDate = new Date().toISOString().split('T')[0];

          // Track emotions
          emotions.forEach(e => {
            p.emotionCounts = { ...p.emotionCounts, [e]: (p.emotionCounts[e] || 0) + 1 };
            if (!p.uniqueEmotionsUsed.includes(e)) {
              p.uniqueEmotionsUsed = [...p.uniqueEmotionsUsed, e];
            }
          });

          // Check achievements
          ACHIEVEMENTS.forEach(a => {
            if (p.unlockedAchievements.includes(a.id)) return;
            let met = false;
            switch (a.requirement.type) {
              case 'streak': met = p.currentStreak >= a.requirement.value; break;
              case 'checkin_count': met = p.totalCheckIns >= a.requirement.value; break;
              case 'unique_emotions': met = p.uniqueEmotionsUsed.length >= a.requirement.value; break;
              case 'emotion_count':
                if (a.requirement.emotionId) {
                  met = (p.emotionCounts[a.requirement.emotionId] || 0) >= a.requirement.value;
                }
                break;
            }
            if (met) {
              p.unlockedAchievements = [...p.unlockedAchievements, a.id];
              p.xp += a.xpReward;
              newAchievements.push(a.id);
              if (a.unlocksVisualization && !p.unlockedVisualizations.includes(a.unlocksVisualization)) {
                p.unlockedVisualizations = [...p.unlockedVisualizations, a.unlocksVisualization];
              }
              if (a.unlocksTheme && !p.unlockedThemes.includes(a.unlocksTheme)) {
                p.unlockedThemes = [...p.unlockedThemes, a.unlocksTheme];
              }
            }
          });

          // Add base XP for check-in
          p.xp += 20;
          p.level = calculateLevel(p.xp);

          return { progress: p, newAchievements: [...state.newAchievements, ...newAchievements] };
        });

        // Update challenge progress
        get().updateChallengeProgress('checkin', 1);
        get().updateChallengeProgress('unique_emotions', emotions.length);
        get().updateChallengeProgress('streak', streak);

        return newAchievements;
      },

      recordJournalEntry: () => {
        const newAchievements: string[] = [];
        set((state) => {
          const p = { ...state.progress };
          p.totalJournalEntries += 1;
          p.xp += 15;

          ACHIEVEMENTS.filter(a => a.requirement.type === 'journal_count').forEach(a => {
            if (!p.unlockedAchievements.includes(a.id) && p.totalJournalEntries >= a.requirement.value) {
              p.unlockedAchievements = [...p.unlockedAchievements, a.id];
              p.xp += a.xpReward;
              newAchievements.push(a.id);
              if (a.unlocksVisualization && !p.unlockedVisualizations.includes(a.unlocksVisualization)) {
                p.unlockedVisualizations = [...p.unlockedVisualizations, a.unlocksVisualization];
              }
            }
          });

          p.level = calculateLevel(p.xp);
          return { progress: p, newAchievements: [...state.newAchievements, ...newAchievements] };
        });

        get().updateChallengeProgress('journal', 1);
        return newAchievements;
      },

      recordVisualization: () => {
        const newAchievements: string[] = [];
        set((state) => {
          const p = { ...state.progress };
          p.totalVisualizations += 1;
          p.xp += 10;

          ACHIEVEMENTS.filter(a => a.requirement.type === 'visualization_count').forEach(a => {
            if (!p.unlockedAchievements.includes(a.id) && p.totalVisualizations >= a.requirement.value) {
              p.unlockedAchievements = [...p.unlockedAchievements, a.id];
              p.xp += a.xpReward;
              newAchievements.push(a.id);
              if (a.unlocksVisualization && !p.unlockedVisualizations.includes(a.unlocksVisualization)) {
                p.unlockedVisualizations = [...p.unlockedVisualizations, a.unlocksVisualization];
              }
            }
          });

          p.level = calculateLevel(p.xp);
          return { progress: p, newAchievements: [...state.newAchievements, ...newAchievements] };
        });

        get().updateChallengeProgress('visualizations', 1);
        return newAchievements;
      },

      recordTemplateUsed: () => {
        const newAchievements: string[] = [];
        set((state) => {
          const p = { ...state.progress };
          p.totalTemplatesUsed += 1;
          p.xp += 15;

          ACHIEVEMENTS.filter(a => a.requirement.type === 'template_count').forEach(a => {
            if (!p.unlockedAchievements.includes(a.id) && p.totalTemplatesUsed >= a.requirement.value) {
              p.unlockedAchievements = [...p.unlockedAchievements, a.id];
              p.xp += a.xpReward;
              newAchievements.push(a.id);
            }
          });

          p.level = calculateLevel(p.xp);
          return { progress: p, newAchievements: [...state.newAchievements, ...newAchievements] };
        });

        get().updateChallengeProgress('template', 1);
        return newAchievements;
      },

      refreshChallenges: () => {
        set((state) => {
          const now = Date.now();
          const p = { ...state.progress };

          // Remove expired challenges
          p.activeChallenges = p.activeChallenges.filter(c => c.expiresAt > now);

          // Add new daily challenges (if less than 2 active daily)
          const activeDailyIds = p.activeChallenges
            .filter(c => {
              const def = CHALLENGE_POOL.find(d => d.id === c.challengeId);
              return def?.type === 'daily';
            })
            .map(c => c.challengeId);

          if (activeDailyIds.length < 2) {
            const availableDaily = CHALLENGE_POOL.filter(c =>
              c.type === 'daily' && !activeDailyIds.includes(c.id)
            );
            const toAdd = 2 - activeDailyIds.length;
            const shuffled = [...availableDaily].sort(() => Math.random() - 0.5);
            for (let i = 0; i < Math.min(toAdd, shuffled.length); i++) {
              p.activeChallenges.push({
                challengeId: shuffled[i].id,
                startedAt: now,
                expiresAt: now + 24 * 60 * 60 * 1000, // 24 hours
                progress: 0,
              });
            }
          }

          // Add new weekly challenge (if no active weekly)
          const activeWeeklyIds = p.activeChallenges
            .filter(c => {
              const def = CHALLENGE_POOL.find(d => d.id === c.challengeId);
              return def?.type === 'weekly';
            })
            .map(c => c.challengeId);

          if (activeWeeklyIds.length < 1) {
            const availableWeekly = CHALLENGE_POOL.filter(c =>
              c.type === 'weekly' && !activeWeeklyIds.includes(c.id)
            );
            if (availableWeekly.length > 0) {
              const pick = availableWeekly[Math.floor(Math.random() * availableWeekly.length)];
              p.activeChallenges.push({
                challengeId: pick.id,
                startedAt: now,
                expiresAt: now + 7 * 24 * 60 * 60 * 1000, // 7 days
                progress: 0,
              });
            }
          }

          return { progress: p };
        });
      },

      updateChallengeProgress: (type: string, increment: number) => {
        set((state) => {
          const p = { ...state.progress };
          let xpGained = 0;

          p.activeChallenges = p.activeChallenges.map(c => {
            const def = CHALLENGE_POOL.find(d => d.id === c.challengeId);
            if (!def || def.requirement.type !== type) return c;
            if (c.progress >= def.requirement.value) return c; // already completed

            const newProgress = Math.min(c.progress + increment, def.requirement.value);
            if (newProgress >= def.requirement.value && c.progress < def.requirement.value) {
              // Challenge completed
              xpGained += def.xpReward;
              p.totalChallengesCompleted += 1;
              p.completedChallengeIds = [...p.completedChallengeIds, def.id];

              // Check challenge-count achievements
              ACHIEVEMENTS.filter(a => a.requirement.type === 'challenge_count').forEach(a => {
                if (!p.unlockedAchievements.includes(a.id) && p.totalChallengesCompleted >= a.requirement.value) {
                  p.unlockedAchievements = [...p.unlockedAchievements, a.id];
                  xpGained += a.xpReward;
                }
              });
            }
            return { ...c, progress: newProgress };
          });

          if (xpGained > 0) {
            p.xp += xpGained;
            p.level = calculateLevel(p.xp);
          }

          return { progress: p };
        });
      },

      clearNewAchievements: () => set({ newAchievements: [] }),

      getActiveChallenges: () => {
        const { progress } = get();
        const now = Date.now();
        return progress.activeChallenges
          .filter(c => c.expiresAt > now)
          .map(c => {
            const def = CHALLENGE_POOL.find(d => d.id === c.challengeId);
            return {
              ...c,
              title: def?.title || '',
              description: def?.description || '',
              icon: def?.icon || '',
              requirement: { value: def?.requirement.value || 0 },
            };
          });
      },
    }),
    {
      name: 'aetheria-gamification',
    }
  )
);

// ============================================
// BREATHING & GROUNDING STORE
// ============================================
interface BreathingState {
  sessions: BreathingSession[];
  customPatterns: { id: string; name: string; pattern: BreathingPattern }[];
  reminders: { id: string; time: string; enabled: boolean; technique: BreathingTechnique; days: number[] }[];
  totalSessions: number;
  totalMinutes: number;
  addSession: (session: BreathingSession) => void;
  addCustomPattern: (name: string, pattern: BreathingPattern) => void;
  removeCustomPattern: (id: string) => void;
  addReminder: (time: string, technique: BreathingTechnique, days: number[]) => void;
  updateReminder: (id: string, updates: Partial<{ time: string; enabled: boolean; technique: BreathingTechnique; days: number[] }>) => void;
  removeReminder: (id: string) => void;
  getSessionsByDate: (date: string) => BreathingSession[];
  getWeeklyStats: () => { totalSessions: number; totalMinutes: number; techniques: Record<string, number> };
}

export const useBreathingStore = create<BreathingState>()(
  persist(
    (set, get) => ({
      sessions: [],
      customPatterns: [],
      reminders: [],
      totalSessions: 0,
      totalMinutes: 0,

      addSession: (session) => {
        set((state) => ({
          sessions: [session, ...state.sessions].slice(0, 500),
          totalSessions: state.totalSessions + 1,
          totalMinutes: state.totalMinutes + Math.round(session.duration / 60),
        }));
      },

      addCustomPattern: (name, pattern) => {
        set((state) => ({
          customPatterns: [
            ...state.customPatterns,
            { id: Date.now().toString(), name, pattern },
          ],
        }));
      },

      removeCustomPattern: (id) => {
        set((state) => ({
          customPatterns: state.customPatterns.filter(p => p.id !== id),
        }));
      },

      addReminder: (time, technique, days) => {
        set((state) => ({
          reminders: [
            ...state.reminders,
            { id: Date.now().toString(), time, enabled: true, technique, days },
          ],
        }));
      },

      updateReminder: (id, updates) => {
        set((state) => ({
          reminders: state.reminders.map(r => r.id === id ? { ...r, ...updates } : r),
        }));
      },

      removeReminder: (id) => {
        set((state) => ({
          reminders: state.reminders.filter(r => r.id !== id),
        }));
      },

      getSessionsByDate: (date) => {
        return get().sessions.filter(s => s.date === date);
      },

      getWeeklyStats: () => {
        const now = Date.now();
        const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
        const weekSessions = get().sessions.filter(s => s.completedAt >= weekAgo);
        const techniques: Record<string, number> = {};
        weekSessions.forEach(s => {
          techniques[s.techniqueName] = (techniques[s.techniqueName] || 0) + 1;
        });
        return {
          totalSessions: weekSessions.length,
          totalMinutes: weekSessions.reduce((sum, s) => sum + Math.round(s.duration / 60), 0),
          techniques,
        };
      },
    }),
    {
      name: 'aetheria-breathing',
    }
  )
);

// ============================================
// COMMUNITY LEADERBOARD STORE
// ============================================
const DEFAULT_PRIVACY: LeaderboardPrivacySettings = {
  optedIn: false,
  displayName: '',
  avatarEmoji: LEADERBOARD_AVATARS[Math.floor(Math.random() * LEADERBOARD_AVATARS.length)],
  showStreak: true,
  showXP: true,
  showCheckIns: true,
  showJournal: false,
  showBreathing: true,
  showVisualizations: true,
};

interface LeaderboardState {
  privacy: LeaderboardPrivacySettings;
  cachedLeaderboards: Record<string, { entries: LeaderboardEntry[]; fetchedAt: number }>;
  setPrivacy: (updates: Partial<LeaderboardPrivacySettings>) => void;
  optIn: (displayName: string) => void;
  optOut: () => void;
  getLeaderboard: (category: LeaderboardCategory, period: LeaderboardPeriod) => LeaderboardEntry[];
  refreshLeaderboard: (category: LeaderboardCategory, period: LeaderboardPeriod) => void;
}

// Generate simulated leaderboard data (in production, this would come from Supabase)
function generateLeaderboard(
  category: LeaderboardCategory,
  period: LeaderboardPeriod,
  privacy: LeaderboardPrivacySettings,
  gamification: GamificationProgress,
  breathingTotal: number
): LeaderboardEntry[] {
  const names = [
    'Cosmic Drifter', 'Zen Wanderer', 'Dream Weaver', 'Star Chaser', 'Moon Child',
    'Cloud Walker', 'Ocean Heart', 'Flame Keeper', 'Dawn Seeker', 'Night Bloom',
    'Soul Painter', 'Light Dancer', 'Storm Caller', 'Frost Weaver', 'Ember Spirit',
    'Wind Singer', 'Tide Turner', 'Echo Walker', 'Shadow Bloom', 'Crystal Mind',
  ];
  const emojis = LEADERBOARD_AVATARS;

  // Generate base values depending on category
  const getBaseValue = (rank: number): number => {
    const multiplier = period === 'all-time' ? 10 : period === 'monthly' ? 4 : 1;
    switch (category) {
      case 'xp': return Math.max(100, Math.floor((2000 - rank * 80) * multiplier * (0.8 + Math.random() * 0.4)));
      case 'streak': return Math.max(1, Math.floor((30 - rank * 1.2) * (0.7 + Math.random() * 0.6)));
      case 'check-ins': return Math.max(1, Math.floor((50 - rank * 2) * multiplier * (0.8 + Math.random() * 0.4)));
      case 'journal': return Math.max(0, Math.floor((30 - rank * 1.5) * multiplier * (0.7 + Math.random() * 0.6)));
      case 'breathing': return Math.max(0, Math.floor((40 - rank * 1.8) * multiplier * (0.7 + Math.random() * 0.6)));
      case 'visualizations': return Math.max(1, Math.floor((60 - rank * 2.5) * multiplier * (0.8 + Math.random() * 0.4)));
      default: return 0;
    }
  };

  // Get the user's actual value for this category
  const getUserValue = (): number => {
    switch (category) {
      case 'xp': return gamification.xp;
      case 'streak': return gamification.currentStreak;
      case 'check-ins': return gamification.totalCheckIns;
      case 'journal': return gamification.totalJournalEntries;
      case 'breathing': return breathingTotal;
      case 'visualizations': return gamification.totalVisualizations;
      default: return 0;
    }
  };

  const entries: LeaderboardEntry[] = [];
  for (let i = 0; i < 20; i++) {
    entries.push({
      rank: i + 1,
      displayName: names[i % names.length],
      avatarEmoji: emojis[i % emojis.length],
      value: getBaseValue(i),
      level: Math.max(1, Math.floor(10 - i * 0.4 + Math.random() * 2)),
      isCurrentUser: false,
    });
  }

  // Sort by value descending
  entries.sort((a, b) => b.value - a.value);

  // Insert user if opted in
  if (privacy.optedIn) {
    const userValue = getUserValue();
    const userEntry: LeaderboardEntry = {
      rank: 0,
      displayName: privacy.displayName || 'Anonymous',
      avatarEmoji: privacy.avatarEmoji,
      value: userValue,
      level: gamification.level,
      isCurrentUser: true,
    };

    entries.push(userEntry);
    entries.sort((a, b) => b.value - a.value);
  }

  // Assign ranks
  entries.forEach((e, i) => { e.rank = i + 1; });

  return entries.slice(0, 25);
}

export const useLeaderboardStore = create<LeaderboardState>()(
  persist(
    (set, get) => ({
      privacy: DEFAULT_PRIVACY,
      cachedLeaderboards: {},

      setPrivacy: (updates) => {
        set((state) => ({
          privacy: { ...state.privacy, ...updates },
        }));
      },

      optIn: (displayName) => {
        set((state) => ({
          privacy: { ...state.privacy, optedIn: true, displayName },
        }));
      },

      optOut: () => {
        set((state) => ({
          privacy: { ...state.privacy, optedIn: false },
        }));
      },

      getLeaderboard: (category, period) => {
        const key = `${category}-${period}`;
        const cached = get().cachedLeaderboards[key];
        if (cached && Date.now() - cached.fetchedAt < 60000) {
          return cached.entries;
        }
        return [];
      },

      refreshLeaderboard: (category, period) => {
        const key = `${category}-${period}`;
        const { privacy } = get();
        // Get gamification data from the gamification store
        const gamification = useGamificationStore.getState().progress;
        const breathingTotal = useBreathingStore.getState().totalSessions;

        const entries = generateLeaderboard(category, period, privacy, gamification, breathingTotal);

        set((state) => ({
          cachedLeaderboards: {
            ...state.cachedLeaderboards,
            [key]: { entries, fetchedAt: Date.now() },
          },
        }));
      },
    }),
    {
      name: 'aetheria-leaderboard',
      partialize: (state) => ({ privacy: state.privacy }),
    }
  )
);
