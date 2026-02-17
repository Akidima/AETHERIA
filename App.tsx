import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Loader2, X, Mic, MicOff, Download, Share2, Maximize, History, Sparkles, LogIn, Grid, Settings, Wind, Clock, Sliders, Calendar, BarChart3, Users, Bookmark, Video, Code, Heart, Music, Accessibility, HelpCircle, Smartphone, Radio, BookOpen, Trophy, Waves, Crown } from 'lucide-react';
import { CustomCursor } from './components/CustomCursor';
import { Scene } from './components/Scene';
import { Navigation } from './components/Navigation';
import { Footer } from './components/Footer';
import { SettingsPanel } from './components/SettingsPanel';
import { Meditation } from './components/Meditation';
import { EmotionTimeline } from './components/EmotionTimeline';
import { ManualControls } from './components/ManualControls';
import { DailyCheckIn, useCheckIns } from './components/DailyCheckIn';
import { EmotionInsights } from './components/EmotionInsights';
import { CustomPresets } from './components/CustomPresets';
import { Collections } from './components/Collections';
import { FollowSystem } from './components/FollowSystem';
import { VideoExport } from './components/VideoExport';
import { EmbedGenerator } from './components/EmbedGenerator';
import { Affirmations } from './components/Affirmations';
import { OnboardingTour, useOnboarding } from './components/OnboardingTour';
import { MusicReactive } from './components/MusicReactive';
import { AccessibilitySettings } from './components/AccessibilitySettings';
import { ARMode } from './components/ARMode';
import { CollabRoom } from './components/CollabRoom';
import { Journal } from './components/Journal';
import { GamificationHub, AchievementToast } from './components/GamificationHub';
import { BreathingExercises } from './components/BreathingExercises';
import { CommunityLeaderboard } from './components/CommunityLeaderboard';
import { interpretSentiment } from './services/aiService';
import { audioService } from './services/audioService';
import { VisualParams, AppState, VisualMode, CustomPreset, AccessibilitySettings as A11ySettings } from './types';
import { useAuthStore, useGamificationStore } from './store/useStore';
import {
  useHistory,
  useSettings,
  useKeyboardShortcuts,
  useFullscreen,
  useAmbientMode,
  useVoiceInput,
  useScreenshot,
} from './hooks/useAppFeatures';

// Lazy load auth components to prevent blank page if Supabase isn't configured
const AuthModal = React.lazy(() => import('./components/AuthModal').then(m => ({ default: m.AuthModal })));
const ShareModal = React.lazy(() => import('./components/ShareModal').then(m => ({ default: m.ShareModal })));
const Gallery = React.lazy(() => import('./components/Gallery').then(m => ({ default: m.Gallery })));
const UserMenu = React.lazy(() => import('./components/UserMenu').then(m => ({ default: m.UserMenu })));

// Default initial state
const INITIAL_PARAMS: VisualParams = {
  color: "#ffffff",
  speed: 0.5,
  distort: 0.3,
  phrase: "Waiting for Input",
  explanation: "Share your thoughts to shape the digital matter.",
  advice: "Express yourself freely. Your emotions are valid and worth exploring."
};

const App: React.FC = () => {
  const [input, setInput] = useState('');
  const [params, setParams] = useState<VisualParams>(INITIAL_PARAMS);
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [showHistory, setShowHistory] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auth state from store
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  
  // UI state
  const [isAuthModalOpen, setAuthModalOpen] = useState(false);
  const [isShareModalOpen, setShareModalOpen] = useState(false);
  const [isGalleryOpen, setGalleryOpen] = useState(false);
  const [isSettingsOpen, setSettingsOpen] = useState(false);
  const [isMeditationOpen, setMeditationOpen] = useState(false);
  const [isTimelineOpen, setTimelineOpen] = useState(false);
  
  // New feature modals
  const [isManualControlsOpen, setManualControlsOpen] = useState(false);
  const [isCheckInOpen, setCheckInOpen] = useState(false);
  const [isInsightsOpen, setInsightsOpen] = useState(false);
  const [isPresetsOpen, setPresetsOpen] = useState(false);
  const [isCollectionsOpen, setCollectionsOpen] = useState(false);
  const [isFollowSystemOpen, setFollowSystemOpen] = useState(false);
  const [isVideoExportOpen, setVideoExportOpen] = useState(false);
  const [isEmbedOpen, setEmbedOpen] = useState(false);
  const [isAffirmationsOpen, setAffirmationsOpen] = useState(false);
  const [isMusicReactiveOpen, setMusicReactiveOpen] = useState(false);
  const [isAccessibilityOpen, setAccessibilityOpen] = useState(false);
  const [isARModeOpen, setARModeOpen] = useState(false);
  const [isCollabRoomOpen, setCollabRoomOpen] = useState(false);
  const [isJournalOpen, setJournalOpen] = useState(false);
  const [isGamificationOpen, setGamificationOpen] = useState(false);
  const [isBreathingOpen, setBreathingOpen] = useState(false);
  const [isLeaderboardOpen, setLeaderboardOpen] = useState(false);
  
  // Accessibility settings
  const [a11ySettings, setA11ySettings] = useState<A11ySettings>({
    reducedMotion: false,
    highContrast: false,
    screenReaderMode: false,
    fontSize: 'medium',
  });

  // Custom hooks
  const { history, addEntry, clearHistory } = useHistory();
  const { settings, updateSettings } = useSettings();
  const { checkIns, streak, todayCompleted, addCheckIn } = useCheckIns();
  const { showOnboarding, completeOnboarding } = useOnboarding();

  // Gamification
  const {
    recordVisualization,
    recordCheckIn,
    refreshChallenges,
    newAchievements,
    clearNewAchievements,
  } = useGamificationStore();

  // Refresh challenges on mount
  useEffect(() => {
    refreshChallenges();
  }, [refreshChallenges]);

  // Listen for auth state changes (lazy load supabase)
  useEffect(() => {
    let subscription: { unsubscribe: () => void } | null = null;

    const initAuth = async () => {
      try {
        const { supabase, isSupabaseConfigured } = await import('./lib/supabase');
        if (!isSupabaseConfigured) {
          console.log('Supabase not configured, skipping auth');
          return;
        }

        // Get initial session
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser({ 
            id: session.user.id, 
            email: session.user.email,
            user_metadata: session.user.user_metadata || {}
          });
        }

        // Listen for changes
        const { data } = supabase.auth.onAuthStateChange((_event, session) => {
          if (session?.user) {
            setUser({ 
              id: session.user.id, 
              email: session.user.email,
              user_metadata: session.user.user_metadata || {}
            });
          } else {
            setUser(null);
          }
        });
        subscription = data.subscription;
      } catch (error) {
        console.warn('Auth initialization failed:', error);
      }
    };

    initAuth();

    return () => {
      subscription?.unsubscribe();
    };
  }, []);
  const { isFullscreen, toggleFullscreen } = useFullscreen();
  const { capture, download, share } = useScreenshot();

  // Voice input
  const handleVoiceResult = useCallback((text: string) => {
    setInput(text);
    // Auto-submit after voice input
    setTimeout(() => {
      inputRef.current?.form?.requestSubmit();
    }, 100);
  }, []);
  
  const { isListening, isSupported: voiceSupported, startListening, stopListening } = useVoiceInput(handleVoiceResult);

  // Sound toggle
  const toggleSound = useCallback(() => {
    const newState = !settings.soundEnabled;
    updateSettings({ soundEnabled: newState });
    
    if (newState) {
      audioService.init();
      audioService.start(params.color, params.speed, params.distort);
    } else {
      audioService.setMuted(true);
    }
  }, [settings.soundEnabled, updateSettings, params]);

  // Reset to initial state
  const handleReset = useCallback(() => {
    setParams(INITIAL_PARAMS);
    setInput('');
    updateSettings({ ambientMode: false });
    inputRef.current?.focus();
  }, [updateSettings]);

  // Ambient mode handler
  const handleAmbientParams = useCallback((newParams: VisualParams) => {
    setParams(newParams);
  }, []);

  useAmbientMode(settings.ambientMode, handleAmbientParams);

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onToggleSound: toggleSound,
    onToggleFullscreen: toggleFullscreen,
    onReset: handleReset,
    onSubmit: () => inputRef.current?.form?.requestSubmit(),
    onScreenshot: () => download(`aetheria-${Date.now()}.png`),
    isInputFocused: document.activeElement === inputRef.current,
  });

  // Update audio when params change
  useEffect(() => {
    if (settings.soundEnabled) {
      audioService.update(params.color, params.speed, params.distort);
    }
  }, [params, settings.soundEnabled]);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => audioService.destroy();
  }, []);

  // Handle form submission with emotion blending support
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || appState === AppState.THINKING) return;

    const currentInput = input;
    setInput('');
    setAppState(AppState.THINKING);
    
    // Disable ambient mode when user submits
    if (settings.ambientMode) {
      updateSettings({ ambientMode: false });
    }
    
    try {
      // Check for emotion blending (multiple emotions with +)
      const emotions = currentInput.split('+').map(e => e.trim()).filter(Boolean);
      
      let result: VisualParams;
      
      if (emotions.length > 1) {
        // Blend multiple emotions
        const results = await Promise.all(emotions.map(e => interpretSentiment(e)));
        result = blendParams(results);
        result.phrase = results.map(r => r.phrase.split(' ')[0]).join(' × ');
        result.explanation = `A fusion of ${emotions.join(' and ')}.`;
        // Use the first emotion's advice or create a blended one
        result.advice = results[0].advice || 'Multiple emotions create unique experiences. Honor each feeling.';
      } else {
        result = await interpretSentiment(currentInput);
      }
      
      // Ensure all required fields are present
      if (!result.phrase || !result.explanation) {
        console.error('Invalid response from AI:', result);
        throw new Error('Invalid response format');
      }
      
      console.log('AI Response:', result);
      setParams(result);
      addEntry(currentInput, result);
      recordVisualization();
      setAppState(AppState.IDLE);
      
      // Start/update audio
      if (settings.soundEnabled) {
        audioService.start(result.color, result.speed, result.distort);
      }
    } catch (error) {
      console.error('Interpretation error:', error);
      setAppState(AppState.ERROR);
      
      // Show error state with helpful message
      setParams({
        color: "#cc3333",
        speed: 1.2,
        distort: 0.8,
        phrase: "Connection Lost",
        explanation: "Unable to interpret your emotion right now.",
        advice: "Please check your internet connection and API key configuration, then try again."
      });
      
      // Reset to idle after showing error
      setTimeout(() => {
        setAppState(AppState.IDLE);
      }, 3000);
    }
    
    inputRef.current?.focus();
  };

  // Blend multiple visual params
  const blendParams = (results: VisualParams[]): VisualParams => {
    const avgSpeed = results.reduce((sum, r) => sum + r.speed, 0) / results.length;
    const avgDistort = results.reduce((sum, r) => sum + r.distort, 0) / results.length;
    
    // Blend colors (simple average)
    const colors = results.map(r => {
      const hex = r.color.replace('#', '');
      return {
        r: parseInt(hex.slice(0, 2), 16),
        g: parseInt(hex.slice(2, 4), 16),
        b: parseInt(hex.slice(4, 6), 16),
      };
    });
    
    const avgColor = {
      r: Math.round(colors.reduce((sum, c) => sum + c.r, 0) / colors.length),
      g: Math.round(colors.reduce((sum, c) => sum + c.g, 0) / colors.length),
      b: Math.round(colors.reduce((sum, c) => sum + c.b, 0) / colors.length),
    };
    
    const blendedColor = `#${avgColor.r.toString(16).padStart(2, '0')}${avgColor.g.toString(16).padStart(2, '0')}${avgColor.b.toString(16).padStart(2, '0')}`;
    
    return {
      color: blendedColor,
      speed: avgSpeed,
      distort: avgDistort,
      phrase: '',
      explanation: '',
    };
  };

  // Load from history
  const loadFromHistory = (entry: { params: VisualParams }) => {
    setParams(entry.params);
    setShowHistory(false);
    if (settings.soundEnabled) {
      audioService.start(entry.params.color, entry.params.speed, entry.params.distort);
    }
  };

  // Toggle ambient mode
  const toggleAmbientMode = () => {
    updateSettings({ ambientMode: !settings.ambientMode });
  };

  // Handle share - open modal for cloud sharing or fallback to native share
  const handleShare = () => {
    if (params.phrase !== "Waiting for Input") {
      setShareModalOpen(true);
    } else {
      share(params.phrase, `${params.phrase} - ${params.explanation}`);
    }
  };

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-[var(--theme-background)] text-[var(--theme-text-primary)] selection:bg-[var(--theme-text-primary)] selection:text-[var(--theme-background)]">
      <CustomCursor />
      
      {/* Auth/User Section - Top Right */}
      <div className="fixed top-8 right-8 md:right-12 z-[110] flex items-center gap-4">
        {user ? (
          <React.Suspense fallback={<div className="w-10 h-10 rounded-full bg-white/10 animate-pulse" />}>
            <UserMenu 
              onOpenHistory={() => setShowHistory(true)}
            />
          </React.Suspense>
        ) : (
          <motion.button
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            onClick={() => setAuthModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 hover:border-white/30 bg-black/50 backdrop-blur-sm transition-colors text-sm font-mono"
          >
            <LogIn className="w-4 h-4" />
            <span className="hidden sm:inline">Sign In</span>
          </motion.button>
        )}
      </div>

      <Navigation 
        onLoadParams={(p) => {
          setParams(p);
          if (settings.soundEnabled) {
            audioService.start(p.color, p.speed, p.distort);
          }
        }}
        onOpenJournal={() => setJournalOpen(true)}
        onOpenGamification={() => setGamificationOpen(true)}
      />
      
      {/* 3D Background */}
      <Scene params={params} visualMode={settings.visualMode} />

      {/* Control Panel - Top Right */}
      <div className="fixed top-24 right-6 md:right-12 z-50 flex flex-col gap-2">
        <motion.button
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 1 }}
          onClick={() => setShowControls(!showControls)}
          className="p-2 rounded-full border border-white/10 hover:border-white/30 bg-black/50 backdrop-blur-sm transition-colors"
          title="Toggle Controls"
        >
          <Sparkles className="w-4 h-4" />
        </motion.button>
        
        <AnimatePresence>
          {showControls && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -10 }}
              className="flex flex-col gap-2 max-h-[calc(100vh-120px)] overflow-y-auto"
            >
              {/* Fullscreen */}
              <button
                onClick={toggleFullscreen}
                className="p-2 rounded-full border border-white/10 hover:border-white/30 bg-black/50 backdrop-blur-sm transition-colors"
                title="Fullscreen [F]"
              >
                <Maximize className="w-4 h-4" />
              </button>

              {/* Download Screenshot */}
              <button
                onClick={() => download(`aetheria-${Date.now()}.png`)}
                className="p-2 rounded-full border border-white/10 hover:border-white/30 bg-black/50 backdrop-blur-sm transition-colors"
                title="Download Screenshot [S]"
              >
                <Download className="w-4 h-4" />
              </button>

              {/* Share */}
              <button
                onClick={handleShare}
                className="p-2 rounded-full border border-white/10 hover:border-white/30 bg-black/50 backdrop-blur-sm transition-colors"
                title="Share"
              >
                <Share2 className="w-4 h-4" />
              </button>

              {/* History */}
              <button
                onClick={() => setShowHistory(!showHistory)}
                className={`p-2 rounded-full border transition-colors bg-black/50 backdrop-blur-sm ${showHistory ? 'border-white/50' : 'border-white/10 hover:border-white/30'}`}
                title="History"
              >
                <History className="w-4 h-4" />
              </button>

              {/* Ambient Mode */}
              <button
                onClick={toggleAmbientMode}
                className={`p-2 rounded-full border transition-colors bg-black/50 backdrop-blur-sm ${settings.ambientMode ? 'border-purple-500 text-purple-400' : 'border-white/10 hover:border-white/30'}`}
                title="Ambient Mode"
              >
                <Sparkles className="w-4 h-4" />
              </button>

              {/* Gallery */}
              <button
                onClick={() => setGalleryOpen(true)}
                className="p-2 rounded-full border border-white/10 hover:border-white/30 bg-black/50 backdrop-blur-sm transition-colors"
                title="Community Gallery"
              >
                <Grid className="w-4 h-4" />
              </button>

              {/* Timeline */}
              <button
                onClick={() => setTimelineOpen(true)}
                className="p-2 rounded-full border border-white/10 hover:border-white/30 bg-black/50 backdrop-blur-sm transition-colors"
                title="Emotion Timeline"
              >
                <Clock className="w-4 h-4" />
              </button>

              {/* Meditation */}
              <button
                onClick={() => setMeditationOpen(true)}
                className="p-2 rounded-full border border-white/10 hover:border-white/30 bg-black/50 backdrop-blur-sm transition-colors"
                title="Guided Meditation"
              >
                <Wind className="w-4 h-4" />
              </button>

              {/* Breathing Exercises */}
              <button
                onClick={() => setBreathingOpen(true)}
                className="p-2 rounded-full border border-white/10 hover:border-white/30 bg-black/50 backdrop-blur-sm transition-colors"
                title="Breathing & Grounding"
              >
                <Waves className="w-4 h-4" />
              </button>

              {/* Settings */}
              <button
                onClick={() => setSettingsOpen(true)}
                className="p-2 rounded-full border border-white/10 hover:border-white/30 bg-black/50 backdrop-blur-sm transition-colors"
                title="Settings"
              >
                <Settings className="w-4 h-4" />
              </button>

              {/* Manual Controls */}
              <button
                onClick={() => setManualControlsOpen(true)}
                className="p-2 rounded-full border border-white/10 hover:border-white/30 bg-black/50 backdrop-blur-sm transition-colors"
                title="Manual Controls"
                data-tour="controls"
              >
                <Sliders className="w-4 h-4" />
              </button>

              {/* Daily Check-in */}
              <button
                onClick={() => setCheckInOpen(true)}
                className={`p-2 rounded-full border transition-colors bg-black/50 backdrop-blur-sm ${
                  !todayCompleted ? 'border-orange-500/50 text-orange-400' : 'border-white/10 hover:border-white/30'
                }`}
                title={todayCompleted ? 'Daily Check-in Complete' : 'Daily Check-in'}
              >
                <Calendar className="w-4 h-4" />
              </button>

              {/* Insights */}
              <button
                onClick={() => setInsightsOpen(true)}
                className="p-2 rounded-full border border-white/10 hover:border-white/30 bg-black/50 backdrop-blur-sm transition-colors"
                title="Emotion Insights"
              >
                <BarChart3 className="w-4 h-4" />
              </button>

              {/* Presets */}
              <button
                onClick={() => setPresetsOpen(true)}
                className="p-2 rounded-full border border-white/10 hover:border-white/30 bg-black/50 backdrop-blur-sm transition-colors"
                title="Custom Presets"
              >
                <Bookmark className="w-4 h-4" />
              </button>

              {/* Video Export */}
              <button
                onClick={() => setVideoExportOpen(true)}
                className="p-2 rounded-full border border-white/10 hover:border-white/30 bg-black/50 backdrop-blur-sm transition-colors"
                title="Export Video"
              >
                <Video className="w-4 h-4" />
              </button>

              {/* Music Reactive */}
              <button
                onClick={() => setMusicReactiveOpen(true)}
                className="p-2 rounded-full border border-white/10 hover:border-white/30 bg-black/50 backdrop-blur-sm transition-colors"
                title="Music Reactive"
              >
                <Music className="w-4 h-4" />
              </button>

              {/* Affirmations */}
              <button
                onClick={() => setAffirmationsOpen(true)}
                className="p-2 rounded-full border border-white/10 hover:border-white/30 bg-black/50 backdrop-blur-sm transition-colors"
                title="Affirmations"
              >
                <Heart className="w-4 h-4" />
              </button>

              {/* Community */}
              <button
                onClick={() => setFollowSystemOpen(true)}
                className="p-2 rounded-full border border-white/10 hover:border-white/30 bg-black/50 backdrop-blur-sm transition-colors"
                title="Community"
              >
                <Users className="w-4 h-4" />
              </button>

              {/* Accessibility */}
              <button
                onClick={() => setAccessibilityOpen(true)}
                className="p-2 rounded-full border border-white/10 hover:border-white/30 bg-black/50 backdrop-blur-sm transition-colors"
                title="Accessibility"
              >
                <Accessibility className="w-4 h-4" />
              </button>

              {/* AR Mode */}
              <button
                onClick={() => setARModeOpen(true)}
                className="p-2 rounded-full border border-white/10 hover:border-white/30 bg-black/50 backdrop-blur-sm transition-colors"
                title="AR Mode"
              >
                <Smartphone className="w-4 h-4" />
              </button>

              {/* Collab Room */}
              <button
                onClick={() => setCollabRoomOpen(true)}
                className="p-2 rounded-full border border-white/10 hover:border-white/30 bg-black/50 backdrop-blur-sm transition-colors"
                title="Collab Rooms"
              >
                <Radio className="w-4 h-4" />
              </button>

              {/* Journal */}
              <button
                onClick={() => setJournalOpen(true)}
                className="p-2 rounded-full border border-white/10 hover:border-white/30 bg-black/50 backdrop-blur-sm transition-colors"
                title="Journal"
              >
                <BookOpen className="w-4 h-4" />
              </button>

              {/* Gamification Hub */}
              <button
                onClick={() => setGamificationOpen(true)}
                className="p-2 rounded-full border border-white/10 hover:border-yellow-500/40 bg-black/50 backdrop-blur-sm transition-colors"
                title="Achievements & Progress"
              >
                <Trophy className="w-4 h-4" />
              </button>

              {/* Community Leaderboard */}
              <button
                onClick={() => setLeaderboardOpen(true)}
                className="p-2 rounded-full border border-white/10 hover:border-amber-500/40 bg-black/50 backdrop-blur-sm transition-colors"
                title="Community Leaderboard"
              >
                <Crown className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* History Panel */}
      <AnimatePresence>
        {showHistory && (
          <motion.div
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            className="fixed top-24 right-20 w-72 max-h-[60vh] bg-black/90 backdrop-blur-xl border border-white/10 rounded-lg overflow-hidden z-50"
          >
            <div className="p-4 border-b border-white/10 flex justify-between items-center">
              <h3 className="font-mono text-xs uppercase tracking-widest text-white/60">History</h3>
              {history.length > 0 && (
                <button onClick={clearHistory} className="text-xs text-white/40 hover:text-white">Clear</button>
              )}
            </div>
            <div className="overflow-y-auto max-h-[calc(60vh-60px)]">
              {history.length === 0 ? (
                <p className="p-4 text-sm text-white/40 text-center">No history yet</p>
              ) : (
                history.map((entry) => (
                  <button
                    key={entry.id}
                    onClick={() => loadFromHistory(entry)}
                    className="w-full p-4 text-left border-b border-white/5 hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-4 h-4 rounded-full flex-shrink-0"
                        style={{ backgroundColor: entry.params.color }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-display text-sm font-bold truncate">{entry.params.phrase}</p>
                        <p className="text-xs text-white/40 truncate">{entry.input}</p>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Ambient Mode Indicator */}
      <AnimatePresence>
        {settings.ambientMode && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-50"
          >
            <div className="px-4 py-2 bg-purple-500/20 border border-purple-500/50 rounded-full backdrop-blur-sm">
              <span className="font-mono text-xs uppercase tracking-widest text-purple-300">
                Ambient Mode Active
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Center Interaction Layer */}
      <section className="absolute inset-0 flex flex-col justify-center items-center z-10 px-4">
        <div className="max-w-4xl w-full text-center mix-blend-exclusion">
          
          {/* Dynamic Phrase Heading */}
          <div className="h-32 md:h-48 flex items-center justify-center overflow-visible mb-8">
             <AnimatePresence mode="wait">
               {appState === AppState.THINKING ? (
                 <motion.div
                   key="thinking"
                   initial={{ opacity: 0, scale: 0.9 }}
                   animate={{ opacity: 1, scale: 1 }}
                   exit={{ opacity: 0, scale: 0.9 }}
                   className="flex flex-col items-center gap-4"
                 >
                   <Loader2 className="w-12 h-12 animate-spin text-white/40" />
                   <h1 className="font-display text-3xl md:text-5xl font-bold uppercase tracking-tighter text-white/60">
                     Interpreting...
                   </h1>
                 </motion.div>
               ) : (
                 <motion.h1 
                    key={params.phrase}
                    initial={{ opacity: 0, y: 100, rotate: 5 }}
                    animate={{ opacity: 1, y: 0, rotate: 0 }}
                    exit={{ opacity: 0, y: -100, rotate: -5 }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    className="font-display text-5xl md:text-8xl lg:text-9xl font-bold uppercase tracking-tighter leading-none"
                 >
                   {params.phrase}
                 </motion.h1>
               )}
             </AnimatePresence>
          </div>

          {/* Explanation Text */}
          <div className="h-16 flex items-center justify-center mb-4">
            <AnimatePresence mode="wait">
              <motion.p 
                key={params.explanation}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="text-sm md:text-base font-mono opacity-60 max-w-lg"
              >
                {params.explanation}
              </motion.p>
            </AnimatePresence>
          </div>

          {/* AI Advice Section */}
          <AnimatePresence mode="wait">
            {params.advice && params.phrase !== "Waiting for Input" && (
              <motion.div
                key={params.advice}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="mb-8 max-w-xl mx-auto"
              >
                <div className="relative p-4 md:p-6 bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10">
                  {/* Decorative glow */}
                  <div 
                    className="absolute inset-0 rounded-2xl opacity-20 blur-xl"
                    style={{ background: `radial-gradient(circle at center, ${params.color} 0%, transparent 70%)` }}
                  />
                  
                  <div className="relative">
                    <div className="flex items-center gap-2 mb-3">
                      <div 
                        className="w-2 h-2 rounded-full animate-pulse"
                        style={{ backgroundColor: params.color }}
                      />
                      <span className="text-xs font-mono uppercase tracking-widest opacity-50">
                        Personalized Insight
                      </span>
                    </div>
                    <p className="text-sm md:text-base leading-relaxed opacity-80">
                      {params.advice}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Input Form */}
          <motion.form 
            onSubmit={handleSubmit}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="relative w-full max-w-md mx-auto group"
          >
             <div className="absolute inset-0 bg-white/5 blur-xl rounded-full transform group-hover:scale-110 transition-transform duration-700" />
             <div className="relative flex items-center border-b border-white/20 hover:border-white/60 transition-colors pb-4">
               {/* Voice Input Button */}
               {voiceSupported && (
                 <button
                   type="button"
                   onClick={isListening ? stopListening : startListening}
                   className={`absolute left-0 p-2 transition-all ${isListening ? 'text-red-400 animate-pulse' : 'opacity-50 hover:opacity-100'}`}
                   title="Voice Input"
                 >
                   {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                 </button>
               )}
               
               <input 
                  ref={inputRef}
                  type="text" 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={settings.ambientMode ? "Type to exit ambient mode..." : "How do you feel? (use + to blend)"}
                  className="w-full bg-transparent text-xl md:text-2xl font-display outline-none placeholder:text-white/20 text-center px-12"
                  disabled={appState === AppState.THINKING}
                  autoFocus
               />
               
               <AnimatePresence>
                 {input && appState !== AppState.THINKING && (
                   <motion.button
                     initial={{ opacity: 0, scale: 0.8 }}
                     animate={{ opacity: 1, scale: 1 }}
                     exit={{ opacity: 0, scale: 0.8 }}
                     type="button"
                     onClick={() => setInput('')}
                     className="absolute right-10 p-2 opacity-50 hover:opacity-100 transition-opacity"
                   >
                     <X className="w-5 h-5" />
                   </motion.button>
                 )}
               </AnimatePresence>

               <button 
                type="submit"
                disabled={appState === AppState.THINKING || !input}
                className="absolute right-0 opacity-50 hover:opacity-100 disabled:opacity-20 transition-opacity p-2"
               >
                 {appState === AppState.THINKING ? (
                   <Loader2 className="w-6 h-6 animate-spin" />
                 ) : (
                   <ArrowRight className="w-6 h-6" />
                 )}
               </button>
             </div>
             
             {/* Hint text */}
             <p className="mt-4 text-xs font-mono text-white/30">
               Press Enter to submit • Use + to blend emotions • [M] Sound • [F] Fullscreen
             </p>
          </motion.form>

        </div>
      </section>

      <Footer soundEnabled={settings.soundEnabled} onToggleSound={toggleSound} />

      {/* Modals - Lazy loaded */}
      <React.Suspense fallback={null}>
        {isAuthModalOpen && (
          <AuthModal 
            isOpen={isAuthModalOpen} 
            onClose={() => setAuthModalOpen(false)} 
          />
        )}
        
        {isShareModalOpen && (
          <ShareModal
            isOpen={isShareModalOpen}
            onClose={() => setShareModalOpen(false)}
            input={input || params.phrase}
            params={params}
            userId={user?.id}
          />
        )}

        {isGalleryOpen && (
          <Gallery
            isOpen={isGalleryOpen}
            onClose={() => setGalleryOpen(false)}
            onSelect={(p) => {
              setParams(p);
              if (settings.soundEnabled) {
                audioService.start(p.color, p.speed, p.distort);
              }
            }}
          />
        )}
      </React.Suspense>

      {/* Settings Panel */}
      <SettingsPanel
        isOpen={isSettingsOpen}
        onClose={() => setSettingsOpen(false)}
        soundEnabled={settings.soundEnabled}
        onToggleSound={toggleSound}
        visualMode={settings.visualMode}
        onVisualModeChange={(mode) => updateSettings({ visualMode: mode })}
      />

      {/* Meditation */}
      <Meditation
        isOpen={isMeditationOpen}
        onClose={() => setMeditationOpen(false)}
        onParamsChange={setParams}
        soundEnabled={settings.soundEnabled}
        onToggleSound={toggleSound}
      />

      {/* Emotion Timeline */}
      <EmotionTimeline
        isOpen={isTimelineOpen}
        onClose={() => setTimelineOpen(false)}
        history={history}
        onSelectEntry={(p) => {
          setParams(p);
          if (settings.soundEnabled) {
            audioService.start(p.color, p.speed, p.distort);
          }
        }}
      />

      {/* Manual Controls */}
      <ManualControls
        isOpen={isManualControlsOpen}
        onClose={() => setManualControlsOpen(false)}
        params={params}
        onParamsChange={(newParams) => {
          setParams(newParams);
          if (settings.soundEnabled) {
            audioService.update(newParams.color, newParams.speed, newParams.distort);
          }
        }}
        visualMode={settings.visualMode}
      />

      {/* Daily Check-in */}
      <DailyCheckIn
        isOpen={isCheckInOpen}
        onClose={() => setCheckInOpen(false)}
        onComplete={(checkIn) => {
          addCheckIn(checkIn);
          recordCheckIn(checkIn.emotions, streak + 1);
        }}
        onVisualize={(p) => {
          setParams(p);
          if (settings.soundEnabled) {
            audioService.start(p.color, p.speed, p.distort);
          }
        }}
        streak={streak}
        todayCompleted={todayCompleted}
      />

      {/* Emotion Insights */}
      <EmotionInsights
        isOpen={isInsightsOpen}
        onClose={() => setInsightsOpen(false)}
        checkIns={checkIns}
        streak={streak}
      />

      {/* Custom Presets */}
      <CustomPresets
        isOpen={isPresetsOpen}
        onClose={() => setPresetsOpen(false)}
        onSelect={(preset) => {
          setParams(preset.params);
          updateSettings({ visualMode: preset.visualMode });
          setPresetsOpen(false);
          if (settings.soundEnabled) {
            audioService.start(preset.params.color, preset.params.speed, preset.params.distort);
          }
        }}
        currentParams={params}
        currentMode={settings.visualMode}
      />

      {/* Collections */}
      <Collections
        isOpen={isCollectionsOpen}
        onClose={() => setCollectionsOpen(false)}
        onSelectVisualization={(p) => {
          setParams(p);
          if (settings.soundEnabled) {
            audioService.start(p.color, p.speed, p.distort);
          }
        }}
        userId={user?.id}
      />

      {/* Follow System */}
      <FollowSystem
        isOpen={isFollowSystemOpen}
        onClose={() => setFollowSystemOpen(false)}
        currentUserId={user?.id}
        onSelectVisualization={(p) => {
          setParams(p);
          if (settings.soundEnabled) {
            audioService.start(p.color, p.speed, p.distort);
          }
        }}
      />

      {/* Video Export */}
      <VideoExport
        isOpen={isVideoExportOpen}
        onClose={() => setVideoExportOpen(false)}
      />

      {/* Embed Generator */}
      <EmbedGenerator
        isOpen={isEmbedOpen}
        onClose={() => setEmbedOpen(false)}
        params={params}
      />

      {/* Affirmations */}
      <Affirmations
        isOpen={isAffirmationsOpen}
        onClose={() => setAffirmationsOpen(false)}
        currentEmotion={params.phrase}
        currentParams={params}
      />

      {/* Music Reactive */}
      <MusicReactive
        isOpen={isMusicReactiveOpen}
        onClose={() => setMusicReactiveOpen(false)}
        onParamsChange={(newParams) => {
          setParams(prev => ({ ...prev, ...newParams }));
          if (settings.soundEnabled && newParams.color) {
            audioService.update(
              newParams.color || params.color,
              newParams.speed || params.speed,
              newParams.distort || params.distort
            );
          }
        }}
        currentParams={params}
      />

      {/* Accessibility Settings */}
      <AccessibilitySettings
        isOpen={isAccessibilityOpen}
        onClose={() => setAccessibilityOpen(false)}
        onSettingsChange={setA11ySettings}
      />

      {/* AR Mode */}
      <ARMode
        isOpen={isARModeOpen}
        onClose={() => setARModeOpen(false)}
        params={params}
      />

      {/* Collab Room */}
      <CollabRoom
        isOpen={isCollabRoomOpen}
        onClose={() => setCollabRoomOpen(false)}
        currentParams={params}
        currentMode={settings.visualMode}
        userId={user?.id}
        onJoinRoom={(p, mode) => {
          setParams(p);
          updateSettings({ visualMode: mode });
          if (settings.soundEnabled) {
            audioService.start(p.color, p.speed, p.distort);
          }
        }}
      />

      {/* Journal */}
      <Journal
        isOpen={isJournalOpen}
        onClose={() => setJournalOpen(false)}
        currentParams={params}
        currentInput={input}
        onLoadVisualization={(p) => {
          setParams(p);
          if (settings.soundEnabled) {
            audioService.start(p.color, p.speed, p.distort);
          }
        }}
      />

      {/* Gamification Hub */}
      <GamificationHub
        isOpen={isGamificationOpen}
        onClose={() => setGamificationOpen(false)}
      />

      {/* Breathing Exercises */}
      <BreathingExercises
        isOpen={isBreathingOpen}
        onClose={() => setBreathingOpen(false)}
        onParamsChange={setParams}
        soundEnabled={settings.soundEnabled}
        onToggleSound={toggleSound}
      />

      {/* Community Leaderboard */}
      <CommunityLeaderboard
        isOpen={isLeaderboardOpen}
        onClose={() => setLeaderboardOpen(false)}
      />

      {/* Achievement Notifications */}
      <AchievementToast
        achievementIds={newAchievements}
        onDismiss={clearNewAchievements}
      />

      {/* Onboarding Tour */}
      {showOnboarding && (
        <OnboardingTour onComplete={completeOnboarding} />
      )}
    </main>
  );
};

export default App;
