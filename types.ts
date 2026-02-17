export interface VisualParams {
  color: string;
  speed: number;
  distort: number;
  phrase: string;
  explanation: string;
  advice?: string; // AI-generated personalized advice based on the emotion
}

export interface NavItem {
  label: string;
  href: string;
}

export enum AppState {
  IDLE = 'IDLE',
  THINKING = 'THINKING',
  GENERATED = 'GENERATED',
  ERROR = 'ERROR'
}

// History entry for session tracking with journal support
export interface HistoryEntry {
  id: string;
  input: string;
  params: VisualParams;
  timestamp: number;
  note?: string; // Journal note
  tags?: string[]; // Emotion tags
}

// Visual modes for different visualization styles
export type VisualMode = 'sphere' | 'particles' | 'aurora' | 'minimal' | 'fluid' | 'geometric' | 'nebula';

// Theme types
export type ThemeMode = 'dark' | 'light' | 'cosmic' | 'minimal' | 'custom';

export interface Theme {
  id: ThemeMode;
  name: string;
  background: string;
  backgroundGradient?: string;
  textPrimary: string;
  textSecondary: string;
  accent: string;
  surface: string;
  border: string;
}

// App settings
export interface AppSettings {
  soundEnabled: boolean;
  visualMode: VisualMode;
  ambientMode: boolean;
  theme: ThemeMode;
  customTheme?: Partial<Theme>;
}

// Meditation session
export interface MeditationSession {
  id: string;
  name: string;
  duration: number; // seconds
  breathPattern: {
    inhale: number;
    hold: number;
    exhale: number;
    holdAfter: number;
  };
  visualParams: VisualParams;
  guidance?: string[];
}

// User profile
export interface UserProfile {
  id: string;
  username: string;
  displayName?: string;
  bio?: string;
  avatarUrl?: string;
  totalVisualizations: number;
  publicVisualizations: number;
  joinedAt: string;
}

// Gallery reaction
export interface GalleryReaction {
  emoji: string;
  count: number;
  userReacted: boolean;
}

// Theme presets
export const THEME_PRESETS: Theme[] = [
  {
    id: 'dark',
    name: 'Dark',
    background: '#050505',
    textPrimary: '#ffffff',
    textSecondary: 'rgba(255,255,255,0.6)',
    accent: '#ffffff',
    surface: 'rgba(255,255,255,0.05)',
    border: 'rgba(255,255,255,0.1)',
  },
  {
    id: 'light',
    name: 'Light',
    background: '#fafafa',
    textPrimary: '#0a0a0a',
    textSecondary: 'rgba(0,0,0,0.6)',
    accent: '#0a0a0a',
    surface: 'rgba(0,0,0,0.03)',
    border: 'rgba(0,0,0,0.1)',
  },
  {
    id: 'cosmic',
    name: 'Cosmic',
    background: '#0a0a1a',
    backgroundGradient: 'radial-gradient(ellipse at center, #1a1a3a 0%, #0a0a1a 70%)',
    textPrimary: '#e0e0ff',
    textSecondary: 'rgba(224,224,255,0.6)',
    accent: '#8b5cf6',
    surface: 'rgba(139,92,246,0.1)',
    border: 'rgba(139,92,246,0.2)',
  },
  {
    id: 'minimal',
    name: 'Minimal',
    background: '#ffffff',
    textPrimary: '#000000',
    textSecondary: 'rgba(0,0,0,0.5)',
    accent: '#000000',
    surface: 'rgba(0,0,0,0.02)',
    border: 'rgba(0,0,0,0.05)',
  },
];

// Visual mode descriptions
export const VISUAL_MODE_INFO: Record<VisualMode, { name: string; description: string }> = {
  sphere: { name: 'Sphere', description: 'Classic distorted sphere' },
  particles: { name: 'Particles', description: 'Flowing particle system' },
  aurora: { name: 'Aurora', description: 'Northern lights waves' },
  minimal: { name: 'Minimal', description: 'Simple pulsing circle' },
  fluid: { name: 'Fluid', description: 'Liquid simulation' },
  geometric: { name: 'Geometric', description: 'Sacred geometry patterns' },
  nebula: { name: 'Nebula', description: 'Cosmic cloud formations' },
};

// Meditation presets
export const MEDITATION_PRESETS: MeditationSession[] = [
  {
    id: 'calm',
    name: 'Calm Breathing',
    duration: 180,
    breathPattern: { inhale: 4, hold: 4, exhale: 4, holdAfter: 4 },
    visualParams: { color: '#06B6D4', speed: 0.3, distort: 0.2, phrase: 'Inner Peace', explanation: 'Breathe and let go.' },
    guidance: ['Breathe in deeply...', 'Hold gently...', 'Release slowly...', 'Rest...'],
  },
  {
    id: 'energize',
    name: 'Energize',
    duration: 120,
    breathPattern: { inhale: 3, hold: 0, exhale: 3, holdAfter: 0 },
    visualParams: { color: '#F59E0B', speed: 1.0, distort: 0.5, phrase: 'Rising Energy', explanation: 'Awaken your spirit.' },
    guidance: ['Breathe in energy...', 'Release and renew...'],
  },
  {
    id: 'sleep',
    name: 'Sleep Preparation',
    duration: 300,
    breathPattern: { inhale: 4, hold: 7, exhale: 8, holdAfter: 0 },
    visualParams: { color: '#6366F1', speed: 0.2, distort: 0.15, phrase: 'Gentle Rest', explanation: 'Drift into tranquility.' },
    guidance: ['Slowly inhale...', 'Hold peacefully...', 'Long exhale, letting go...'],
  },
];

// Ambient mode presets
export const AMBIENT_PRESETS: VisualParams[] = [
  { color: "#FFD700", speed: 1.5, distort: 0.5, phrase: "Golden Dawn", explanation: "Pure elation radiates outward." },
  { color: "#4A5568", speed: 0.3, distort: 0.4, phrase: "Quiet Storm", explanation: "A gentle weight of contemplation." },
  { color: "#06B6D4", speed: 0.4, distort: 0.3, phrase: "Still Waters", explanation: "Tranquility flows in gentle waves." },
  { color: "#8B5CF6", speed: 0.8, distort: 0.6, phrase: "Cosmic Drift", explanation: "Curiosity expands into infinity." },
  { color: "#EC4899", speed: 1.2, distort: 0.5, phrase: "Warm Embrace", explanation: "Affection pulses with soft intensity." },
  { color: "#10B981", speed: 0.6, distort: 0.4, phrase: "Forest Breath", explanation: "Nature's calm permeates the digital." },
];

// Reaction emojis
export const REACTION_EMOJIS = ['❤️', '✨', '🔥', '💜', '🌊', '🌙'];

// ============================================
// NEW FEATURE TYPES
// ============================================

// Custom Preset
export interface CustomPreset {
  id: string;
  name: string;
  params: VisualParams;
  visualMode: VisualMode;
  createdAt: number;
  isPublic?: boolean;
}

// Daily Check-in
export interface DailyCheckIn {
  id: string;
  userId?: string;
  date: string; // YYYY-MM-DD
  mood: number; // 1-5 scale
  emotions: string[];
  note?: string;
  params?: VisualParams;
  createdAt: number;
}

// Emotion Insights
export interface EmotionInsights {
  period: 'week' | 'month' | 'year';
  totalCheckIns: number;
  averageMood: number;
  moodTrend: number; // positive = improving
  topEmotions: { emotion: string; count: number }[];
  streakDays: number;
  longestStreak: number;
  moodByDay: { date: string; mood: number }[];
  colorUsage: { color: string; count: number }[];
}

// Follow relationship
export interface FollowRelation {
  id: string;
  followerId: string;
  followingId: string;
  createdAt: string;
}

// Comment
export interface Comment {
  id: string;
  visualizationId: string;
  userId: string;
  username: string;
  avatarUrl?: string;
  content: string;
  createdAt: string;
  likes: number;
  userLiked?: boolean;
}

// Collection
export interface Collection {
  id: string;
  userId: string;
  name: string;
  description?: string;
  coverImage?: string;
  visualizationIds: string[];
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

// Affirmation
export interface Affirmation {
  id: string;
  text: string;
  emotion: string;
  category: 'encouragement' | 'gratitude' | 'strength' | 'peace' | 'growth';
}

// Language support
export type SupportedLanguage = 'en' | 'es' | 'fr' | 'de' | 'ja' | 'zh' | 'ko' | 'pt' | 'it' | 'ru';

export interface I18nStrings {
  welcome: string;
  placeholder: string;
  submit: string;
  history: string;
  settings: string;
  gallery: string;
  signIn: string;
  signOut: string;
  share: string;
  download: string;
  checkIn: string;
  insights: string;
  collections: string;
  following: string;
  followers: string;
  journal: string;
  achievements: string;
  challenges: string;
  level: string;
  xp: string;
  templates: string;
}

// Collaborative room
export interface CollabRoom {
  id: string;
  name: string;
  hostId: string;
  participants: { userId: string; username: string; cursor?: { x: number; y: number } }[];
  currentParams: VisualParams;
  visualMode: VisualMode;
  isPublic: boolean;
  createdAt: string;
}

// API Key for public API
export interface ApiKey {
  id: string;
  userId: string;
  name: string;
  key: string; // hashed
  permissions: ('read' | 'write' | 'interpret')[];
  usageCount: number;
  lastUsed?: string;
  createdAt: string;
  expiresAt?: string;
}

// Accessibility settings
export interface AccessibilitySettings {
  reducedMotion: boolean;
  highContrast: boolean;
  screenReaderMode: boolean;
  fontSize: 'small' | 'medium' | 'large';
}

// Onboarding state
export interface OnboardingState {
  completed: boolean;
  currentStep: number;
  steps: {
    id: string;
    title: string;
    description: string;
    target: string; // CSS selector
    completed: boolean;
  }[];
}

// Music/Audio reactive settings
export interface AudioReactiveSettings {
  enabled: boolean;
  source: 'microphone' | 'system' | 'spotify';
  sensitivity: number;
  frequencyBands: {
    bass: boolean;
    mid: boolean;
    treble: boolean;
  };
}

// ============================================
// JOURNAL TYPES
// ============================================

// Journal tag categories for situations/triggers
export type JournalTagCategory = 'work' | 'relationships' | 'health' | 'family' | 'finance' | 'creativity' | 'self-care' | 'social' | 'nature' | 'custom';

export interface JournalTag {
  id: string;
  label: string;
  category: JournalTagCategory;
  color: string;
}

// Rich text block for journal entries
export interface TextBlock {
  id: string;
  type: 'paragraph' | 'heading' | 'quote' | 'list';
  content: string;
  style?: {
    bold?: boolean;
    italic?: boolean;
    highlight?: string;
  };
}

// Journal entry linked to a visualization
export interface JournalEntry {
  id: string;
  userId?: string;
  title: string;
  blocks: TextBlock[];
  plainText: string; // Searchable plain text version
  tags: string[]; // Tag IDs
  customTags: string[]; // User-created tag labels
  detectedEmotion?: string; // AI-detected emotion from linked visualization
  promptUsed?: string; // The prompt that inspired this entry
  linkedVisualization?: {
    input: string;
    params: VisualParams;
  };
  mood?: number; // 1-5 scale
  createdAt: number;
  updatedAt: number;
}

// Emotion-based journal prompt
export interface JournalPrompt {
  id: string;
  emotion: string;
  text: string;
  followUp?: string;
  category: 'reflection' | 'exploration' | 'gratitude' | 'release' | 'growth';
}

// Journal search/filter options
export interface JournalFilter {
  searchQuery: string;
  tags: string[];
  dateRange: { start: number | null; end: number | null };
  emotions: string[];
  sortBy: 'newest' | 'oldest' | 'mood-high' | 'mood-low';
  hasVisualization: boolean | null;
}

// Predefined journal tags
export const JOURNAL_TAGS: JournalTag[] = [
  { id: 'work', label: 'Work', category: 'work', color: '#3B82F6' },
  { id: 'relationships', label: 'Relationships', category: 'relationships', color: '#EC4899' },
  { id: 'health', label: 'Health', category: 'health', color: '#10B981' },
  { id: 'family', label: 'Family', category: 'family', color: '#F59E0B' },
  { id: 'finance', label: 'Finance', category: 'finance', color: '#6366F1' },
  { id: 'creativity', label: 'Creativity', category: 'creativity', color: '#8B5CF6' },
  { id: 'self-care', label: 'Self Care', category: 'self-care', color: '#06B6D4' },
  { id: 'social', label: 'Social', category: 'social', color: '#F97316' },
  { id: 'nature', label: 'Nature', category: 'nature', color: '#22C55E' },
  { id: 'stress', label: 'Stress', category: 'work', color: '#EF4444' },
  { id: 'sleep', label: 'Sleep', category: 'health', color: '#6366F1' },
  { id: 'exercise', label: 'Exercise', category: 'health', color: '#14B8A6' },
  { id: 'gratitude', label: 'Gratitude', category: 'self-care', color: '#FBBF24' },
  { id: 'growth', label: 'Growth', category: 'self-care', color: '#A78BFA' },
  { id: 'conflict', label: 'Conflict', category: 'relationships', color: '#DC2626' },
  { id: 'achievement', label: 'Achievement', category: 'work', color: '#FFD700' },
];

// Emotion-based prompts map
export const JOURNAL_PROMPTS: JournalPrompt[] = [
  // Anxious
  { id: 'anx1', emotion: 'anxious', text: "You seem anxious. What's weighing on your mind right now?", followUp: 'Try to identify one specific thing you can control.', category: 'exploration' },
  { id: 'anx2', emotion: 'anxious', text: 'What would you tell a friend who felt this way?', category: 'reflection' },
  { id: 'anx3', emotion: 'anxious', text: 'Name three things you can see, hear, and feel right now.', category: 'release' },
  // Sad
  { id: 'sad1', emotion: 'sad', text: "It seems like you're feeling down. What triggered this feeling?", followUp: 'Remember, it\'s okay to sit with sadness.', category: 'exploration' },
  { id: 'sad2', emotion: 'sad', text: 'What is one small thing that brought you comfort today?', category: 'gratitude' },
  { id: 'sad3', emotion: 'sad', text: 'Write a letter to your future self about this moment.', category: 'growth' },
  // Happy
  { id: 'hap1', emotion: 'happy', text: 'What made you smile today? Capture this moment in words.', category: 'gratitude' },
  { id: 'hap2', emotion: 'happy', text: 'How can you share this positive energy with someone else?', category: 'reflection' },
  { id: 'hap3', emotion: 'happy', text: 'What habits or choices led to this feeling?', category: 'growth' },
  // Angry
  { id: 'ang1', emotion: 'angry', text: "Something sparked frustration. What boundary was crossed?", followUp: 'Anger often protects something we value.', category: 'exploration' },
  { id: 'ang2', emotion: 'angry', text: 'If you could say anything without consequences, what would it be?', category: 'release' },
  { id: 'ang3', emotion: 'angry', text: 'What need of yours is not being met right now?', category: 'reflection' },
  // Calm
  { id: 'cal1', emotion: 'calm', text: 'You seem at peace. What contributed to this tranquility?', category: 'gratitude' },
  { id: 'cal2', emotion: 'calm', text: 'How can you create more of these calm moments in your life?', category: 'growth' },
  // Tired
  { id: 'tir1', emotion: 'tired', text: "You seem drained. What's been demanding your energy?", category: 'exploration' },
  { id: 'tir2', emotion: 'tired', text: 'What is one thing you can let go of today?', category: 'release' },
  // Excited
  { id: 'exc1', emotion: 'excited', text: "You're buzzing with energy! What are you looking forward to?", category: 'exploration' },
  { id: 'exc2', emotion: 'excited', text: 'How does this excitement connect to your deeper goals?', category: 'growth' },
  // Grateful
  { id: 'gra1', emotion: 'grateful', text: 'List three unexpected things you appreciate right now.', category: 'gratitude' },
  { id: 'gra2', emotion: 'grateful', text: 'Who deserves your thanks today, and why?', category: 'reflection' },
  // Hopeful
  { id: 'hop1', emotion: 'hopeful', text: 'What future are you imagining? Describe it in detail.', category: 'growth' },
  { id: 'hop2', emotion: 'hopeful', text: 'What first step can you take toward that vision today?', category: 'exploration' },
  // Loved
  { id: 'lov1', emotion: 'loved', text: 'Who makes you feel seen and appreciated?', category: 'gratitude' },
  { id: 'lov2', emotion: 'loved', text: 'How do you show love to yourself?', category: 'reflection' },
  // Default / unknown
  { id: 'def1', emotion: 'default', text: "What's on your mind right now? Let it flow freely.", category: 'exploration' },
  { id: 'def2', emotion: 'default', text: 'Describe your current emotional landscape as if it were a place.', category: 'reflection' },
  { id: 'def3', emotion: 'default', text: 'What would make today feel complete?', category: 'growth' },
];

// Embed configuration
export interface EmbedConfig {
  visualizationId: string;
  width: number;
  height: number;
  autoplay: boolean;
  showControls: boolean;
  showWatermark: boolean;
  theme: ThemeMode;
}

// Export configuration
export interface ExportConfig {
  format: 'gif' | 'mp4' | 'webm';
  duration: number; // seconds
  quality: 'low' | 'medium' | 'high';
  fps: 15 | 30 | 60;
  width: number;
  height: number;
}

// Mood emoji mapping
export const MOOD_EMOJIS: Record<number, string> = {
  1: '😢',
  2: '😔',
  3: '😐',
  4: '🙂',
  5: '😊',
};

// Emotion categories for check-in
export const EMOTION_CATEGORIES = [
  { id: 'happy', label: 'Happy', emoji: '😊', color: '#FFD700' },
  { id: 'sad', label: 'Sad', emoji: '😢', color: '#4A5568' },
  { id: 'anxious', label: 'Anxious', emoji: '😰', color: '#9333EA' },
  { id: 'calm', label: 'Calm', emoji: '😌', color: '#06B6D4' },
  { id: 'angry', label: 'Angry', emoji: '😠', color: '#EF4444' },
  { id: 'excited', label: 'Excited', emoji: '🤩', color: '#F59E0B' },
  { id: 'tired', label: 'Tired', emoji: '😴', color: '#6B7280' },
  { id: 'grateful', label: 'Grateful', emoji: '🙏', color: '#10B981' },
  { id: 'loved', label: 'Loved', emoji: '🥰', color: '#EC4899' },
  { id: 'hopeful', label: 'Hopeful', emoji: '✨', color: '#8B5CF6' },
];

// Onboarding steps
export const ONBOARDING_STEPS = [
  {
    id: 'welcome',
    title: 'Welcome to Aetheria',
    description: 'Transform your emotions into living digital art.',
    target: 'body',
  },
  {
    id: 'input',
    title: 'Express Yourself',
    description: 'Type how you feel or use voice input to share your emotions.',
    target: '[data-tour="input"]',
  },
  {
    id: 'visualization',
    title: 'Watch It Transform',
    description: 'See your emotions visualized in real-time 3D.',
    target: 'canvas',
  },
  {
    id: 'controls',
    title: 'Explore Controls',
    description: 'Adjust settings, change themes, and customize your experience.',
    target: '[data-tour="controls"]',
  },
  {
    id: 'share',
    title: 'Share Your Art',
    description: 'Save, share, or add to the community gallery.',
    target: '[data-tour="share"]',
  },
];

// Default translations
export const DEFAULT_I18N: Record<SupportedLanguage, I18nStrings> = {
  en: {
    welcome: 'Welcome',
    placeholder: 'How do you feel?',
    submit: 'Submit',
    history: 'History',
    settings: 'Settings',
    gallery: 'Gallery',
    signIn: 'Sign In',
    signOut: 'Sign Out',
    share: 'Share',
    download: 'Download',
    checkIn: 'Daily Check-in',
    insights: 'Insights',
    collections: 'Collections',
    following: 'Following',
    followers: 'Followers',
    journal: 'Journal',
    achievements: 'Achievements',
    challenges: 'Challenges',
    level: 'Level',
    xp: 'XP',
    templates: 'Templates',
  },
  es: {
    welcome: 'Bienvenido',
    placeholder: '¿Cómo te sientes?',
    submit: 'Enviar',
    history: 'Historial',
    settings: 'Configuración',
    gallery: 'Galería',
    signIn: 'Iniciar sesión',
    signOut: 'Cerrar sesión',
    share: 'Compartir',
    download: 'Descargar',
    checkIn: 'Check-in diario',
    insights: 'Estadísticas',
    collections: 'Colecciones',
    following: 'Siguiendo',
    followers: 'Seguidores',
    journal: 'Diario',
    achievements: 'Logros',
    challenges: 'Desafios',
    level: 'Nivel',
    xp: 'XP',
    templates: 'Plantillas',
  },
  fr: {
    welcome: 'Bienvenue',
    placeholder: 'Comment vous sentez-vous?',
    submit: 'Soumettre',
    history: 'Historique',
    settings: 'Paramètres',
    gallery: 'Galerie',
    signIn: 'Connexion',
    signOut: 'Déconnexion',
    share: 'Partager',
    download: 'Télécharger',
    checkIn: 'Bilan quotidien',
    insights: 'Analyses',
    collections: 'Collections',
    following: 'Abonnements',
    followers: 'Abonnés',
    journal: 'Journal',
    achievements: 'Accomplissements',
    challenges: 'Défis',
    level: 'Niveau',
    xp: 'XP',
    templates: 'Modèles',
  },
  de: {
    welcome: 'Willkommen',
    placeholder: 'Wie fühlst du dich?',
    submit: 'Senden',
    history: 'Verlauf',
    settings: 'Einstellungen',
    gallery: 'Galerie',
    signIn: 'Anmelden',
    signOut: 'Abmelden',
    share: 'Teilen',
    download: 'Herunterladen',
    checkIn: 'Täglicher Check-in',
    insights: 'Einblicke',
    collections: 'Sammlungen',
    following: 'Folge ich',
    followers: 'Follower',
    journal: 'Tagebuch',
    achievements: 'Erfolge',
    challenges: 'Herausforderungen',
    level: 'Stufe',
    xp: 'XP',
    templates: 'Vorlagen',
  },
  ja: {
    welcome: 'ようこそ',
    placeholder: '今の気持ちは？',
    submit: '送信',
    history: '履歴',
    settings: '設定',
    gallery: 'ギャラリー',
    signIn: 'ログイン',
    signOut: 'ログアウト',
    share: '共有',
    download: 'ダウンロード',
    checkIn: '毎日のチェックイン',
    insights: '分析',
    collections: 'コレクション',
    following: 'フォロー中',
    followers: 'フォロワー',
    journal: '日記',
    achievements: '実績',
    challenges: 'チャレンジ',
    level: 'レベル',
    xp: 'XP',
    templates: 'テンプレート',
  },
  zh: {
    welcome: '欢迎',
    placeholder: '你感觉如何？',
    submit: '提交',
    history: '历史',
    settings: '设置',
    gallery: '画廊',
    signIn: '登录',
    signOut: '退出',
    share: '分享',
    download: '下载',
    checkIn: '每日签到',
    insights: '洞察',
    collections: '收藏',
    following: '关注',
    followers: '粉丝',
    journal: '日记',
    achievements: '成就',
    challenges: '挑战',
    level: '等级',
    xp: '经验值',
    templates: '模板',
  },
  ko: {
    welcome: '환영합니다',
    placeholder: '기분이 어떠세요?',
    submit: '제출',
    history: '기록',
    settings: '설정',
    gallery: '갤러리',
    signIn: '로그인',
    signOut: '로그아웃',
    share: '공유',
    download: '다운로드',
    checkIn: '일일 체크인',
    insights: '인사이트',
    collections: '컬렉션',
    following: '팔로잉',
    followers: '팔로워',
    journal: '일기',
    achievements: '업적',
    challenges: '도전',
    level: '레벨',
    xp: '경험치',
    templates: '템플릿',
  },
  pt: {
    welcome: 'Bem-vindo',
    placeholder: 'Como você se sente?',
    submit: 'Enviar',
    history: 'Histórico',
    settings: 'Configurações',
    gallery: 'Galeria',
    signIn: 'Entrar',
    signOut: 'Sair',
    share: 'Compartilhar',
    download: 'Baixar',
    checkIn: 'Check-in diário',
    insights: 'Insights',
    collections: 'Coleções',
    following: 'Seguindo',
    followers: 'Seguidores',
    journal: 'Diário',
    achievements: 'Conquistas',
    challenges: 'Desafios',
    level: 'Nível',
    xp: 'XP',
    templates: 'Modelos',
  },
  it: {
    welcome: 'Benvenuto',
    placeholder: 'Come ti senti?',
    submit: 'Invia',
    history: 'Cronologia',
    settings: 'Impostazioni',
    gallery: 'Galleria',
    signIn: 'Accedi',
    signOut: 'Esci',
    share: 'Condividi',
    download: 'Scarica',
    checkIn: 'Check-in giornaliero',
    insights: 'Statistiche',
    collections: 'Collezioni',
    following: 'Seguiti',
    followers: 'Follower',
    journal: 'Diario',
    achievements: 'Traguardi',
    challenges: 'Sfide',
    level: 'Livello',
    xp: 'XP',
    templates: 'Modelli',
  },
  ru: {
    welcome: 'Добро пожаловать',
    placeholder: 'Как вы себя чувствуете?',
    submit: 'Отправить',
    history: 'История',
    settings: 'Настройки',
    gallery: 'Галерея',
    signIn: 'Войти',
    signOut: 'Выйти',
    share: 'Поделиться',
    download: 'Скачать',
    checkIn: 'Ежедневная отметка',
    insights: 'Аналитика',
    collections: 'Коллекции',
    following: 'Подписки',
    followers: 'Подписчики',
    journal: 'Дневник',
    achievements: 'Достижения',
    challenges: 'Испытания',
    level: 'Уровень',
    xp: 'Опыт',
    templates: 'Шаблоны',
  },
};

// ============================================
// GAMIFICATION TYPES
// ============================================

// Achievement badge
export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string; // emoji
  category: 'streak' | 'emotion' | 'journal' | 'social' | 'exploration' | 'mastery';
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  requirement: {
    type: 'streak' | 'checkin_count' | 'emotion_count' | 'unique_emotions' | 'journal_count' | 'visualization_count' | 'template_count' | 'challenge_count' | 'level';
    value: number;
    emotionId?: string; // for specific emotion achievements
  };
  xpReward: number;
  unlocksVisualization?: VisualMode; // unlockable visualization mode
  unlocksTheme?: ThemeMode; // unlockable theme
}

// User gamification progress
export interface GamificationProgress {
  xp: number;
  level: number;
  totalCheckIns: number;
  totalJournalEntries: number;
  totalVisualizations: number;
  totalTemplatesUsed: number;
  totalChallengesCompleted: number;
  uniqueEmotionsUsed: string[];
  emotionCounts: Record<string, number>;
  currentStreak: number;
  longestStreak: number;
  unlockedAchievements: string[]; // achievement IDs
  unlockedVisualizations: VisualMode[];
  unlockedThemes: ThemeMode[];
  activeChallenges: ActiveChallenge[];
  completedChallengeIds: string[];
  lastCheckInDate: string | null;
}

// Challenge definition
export interface Challenge {
  id: string;
  title: string;
  description: string;
  icon: string;
  type: 'daily' | 'weekly';
  requirement: {
    type: 'checkin' | 'journal' | 'unique_emotions' | 'visualizations' | 'template' | 'streak';
    value: number;
    emotionId?: string;
  };
  xpReward: number;
}

// Active challenge instance
export interface ActiveChallenge {
  challengeId: string;
  startedAt: number;
  expiresAt: number;
  progress: number;
}

// Journal template
export interface JournalTemplate {
  id: string;
  name: string;
  description: string;
  category: 'gratitude' | 'cbt' | 'reflection' | 'mindfulness';
  icon: string;
  blocks: TextBlock[];
  tags: string[];
  promptQuestions?: string[];
}

// XP level thresholds
export const XP_LEVELS: { level: number; xpRequired: number; title: string }[] = [
  { level: 1, xpRequired: 0, title: 'Awakening' },
  { level: 2, xpRequired: 100, title: 'Explorer' },
  { level: 3, xpRequired: 300, title: 'Seeker' },
  { level: 4, xpRequired: 600, title: 'Interpreter' },
  { level: 5, xpRequired: 1000, title: 'Empath' },
  { level: 6, xpRequired: 1500, title: 'Visionary' },
  { level: 7, xpRequired: 2200, title: 'Sage' },
  { level: 8, xpRequired: 3000, title: 'Luminary' },
  { level: 9, xpRequired: 4000, title: 'Transcendent' },
  { level: 10, xpRequired: 5500, title: 'Digital Sentient' },
];

// Achievement definitions
export const ACHIEVEMENTS: Achievement[] = [
  // Streak achievements
  { id: 'streak-3', title: '3-Day Streak', description: 'Check in 3 days in a row', icon: '🔥', category: 'streak', tier: 'bronze', requirement: { type: 'streak', value: 3 }, xpReward: 50 },
  { id: 'streak-7', title: 'Week Warrior', description: 'Maintain a 7-day streak', icon: '⚡', category: 'streak', tier: 'silver', requirement: { type: 'streak', value: 7 }, xpReward: 150 },
  { id: 'streak-14', title: 'Fortnight Focus', description: 'Maintain a 14-day streak', icon: '💪', category: 'streak', tier: 'gold', requirement: { type: 'streak', value: 14 }, xpReward: 300 },
  { id: 'streak-30', title: 'Monthly Master', description: 'Maintain a 30-day streak', icon: '👑', category: 'streak', tier: 'platinum', requirement: { type: 'streak', value: 30 }, xpReward: 500, unlocksTheme: 'cosmic' },

  // Check-in count achievements
  { id: 'checkins-10', title: 'Getting Started', description: 'Complete 10 check-ins', icon: '📋', category: 'emotion', tier: 'bronze', requirement: { type: 'checkin_count', value: 10 }, xpReward: 75 },
  { id: 'checkins-50', title: 'Dedicated Tracker', description: 'Complete 50 check-ins', icon: '📊', category: 'emotion', tier: 'silver', requirement: { type: 'checkin_count', value: 50 }, xpReward: 200 },
  { id: 'checkins-100', title: '100 Emotions Shared', description: 'Complete 100 check-ins', icon: '💯', category: 'emotion', tier: 'gold', requirement: { type: 'checkin_count', value: 100 }, xpReward: 400 },

  // Emotion variety achievements
  { id: 'emotions-5', title: 'Emotional Range', description: 'Use 5 different emotions', icon: '🎭', category: 'emotion', tier: 'bronze', requirement: { type: 'unique_emotions', value: 5 }, xpReward: 75 },
  { id: 'emotions-10', title: 'Full Spectrum', description: 'Use all 10 emotion categories', icon: '🌈', category: 'emotion', tier: 'gold', requirement: { type: 'unique_emotions', value: 10 }, xpReward: 300 },

  // Specific emotion achievements
  { id: 'calm-collector', title: 'Calm Collector', description: 'Log "calm" 10 times', icon: '🧘', category: 'emotion', tier: 'silver', requirement: { type: 'emotion_count', value: 10, emotionId: 'calm' }, xpReward: 150, unlocksVisualization: 'aurora' },
  { id: 'joy-radiator', title: 'Joy Radiator', description: 'Log "happy" 10 times', icon: '☀️', category: 'emotion', tier: 'silver', requirement: { type: 'emotion_count', value: 10, emotionId: 'happy' }, xpReward: 150 },
  { id: 'gratitude-guru', title: 'Gratitude Guru', description: 'Log "grateful" 15 times', icon: '🙏', category: 'emotion', tier: 'gold', requirement: { type: 'emotion_count', value: 15, emotionId: 'grateful' }, xpReward: 250, unlocksVisualization: 'nebula' },

  // Journal achievements
  { id: 'journal-1', title: 'First Entry', description: 'Write your first journal entry', icon: '📝', category: 'journal', tier: 'bronze', requirement: { type: 'journal_count', value: 1 }, xpReward: 50 },
  { id: 'journal-10', title: 'Reflective Writer', description: 'Write 10 journal entries', icon: '📖', category: 'journal', tier: 'silver', requirement: { type: 'journal_count', value: 10 }, xpReward: 200 },
  { id: 'journal-50', title: 'Chronicle Keeper', description: 'Write 50 journal entries', icon: '📚', category: 'journal', tier: 'gold', requirement: { type: 'journal_count', value: 50 }, xpReward: 400 },

  // Template achievements
  { id: 'template-1', title: 'Template Explorer', description: 'Use a journal template', icon: '📋', category: 'journal', tier: 'bronze', requirement: { type: 'template_count', value: 1 }, xpReward: 50 },
  { id: 'template-10', title: 'Template Master', description: 'Use 10 journal templates', icon: '🗂️', category: 'journal', tier: 'silver', requirement: { type: 'template_count', value: 10 }, xpReward: 200 },

  // Visualization achievements
  { id: 'viz-10', title: 'Visual Explorer', description: 'Create 10 visualizations', icon: '🎨', category: 'exploration', tier: 'bronze', requirement: { type: 'visualization_count', value: 10 }, xpReward: 75 },
  { id: 'viz-50', title: 'Digital Artist', description: 'Create 50 visualizations', icon: '🖼️', category: 'exploration', tier: 'silver', requirement: { type: 'visualization_count', value: 50 }, xpReward: 250, unlocksVisualization: 'geometric' },
  { id: 'viz-100', title: 'Visualization Virtuoso', description: 'Create 100 visualizations', icon: '✨', category: 'exploration', tier: 'gold', requirement: { type: 'visualization_count', value: 100 }, xpReward: 500, unlocksVisualization: 'fluid' },

  // Challenge achievements
  { id: 'challenge-5', title: 'Challenge Accepted', description: 'Complete 5 challenges', icon: '🏅', category: 'mastery', tier: 'bronze', requirement: { type: 'challenge_count', value: 5 }, xpReward: 100 },
  { id: 'challenge-20', title: 'Challenge Champion', description: 'Complete 20 challenges', icon: '🏆', category: 'mastery', tier: 'gold', requirement: { type: 'challenge_count', value: 20 }, xpReward: 350 },

  // Level achievements
  { id: 'level-5', title: 'Rising Empath', description: 'Reach level 5', icon: '⭐', category: 'mastery', tier: 'silver', requirement: { type: 'level', value: 5 }, xpReward: 200 },
  { id: 'level-10', title: 'Digital Sentient', description: 'Reach level 10', icon: '🌟', category: 'mastery', tier: 'platinum', requirement: { type: 'level', value: 10 }, xpReward: 1000 },
];

// Challenge pool
export const CHALLENGE_POOL: Challenge[] = [
  // Daily challenges
  { id: 'daily-checkin', title: 'Daily Check-in', description: 'Complete your daily check-in', icon: '📅', type: 'daily', requirement: { type: 'checkin', value: 1 }, xpReward: 25 },
  { id: 'daily-journal', title: 'Daily Reflection', description: 'Write a journal entry today', icon: '✍️', type: 'daily', requirement: { type: 'journal', value: 1 }, xpReward: 30 },
  { id: 'daily-viz', title: 'Express Yourself', description: 'Create 2 visualizations today', icon: '🎨', type: 'daily', requirement: { type: 'visualizations', value: 2 }, xpReward: 25 },
  { id: 'daily-template', title: 'Template Practice', description: 'Use a journal template today', icon: '📋', type: 'daily', requirement: { type: 'template', value: 1 }, xpReward: 30 },
  { id: 'daily-3emotions', title: 'Emotion Explorer', description: 'Log 3 different emotions today', icon: '🎭', type: 'daily', requirement: { type: 'unique_emotions', value: 3 }, xpReward: 35 },

  // Weekly challenges
  { id: 'weekly-5emotions', title: 'Emotional Range', description: 'Capture 5 different emotions this week', icon: '🌈', type: 'weekly', requirement: { type: 'unique_emotions', value: 5 }, xpReward: 100 },
  { id: 'weekly-streak5', title: 'Five Day Flow', description: 'Maintain a 5-day streak this week', icon: '🔥', type: 'weekly', requirement: { type: 'streak', value: 5 }, xpReward: 120 },
  { id: 'weekly-journal3', title: 'Triple Reflection', description: 'Write 3 journal entries this week', icon: '📝', type: 'weekly', requirement: { type: 'journal', value: 3 }, xpReward: 100 },
  { id: 'weekly-viz10', title: 'Creative Sprint', description: 'Create 10 visualizations this week', icon: '✨', type: 'weekly', requirement: { type: 'visualizations', value: 10 }, xpReward: 120 },
  { id: 'weekly-template3', title: 'Structured Growth', description: 'Use 3 templates this week', icon: '🗂️', type: 'weekly', requirement: { type: 'template', value: 3 }, xpReward: 100 },
];

// ============================================
// BREATHING & GROUNDING TYPES
// ============================================

export type BreathingTechnique = 'box' | '478' | 'coherent' | 'alternate-nostril' | 'energizing' | 'calming' | 'custom' | 'sos';

export interface BreathingPattern {
  inhale: number;
  hold: number;
  exhale: number;
  holdAfter: number;
}

export interface BreathingPreset {
  id: BreathingTechnique;
  name: string;
  description: string;
  icon: string;
  pattern: BreathingPattern;
  duration: number; // default seconds
  visualParams: VisualParams;
  guidance: string[];
  category: 'calming' | 'energizing' | 'focus' | 'emergency';
}

export interface BreathingSession {
  id: string;
  technique: BreathingTechnique;
  techniqueName: string;
  pattern: BreathingPattern;
  duration: number; // actual completed seconds
  completedAt: number;
  date: string; // YYYY-MM-DD
}

export interface GroundingExercise {
  id: string;
  name: string;
  type: '54321' | 'body-scan' | 'progressive-relaxation';
  description: string;
  icon: string;
  steps: { label: string; prompt: string; sense?: string }[];
  visualParams: VisualParams;
}

export interface BreathingReminder {
  id: string;
  time: string; // HH:mm
  enabled: boolean;
  technique: BreathingTechnique;
  days: number[]; // 0-6 (Sunday-Saturday)
}

// Breathing technique presets
export const BREATHING_PRESETS: BreathingPreset[] = [
  {
    id: 'box',
    name: 'Box Breathing',
    description: 'Equal inhale, hold, exhale, hold. Used by Navy SEALs for focus and calm.',
    icon: '⬜',
    pattern: { inhale: 4, hold: 4, exhale: 4, holdAfter: 4 },
    duration: 240,
    visualParams: { color: '#06B6D4', speed: 0.3, distort: 0.2, phrase: 'Box Breathing', explanation: 'Equal rhythm for balance and focus.' },
    guidance: ['Breathe in steadily...', 'Hold gently...', 'Release slowly...', 'Hold empty...'],
    category: 'focus',
  },
  {
    id: '478',
    name: '4-7-8 Technique',
    description: 'Dr. Weil\'s relaxation breath. Activates parasympathetic nervous system.',
    icon: '🌙',
    pattern: { inhale: 4, hold: 7, exhale: 8, holdAfter: 0 },
    duration: 300,
    visualParams: { color: '#6366F1', speed: 0.2, distort: 0.15, phrase: 'Deep Rest', explanation: 'A natural tranquilizer for the nervous system.' },
    guidance: ['Inhale through nose...', 'Hold your breath...', 'Exhale completely through mouth...'],
    category: 'calming',
  },
  {
    id: 'coherent',
    name: 'Coherent Breathing',
    description: '5.5 breaths per minute. Synchronizes heart rate variability.',
    icon: '💗',
    pattern: { inhale: 5, hold: 0, exhale: 5, holdAfter: 0 },
    duration: 300,
    visualParams: { color: '#EC4899', speed: 0.4, distort: 0.25, phrase: 'Heart Coherence', explanation: 'Harmonize breath and heartbeat.' },
    guidance: ['Breathe in gently...', 'Let it flow out...'],
    category: 'calming',
  },
  {
    id: 'alternate-nostril',
    name: 'Alternate Nostril',
    description: 'Nadi Shodhana pranayama. Balances left and right brain hemispheres.',
    icon: '🫁',
    pattern: { inhale: 4, hold: 2, exhale: 4, holdAfter: 2 },
    duration: 300,
    visualParams: { color: '#8B5CF6', speed: 0.35, distort: 0.3, phrase: 'Balance', explanation: 'Unite opposing energies within.' },
    guidance: ['Close right nostril, inhale left...', 'Hold both closed...', 'Close left nostril, exhale right...', 'Pause...'],
    category: 'focus',
  },
  {
    id: 'energizing',
    name: 'Energizing Breath',
    description: 'Quick rhythmic breathing to boost alertness and energy.',
    icon: '⚡',
    pattern: { inhale: 2, hold: 0, exhale: 2, holdAfter: 0 },
    duration: 120,
    visualParams: { color: '#F59E0B', speed: 1.0, distort: 0.5, phrase: 'Rising Energy', explanation: 'Awaken your inner fire.' },
    guidance: ['Quick inhale!', 'Sharp exhale!'],
    category: 'energizing',
  },
  {
    id: 'calming',
    name: 'Extended Exhale',
    description: 'Longer exhale activates rest-and-digest response.',
    icon: '🍃',
    pattern: { inhale: 3, hold: 0, exhale: 6, holdAfter: 0 },
    duration: 180,
    visualParams: { color: '#10B981', speed: 0.25, distort: 0.15, phrase: 'Gentle Calm', explanation: 'Let each breath carry away tension.' },
    guidance: ['Breathe in softly...', 'Long, slow exhale...'],
    category: 'calming',
  },
  {
    id: 'sos',
    name: 'Panic SOS',
    description: 'Immediate calming pattern for panic attacks. Gentle, slow, grounding.',
    icon: '🆘',
    pattern: { inhale: 3, hold: 2, exhale: 5, holdAfter: 2 },
    duration: 0, // unlimited until user stops
    visualParams: { color: '#38BDF8', speed: 0.15, distort: 0.1, phrase: 'You Are Safe', explanation: 'This moment will pass. You are okay.' },
    guidance: ['Slow breath in... you are safe...', 'Hold gently...', 'Long breath out... release...', 'Rest... you are here...'],
    category: 'emergency',
  },
];

// Grounding exercises
export const GROUNDING_EXERCISES: GroundingExercise[] = [
  {
    id: '54321',
    name: '5-4-3-2-1 Grounding',
    type: '54321',
    description: 'Ground yourself through your five senses.',
    icon: '🖐️',
    steps: [
      { label: '5 Things You Can See', prompt: 'Look around. Name 5 things you can see right now.', sense: 'sight' },
      { label: '4 Things You Can Touch', prompt: 'Notice 4 things you can physically feel.', sense: 'touch' },
      { label: '3 Things You Can Hear', prompt: 'Listen carefully. What 3 sounds do you notice?', sense: 'hearing' },
      { label: '2 Things You Can Smell', prompt: 'What 2 scents can you notice?', sense: 'smell' },
      { label: '1 Thing You Can Taste', prompt: 'What 1 taste can you notice in your mouth?', sense: 'taste' },
    ],
    visualParams: { color: '#22C55E', speed: 0.3, distort: 0.2, phrase: 'Present Moment', explanation: 'Anchoring to your senses.' },
  },
  {
    id: 'body-scan',
    name: 'Body Scan',
    type: 'body-scan',
    description: 'Progressively scan and relax each part of your body.',
    icon: '🧘',
    steps: [
      { label: 'Head & Face', prompt: 'Notice any tension in your forehead, jaw, and eyes. Let it soften.' },
      { label: 'Neck & Shoulders', prompt: 'Drop your shoulders away from your ears. Release the neck.' },
      { label: 'Arms & Hands', prompt: 'Let your arms hang heavy. Unclench your fingers.' },
      { label: 'Chest & Back', prompt: 'Feel your chest rise and fall. Let your back settle.' },
      { label: 'Stomach & Core', prompt: 'Soften your belly. Release any tightness.' },
      { label: 'Legs & Feet', prompt: 'Feel the weight of your legs. Ground through your feet.' },
    ],
    visualParams: { color: '#A78BFA', speed: 0.2, distort: 0.15, phrase: 'Body Awareness', explanation: 'Reconnecting mind and body.' },
  },
  {
    id: 'progressive-relaxation',
    name: 'Progressive Relaxation',
    type: 'progressive-relaxation',
    description: 'Tense and release muscle groups to release physical stress.',
    icon: '💆',
    steps: [
      { label: 'Fists', prompt: 'Clench your fists tightly for 5 seconds... now release. Notice the difference.' },
      { label: 'Arms', prompt: 'Tense your biceps and forearms for 5 seconds... now release.' },
      { label: 'Shoulders', prompt: 'Raise shoulders to ears and hold for 5 seconds... now drop them.' },
      { label: 'Face', prompt: 'Scrunch your face tightly for 5 seconds... now relax everything.' },
      { label: 'Core', prompt: 'Tighten your stomach muscles for 5 seconds... now let go.' },
      { label: 'Legs', prompt: 'Tense your thighs and calves for 5 seconds... now release.' },
      { label: 'Full Body', prompt: 'Tense everything at once for 5 seconds... now let your whole body go limp.' },
    ],
    visualParams: { color: '#F472B6', speed: 0.3, distort: 0.2, phrase: 'Release', explanation: 'Letting go of physical tension.' },
  },
];

// ============================================
// COMMUNITY LEADERBOARD TYPES
// ============================================

export type LeaderboardPeriod = 'weekly' | 'monthly' | 'all-time';
export type LeaderboardCategory = 'xp' | 'streak' | 'check-ins' | 'journal' | 'breathing' | 'visualizations';

export interface LeaderboardEntry {
  rank: number;
  displayName: string;
  avatarEmoji: string;
  value: number;
  level: number;
  isCurrentUser: boolean;
}

export interface LeaderboardPrivacySettings {
  optedIn: boolean;
  displayName: string;
  avatarEmoji: string;
  showStreak: boolean;
  showXP: boolean;
  showCheckIns: boolean;
  showJournal: boolean;
  showBreathing: boolean;
  showVisualizations: boolean;
}

// Default leaderboard emojis for avatar selection
export const LEADERBOARD_AVATARS = [
  '🌟', '🔮', '🌊', '🔥', '🌙', '⚡', '🦋', '🌸',
  '🎭', '🧘', '💎', '🌈', '🪷', '🫧', '✨', '🌿',
];

// Journal template definitions
export const JOURNAL_TEMPLATES: JournalTemplate[] = [
  // Gratitude templates
  {
    id: 'gratitude-daily',
    name: 'Daily Gratitude',
    description: 'Reflect on three things you are grateful for today',
    category: 'gratitude',
    icon: '🙏',
    blocks: [
      { id: 'g1', type: 'heading', content: 'Three Things I Am Grateful For' },
      { id: 'g2', type: 'paragraph', content: '' },
      { id: 'g3', type: 'list', content: '' },
      { id: 'g4', type: 'list', content: '' },
      { id: 'g5', type: 'list', content: '' },
      { id: 'g6', type: 'heading', content: 'Why These Matter' },
      { id: 'g7', type: 'paragraph', content: '' },
    ],
    tags: ['gratitude', 'self-care'],
    promptQuestions: [
      'What is one unexpected thing that made you smile today?',
      'Who in your life are you most thankful for right now?',
      'What small comfort do you often take for granted?',
    ],
  },
  {
    id: 'gratitude-letter',
    name: 'Gratitude Letter',
    description: 'Write a heartfelt letter to someone who has positively impacted your life',
    category: 'gratitude',
    icon: '💌',
    blocks: [
      { id: 'gl1', type: 'heading', content: 'Dear...' },
      { id: 'gl2', type: 'paragraph', content: '' },
      { id: 'gl3', type: 'heading', content: 'What you mean to me' },
      { id: 'gl4', type: 'paragraph', content: '' },
      { id: 'gl5', type: 'heading', content: 'A specific memory I cherish' },
      { id: 'gl6', type: 'paragraph', content: '' },
      { id: 'gl7', type: 'heading', content: 'How you have changed my life' },
      { id: 'gl8', type: 'paragraph', content: '' },
    ],
    tags: ['gratitude', 'relationships'],
  },
  {
    id: 'gratitude-moments',
    name: 'Gratitude Moments',
    description: 'Capture the small beautiful moments from your day',
    category: 'gratitude',
    icon: '✨',
    blocks: [
      { id: 'gm1', type: 'heading', content: 'Beautiful Moments Today' },
      { id: 'gm2', type: 'quote', content: 'What moments of beauty, kindness, or peace did you notice today?' },
      { id: 'gm3', type: 'paragraph', content: '' },
      { id: 'gm4', type: 'heading', content: 'Sensory Gratitude' },
      { id: 'gm5', type: 'list', content: 'Something beautiful I saw: ' },
      { id: 'gm6', type: 'list', content: 'A sound that brought me peace: ' },
      { id: 'gm7', type: 'list', content: 'A taste or smell I enjoyed: ' },
      { id: 'gm8', type: 'list', content: 'A physical comfort I appreciated: ' },
    ],
    tags: ['gratitude', 'self-care', 'nature'],
  },

  // CBT Exercise templates
  {
    id: 'cbt-thought-record',
    name: 'Thought Record',
    description: 'Identify and challenge negative thought patterns using the CBT thought record technique',
    category: 'cbt',
    icon: '🧠',
    blocks: [
      { id: 'cbt1', type: 'heading', content: 'Situation' },
      { id: 'cbt2', type: 'quote', content: 'What happened? Where were you? Who were you with?' },
      { id: 'cbt3', type: 'paragraph', content: '' },
      { id: 'cbt4', type: 'heading', content: 'Automatic Thoughts' },
      { id: 'cbt5', type: 'quote', content: 'What went through your mind? What images or memories came up?' },
      { id: 'cbt6', type: 'paragraph', content: '' },
      { id: 'cbt7', type: 'heading', content: 'Emotions & Intensity (1-10)' },
      { id: 'cbt8', type: 'paragraph', content: '' },
      { id: 'cbt9', type: 'heading', content: 'Evidence Supporting the Thought' },
      { id: 'cbt10', type: 'paragraph', content: '' },
      { id: 'cbt11', type: 'heading', content: 'Evidence Against the Thought' },
      { id: 'cbt12', type: 'paragraph', content: '' },
      { id: 'cbt13', type: 'heading', content: 'Balanced/Alternative Thought' },
      { id: 'cbt14', type: 'paragraph', content: '' },
      { id: 'cbt15', type: 'heading', content: 'Outcome - How do I feel now? (1-10)' },
      { id: 'cbt16', type: 'paragraph', content: '' },
    ],
    tags: ['health', 'self-care', 'growth'],
    promptQuestions: [
      'Is this thought based on facts or feelings?',
      'What would I tell a friend thinking this?',
      'Will this matter in a week? A month? A year?',
    ],
  },
  {
    id: 'cbt-cognitive-distortions',
    name: 'Cognitive Distortion Check',
    description: 'Identify common thinking traps and reframe them',
    category: 'cbt',
    icon: '🔍',
    blocks: [
      { id: 'cd1', type: 'heading', content: 'The Situation or Trigger' },
      { id: 'cd2', type: 'paragraph', content: '' },
      { id: 'cd3', type: 'heading', content: 'My Thought' },
      { id: 'cd4', type: 'paragraph', content: '' },
      { id: 'cd5', type: 'heading', content: 'Which Distortions Apply?' },
      { id: 'cd6', type: 'list', content: 'All-or-nothing thinking? ' },
      { id: 'cd7', type: 'list', content: 'Catastrophizing? ' },
      { id: 'cd8', type: 'list', content: 'Mind reading? ' },
      { id: 'cd9', type: 'list', content: 'Emotional reasoning? ' },
      { id: 'cd10', type: 'list', content: '"Should" statements? ' },
      { id: 'cd11', type: 'list', content: 'Overgeneralization? ' },
      { id: 'cd12', type: 'heading', content: 'Reframed Thought' },
      { id: 'cd13', type: 'quote', content: 'Write a more balanced, realistic version of the thought.' },
      { id: 'cd14', type: 'paragraph', content: '' },
    ],
    tags: ['health', 'self-care', 'stress'],
  },
  {
    id: 'cbt-behavioral-activation',
    name: 'Behavioral Activation',
    description: 'Plan meaningful activities to improve your mood',
    category: 'cbt',
    icon: '🎯',
    blocks: [
      { id: 'ba1', type: 'heading', content: 'Current Mood & Energy Level' },
      { id: 'ba2', type: 'paragraph', content: '' },
      { id: 'ba3', type: 'heading', content: 'Activities I Have Been Avoiding' },
      { id: 'ba4', type: 'list', content: '' },
      { id: 'ba5', type: 'list', content: '' },
      { id: 'ba6', type: 'heading', content: 'Small Steps I Can Take Today' },
      { id: 'ba7', type: 'list', content: '' },
      { id: 'ba8', type: 'list', content: '' },
      { id: 'ba9', type: 'heading', content: 'Activities That Usually Help My Mood' },
      { id: 'ba10', type: 'list', content: '' },
      { id: 'ba11', type: 'list', content: '' },
      { id: 'ba12', type: 'heading', content: 'My Plan for Tomorrow' },
      { id: 'ba13', type: 'paragraph', content: '' },
    ],
    tags: ['health', 'self-care', 'growth'],
  },

  // Reflection templates
  {
    id: 'reflection-weekly',
    name: 'Weekly Review',
    description: 'Reflect on your week and set intentions for the next',
    category: 'reflection',
    icon: '🔄',
    blocks: [
      { id: 'wr1', type: 'heading', content: 'Highlights of the Week' },
      { id: 'wr2', type: 'paragraph', content: '' },
      { id: 'wr3', type: 'heading', content: 'Challenges Faced' },
      { id: 'wr4', type: 'paragraph', content: '' },
      { id: 'wr5', type: 'heading', content: 'What I Learned' },
      { id: 'wr6', type: 'paragraph', content: '' },
      { id: 'wr7', type: 'heading', content: 'Emotional Patterns I Noticed' },
      { id: 'wr8', type: 'paragraph', content: '' },
      { id: 'wr9', type: 'heading', content: 'Intentions for Next Week' },
      { id: 'wr10', type: 'list', content: '' },
      { id: 'wr11', type: 'list', content: '' },
      { id: 'wr12', type: 'list', content: '' },
    ],
    tags: ['growth', 'self-care'],
  },

  // Mindfulness templates
  {
    id: 'mindfulness-body-scan',
    name: 'Body Scan Journal',
    description: 'Tune into physical sensations and their emotional connections',
    category: 'mindfulness',
    icon: '🧘',
    blocks: [
      { id: 'bs1', type: 'heading', content: 'Body Scan Check-in' },
      { id: 'bs2', type: 'quote', content: 'Close your eyes, take three deep breaths, and scan your body from head to toe.' },
      { id: 'bs3', type: 'heading', content: 'Head & Face' },
      { id: 'bs4', type: 'paragraph', content: '' },
      { id: 'bs5', type: 'heading', content: 'Shoulders & Chest' },
      { id: 'bs6', type: 'paragraph', content: '' },
      { id: 'bs7', type: 'heading', content: 'Stomach & Core' },
      { id: 'bs8', type: 'paragraph', content: '' },
      { id: 'bs9', type: 'heading', content: 'Legs & Feet' },
      { id: 'bs10', type: 'paragraph', content: '' },
      { id: 'bs11', type: 'heading', content: 'Overall Feeling' },
      { id: 'bs12', type: 'paragraph', content: '' },
    ],
    tags: ['health', 'self-care'],
  },
];
