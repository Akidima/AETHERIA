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
  },
};
