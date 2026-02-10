// Global State Management with Zustand
// @ts-nocheck - Zustand types handled at runtime
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { VisualParams, VisualMode, HistoryEntry } from '../types';

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
  activeSection: 'menu' | 'manifesto' | 'archive' | 'credits' | 'gallery' | null;
  setMenuOpen: (open: boolean) => void;
  setHistoryOpen: (open: boolean) => void;
  setAuthModalOpen: (open: boolean) => void;
  setShareModalOpen: (open: boolean) => void;
  setGalleryOpen: (open: boolean) => void;
  setFullscreen: (fullscreen: boolean) => void;
  setActiveSection: (section: UIState['activeSection']) => void;
}

export const useUIStore = create<UIState>((set) => ({
  isMenuOpen: false,
  isHistoryOpen: false,
  isAuthModalOpen: false,
  isShareModalOpen: false,
  isGalleryOpen: false,
  isFullscreen: false,
  activeSection: null,
  setMenuOpen: (isMenuOpen) => set({ isMenuOpen }),
  setHistoryOpen: (isHistoryOpen) => set({ isHistoryOpen }),
  setAuthModalOpen: (isAuthModalOpen) => set({ isAuthModalOpen }),
  setShareModalOpen: (isShareModalOpen) => set({ isShareModalOpen }),
  setGalleryOpen: (isGalleryOpen) => set({ isGalleryOpen }),
  setFullscreen: (isFullscreen) => set({ isFullscreen }),
  setActiveSection: (activeSection) => set({ activeSection }),
}));
