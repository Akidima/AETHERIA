import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Moon, Sunrise, Heart, Sparkles, X, ChevronRight, ChevronLeft, Wind } from 'lucide-react';
import { VisualParams } from '../types';

type WellnessTab = 'sleep' | 'routines' | 'gratitude' | 'affirmations' | 'pmr';
type RoutineMode = 'morning' | 'evening';

interface WellnessToolsProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyVisualization: (params: VisualParams) => void;
}

interface SleepStory {
  id: string;
  title: string;
  duration: string;
  summary: string;
  script: string[];
  visual: VisualParams;
}

interface RoutineStep {
  title: string;
  detail: string;
  minutes: number;
}

interface GratitudePost {
  id: string;
  name: string;
  message: string;
  createdAt: number;
}

interface CreatedAffirmation {
  id: string;
  text: string;
  source: 'user' | 'ai';
  createdAt: number;
}

const GRATITUDE_STORAGE_KEY = 'aetheria_gratitude_wall';
const AFFIRMATION_CREATOR_STORAGE_KEY = 'aetheria_affirmation_creator';

const SLEEP_STORIES: SleepStory[] = [
  {
    id: 'moon-lake',
    title: 'Moonlit Lake',
    duration: '8 min',
    summary: 'A quiet drift across still water beneath a silver sky.',
    script: [
      'Settle into stillness and notice the weight of your body softening into the surface beneath you.',
      'Imagine a moonlit lake where the water mirrors the stars and each breath creates gentle rings of light.',
      'With every exhale, release today. Let your thoughts float like small lanterns, moving farther away.',
      'Now drift slowly toward sleep, held by calm water, cool night air, and steady breath.'
    ],
    visual: {
      color: '#7C83FD',
      speed: 0.24,
      distort: 0.2,
      phrase: 'Moonlit Stillness',
      explanation: 'Slow indigo waves support deep rest and nervous system calming.'
    }
  },
  {
    id: 'forest-rain',
    title: 'Forest Rain',
    duration: '10 min',
    summary: 'A warm cabin, soft rain, and pine-scented night air.',
    script: [
      'You are resting near a quiet forest while light rain taps gently across leaves and roof wood.',
      'Each drop marks a slower rhythm. Inhale calm, exhale effort. Let your jaw and shoulders soften.',
      'The forest is safe and steady. You are allowed to let go of unfinished thoughts for tonight.',
      'As the rain fades to a hush, your body grows heavier and sleep arrives naturally.'
    ],
    visual: {
      color: '#4E9F7D',
      speed: 0.2,
      distort: 0.18,
      phrase: 'Rain Sanctuary',
      explanation: 'Earthy greens and low motion promote grounding and release.'
    }
  },
  {
    id: 'cosmic-drift',
    title: 'Cosmic Drift',
    duration: '7 min',
    summary: 'Weightless breathing while stars move in slow arcs.',
    script: [
      'Feel your breath as a tide carrying you into spacious quiet.',
      'Around you, soft starlight expands and contracts with each inhale and exhale.',
      'There is nothing to solve right now. Only this moment, this breath, this gentle drift.',
      'Let your awareness dim naturally and float into restful sleep.'
    ],
    visual: {
      color: '#8B5CF6',
      speed: 0.26,
      distort: 0.22,
      phrase: 'Stellar Drift',
      explanation: 'Soft violet motion cues slow breathing and bedtime decompression.'
    }
  }
];

const ROUTINES: Record<RoutineMode, RoutineStep[]> = {
  morning: [
    { title: 'Hydrate', detail: 'Drink a glass of water and take three deep breaths.', minutes: 2 },
    { title: 'Body Wake-up', detail: 'Gentle neck, shoulder, and spine movement.', minutes: 4 },
    { title: 'Intention', detail: 'Write one clear intention for the day.', minutes: 3 },
    { title: 'Mindful Start', detail: 'Two quiet minutes before checking notifications.', minutes: 2 }
  ],
  evening: [
    { title: 'Digital Sunset', detail: 'Step away from stimulating screens and dim lights.', minutes: 10 },
    { title: 'Reflect', detail: 'Note one win and one lesson from today.', minutes: 4 },
    { title: 'Release', detail: 'Slow breathing with long exhales to downshift.', minutes: 5 },
    { title: 'Sleep Cue', detail: 'Set tomorrow’s first task and let your mind rest.', minutes: 3 }
  ]
};

const PMR_STEPS: Array<{ area: string; instruction: string; holdSeconds: number }> = [
  { area: 'Hands & Forearms', instruction: 'Make fists gently, hold tension, then fully release.', holdSeconds: 5 },
  { area: 'Arms & Shoulders', instruction: 'Lift shoulders toward ears, hold, then drop and soften.', holdSeconds: 6 },
  { area: 'Face & Jaw', instruction: 'Scrunch face softly, hold, then release forehead, eyes, and jaw.', holdSeconds: 5 },
  { area: 'Chest & Back', instruction: 'Take a deeper breath and lightly engage upper back, then relax.', holdSeconds: 6 },
  { area: 'Abdomen', instruction: 'Tighten core gently, hold, then let the belly soften on exhale.', holdSeconds: 5 },
  { area: 'Legs & Feet', instruction: 'Point toes and tense calves/thighs, hold, then release completely.', holdSeconds: 7 }
];

const fallbackAffirmation = (prompt: string): string => {
  const themes = [
    `I move through ${prompt || 'today'} with steadiness and self-respect.`,
    `I am allowed to grow at my own pace and still be proud of my progress.`,
    `My breath is an anchor; I can return to calm one moment at a time.`,
    `I choose thoughts that support my wellbeing and inner peace.`
  ];
  return themes[Math.floor(Math.random() * themes.length)];
};

const suggestAffirmation = async (prompt: string): Promise<string> => {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY as string | undefined;
  if (!apiKey || apiKey === 'your-groq-api-key' || apiKey.length < 20) {
    return fallbackAffirmation(prompt);
  }

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: 'You create short supportive affirmations for emotional wellness. Return plain text only, one sentence, max 20 words.'
          },
          {
            role: 'user',
            content: `Create one affirmation around this focus: ${prompt || 'self-kindness and calm'}`
          }
        ],
        temperature: 0.8,
        max_tokens: 60,
      }),
    });

    if (!response.ok) {
      return fallbackAffirmation(prompt);
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    if (!content || typeof content !== 'string') {
      return fallbackAffirmation(prompt);
    }

    return content.replace(/\s+/g, ' ').trim();
  } catch {
    return fallbackAffirmation(prompt);
  }
};

export const WellnessTools: React.FC<WellnessToolsProps> = ({ isOpen, onClose, onApplyVisualization }) => {
  const [activeTab, setActiveTab] = useState<WellnessTab>('sleep');

  const [activeStoryId, setActiveStoryId] = useState(SLEEP_STORIES[0].id);
  const activeStory = useMemo(
    () => SLEEP_STORIES.find((story) => story.id === activeStoryId) || SLEEP_STORIES[0],
    [activeStoryId]
  );

  const [routineMode, setRoutineMode] = useState<RoutineMode>('morning');
  const [routineStepIndex, setRoutineStepIndex] = useState(0);

  const [gratitudePosts, setGratitudePosts] = useState<GratitudePost[]>([]);
  const [gratitudeName, setGratitudeName] = useState('');
  const [gratitudeMessage, setGratitudeMessage] = useState('');

  const [affirmationFocus, setAffirmationFocus] = useState('');
  const [affirmationDraft, setAffirmationDraft] = useState('');
  const [createdAffirmations, setCreatedAffirmations] = useState<CreatedAffirmation[]>([]);
  const [isSuggestingAffirmation, setIsSuggestingAffirmation] = useState(false);

  const [pmrIndex, setPmrIndex] = useState(0);

  const routineSteps = ROUTINES[routineMode];
  const currentRoutineStep = routineSteps[routineStepIndex];
  const currentPmrStep = PMR_STEPS[pmrIndex];

  useEffect(() => {
    try {
      const raw = localStorage.getItem(GRATITUDE_STORAGE_KEY);
      if (raw) {
        setGratitudePosts(JSON.parse(raw));
      }
    } catch {
      setGratitudePosts([]);
    }

    try {
      const raw = localStorage.getItem(AFFIRMATION_CREATOR_STORAGE_KEY);
      if (raw) {
        setCreatedAffirmations(JSON.parse(raw));
      }
    } catch {
      setCreatedAffirmations([]);
    }
  }, []);

  const saveGratitude = (posts: GratitudePost[]) => {
    setGratitudePosts(posts);
    localStorage.setItem(GRATITUDE_STORAGE_KEY, JSON.stringify(posts));
  };

  const saveAffirmations = (items: CreatedAffirmation[]) => {
    setCreatedAffirmations(items);
    localStorage.setItem(AFFIRMATION_CREATOR_STORAGE_KEY, JSON.stringify(items));
  };

  const handleAddGratitude = () => {
    if (!gratitudeMessage.trim()) return;

    const newPost: GratitudePost = {
      id: `gratitude_${Date.now()}`,
      name: gratitudeName.trim() || 'Anonymous',
      message: gratitudeMessage.trim(),
      createdAt: Date.now(),
    };

    saveGratitude([newPost, ...gratitudePosts].slice(0, 100));
    setGratitudeMessage('');
  };

  const handleSaveUserAffirmation = () => {
    if (!affirmationDraft.trim()) return;

    const item: CreatedAffirmation = {
      id: `affirm_user_${Date.now()}`,
      text: affirmationDraft.trim(),
      source: 'user',
      createdAt: Date.now(),
    };

    saveAffirmations([item, ...createdAffirmations].slice(0, 100));
    setAffirmationDraft('');
  };

  const handleSuggestAffirmation = async () => {
    setIsSuggestingAffirmation(true);
    const aiText = await suggestAffirmation(affirmationFocus.trim());

    const item: CreatedAffirmation = {
      id: `affirm_ai_${Date.now()}`,
      text: aiText,
      source: 'ai',
      createdAt: Date.now(),
    };

    saveAffirmations([item, ...createdAffirmations].slice(0, 100));
    setIsSuggestingAffirmation(false);
  };

  const tabButtonClass = (tab: WellnessTab) =>
    `px-3 py-2 rounded-lg border text-xs font-mono uppercase tracking-widest transition-colors ${
      activeTab === tab
        ? 'bg-white/10 border-white/40 text-white'
        : 'bg-transparent border-white/10 text-white/60 hover:border-white/30 hover:text-white'
    }`;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[210] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.98 }}
            className="w-full max-w-4xl max-h-[92vh] overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a0a]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 p-4">
              <div>
                <h3 className="font-display text-xl font-bold uppercase tracking-tight">Wellness Tools</h3>
                <p className="text-xs text-white/50 font-mono uppercase tracking-widest">Sleep • Routines • Gratitude • Affirmations • PMR</p>
              </div>
              <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="border-b border-white/10 p-3 flex flex-wrap gap-2">
              <button className={tabButtonClass('sleep')} onClick={() => setActiveTab('sleep')}>Sleep Stories</button>
              <button className={tabButtonClass('routines')} onClick={() => setActiveTab('routines')}>Routines</button>
              <button className={tabButtonClass('gratitude')} onClick={() => setActiveTab('gratitude')}>Gratitude Wall</button>
              <button className={tabButtonClass('affirmations')} onClick={() => setActiveTab('affirmations')}>Affirmation Creator</button>
              <button className={tabButtonClass('pmr')} onClick={() => setActiveTab('pmr')}>Muscle Relaxation</button>
            </div>

            <div className="p-5 overflow-y-auto max-h-[68vh]">
              {activeTab === 'sleep' && (
                <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1.5fr] gap-4">
                  <div className="space-y-2">
                    {SLEEP_STORIES.map((story) => (
                      <button
                        key={story.id}
                        onClick={() => setActiveStoryId(story.id)}
                        className={`w-full text-left p-3 rounded-xl border transition-colors ${
                          story.id === activeStory.id ? 'border-indigo-400/60 bg-indigo-500/10' : 'border-white/10 hover:border-white/30 bg-white/[0.02]'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <p className="font-semibold">{story.title}</p>
                          <span className="text-xs text-white/60">{story.duration}</span>
                        </div>
                        <p className="text-sm text-white/60 mt-1">{story.summary}</p>
                      </button>
                    ))}
                  </div>

                  <div className="border border-white/10 rounded-xl p-4 bg-white/[0.02]">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Moon className="w-4 h-4 text-indigo-300" />
                        <h4 className="font-semibold">{activeStory.title}</h4>
                      </div>
                      <button
                        onClick={() => onApplyVisualization(activeStory.visual)}
                        className="px-3 py-2 rounded-lg bg-indigo-500/20 border border-indigo-400/40 hover:bg-indigo-500/30 text-sm"
                      >
                        Play Calming Visual
                      </button>
                    </div>

                    <div className="space-y-2">
                      {activeStory.script.map((line, index) => (
                        <p key={index} className="text-sm text-white/75 leading-relaxed">{line}</p>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'routines' && (
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setRoutineMode('morning');
                        setRoutineStepIndex(0);
                      }}
                      className={`px-3 py-2 rounded-lg border text-sm ${
                        routineMode === 'morning' ? 'border-amber-400/60 bg-amber-500/10' : 'border-white/10 hover:border-white/30'
                      }`}
                    >
                      <span className="inline-flex items-center gap-2"><Sunrise className="w-4 h-4" /> Morning Flow</span>
                    </button>
                    <button
                      onClick={() => {
                        setRoutineMode('evening');
                        setRoutineStepIndex(0);
                      }}
                      className={`px-3 py-2 rounded-lg border text-sm ${
                        routineMode === 'evening' ? 'border-indigo-400/60 bg-indigo-500/10' : 'border-white/10 hover:border-white/30'
                      }`}
                    >
                      <span className="inline-flex items-center gap-2"><Moon className="w-4 h-4" /> Evening Flow</span>
                    </button>
                  </div>

                  <div className="border border-white/10 rounded-xl p-4 bg-white/[0.02]">
                    <p className="text-xs font-mono uppercase tracking-widest text-white/50">Guided Step {routineStepIndex + 1} / {routineSteps.length}</p>
                    <h4 className="font-semibold text-lg mt-2">{currentRoutineStep.title}</h4>
                    <p className="text-sm text-white/70 mt-1">{currentRoutineStep.detail}</p>
                    <p className="text-xs text-white/50 mt-3">Suggested time: {currentRoutineStep.minutes} min</p>

                    <div className="flex items-center gap-2 mt-4">
                      <button
                        onClick={() => setRoutineStepIndex((index) => Math.max(0, index - 1))}
                        className="px-3 py-2 rounded-lg border border-white/10 hover:border-white/30"
                        disabled={routineStepIndex === 0}
                      >
                        <span className="inline-flex items-center gap-1"><ChevronLeft className="w-4 h-4" /> Back</span>
                      </button>
                      <button
                        onClick={() => setRoutineStepIndex((index) => Math.min(routineSteps.length - 1, index + 1))}
                        className="px-3 py-2 rounded-lg border border-white/10 hover:border-white/30"
                        disabled={routineStepIndex === routineSteps.length - 1}
                      >
                        <span className="inline-flex items-center gap-1">Next <ChevronRight className="w-4 h-4" /></span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'gratitude' && (
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.3fr] gap-4">
                  <div className="border border-white/10 rounded-xl p-4 bg-white/[0.02] space-y-3">
                    <h4 className="font-semibold inline-flex items-center gap-2"><Heart className="w-4 h-4 text-pink-300" /> Share Positivity</h4>
                    <input
                      type="text"
                      value={gratitudeName}
                      onChange={(event) => setGratitudeName(event.target.value)}
                      placeholder="Name (optional)"
                      className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 focus:border-white/30 outline-none"
                    />
                    <textarea
                      value={gratitudeMessage}
                      onChange={(event) => setGratitudeMessage(event.target.value)}
                      placeholder="What are you grateful for today?"
                      rows={4}
                      className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 focus:border-white/30 outline-none resize-none"
                    />
                    <button
                      onClick={handleAddGratitude}
                      className="w-full px-3 py-2 rounded-lg border border-pink-400/40 bg-pink-500/10 hover:bg-pink-500/20"
                    >
                      Post to Gratitude Wall
                    </button>
                  </div>

                  <div className="border border-white/10 rounded-xl p-4 bg-white/[0.02]">
                    <h4 className="font-semibold mb-3">Community Gratitude Wall</h4>
                    <div className="space-y-2 max-h-[48vh] overflow-y-auto">
                      {gratitudePosts.length === 0 && (
                        <p className="text-sm text-white/50">No posts yet. Be the first to share something positive.</p>
                      )}
                      {gratitudePosts.map((post) => (
                        <div key={post.id} className="rounded-lg border border-white/10 p-3 bg-black/20">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-sm font-medium text-white/90">{post.name}</p>
                            <p className="text-xs text-white/50">{new Date(post.createdAt).toLocaleDateString()}</p>
                          </div>
                          <p className="text-sm text-white/75">{post.message}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'affirmations' && (
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.3fr] gap-4">
                  <div className="border border-white/10 rounded-xl p-4 bg-white/[0.02] space-y-3">
                    <h4 className="font-semibold inline-flex items-center gap-2"><Sparkles className="w-4 h-4 text-violet-300" /> Affirmation Creator</h4>
                    <input
                      type="text"
                      value={affirmationFocus}
                      onChange={(event) => setAffirmationFocus(event.target.value)}
                      placeholder="Focus (e.g., confidence, rest, healing)"
                      className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 focus:border-white/30 outline-none"
                    />
                    <textarea
                      rows={3}
                      value={affirmationDraft}
                      onChange={(event) => setAffirmationDraft(event.target.value)}
                      placeholder="Write your own affirmation"
                      className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 focus:border-white/30 outline-none resize-none"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={handleSaveUserAffirmation}
                        className="px-3 py-2 rounded-lg border border-white/20 hover:border-white/40"
                      >
                        Save Mine
                      </button>
                      <button
                        onClick={handleSuggestAffirmation}
                        disabled={isSuggestingAffirmation}
                        className="px-3 py-2 rounded-lg border border-violet-400/40 bg-violet-500/10 hover:bg-violet-500/20 disabled:opacity-60"
                      >
                        {isSuggestingAffirmation ? 'Thinking...' : 'AI Suggest'}
                      </button>
                    </div>
                  </div>

                  <div className="border border-white/10 rounded-xl p-4 bg-white/[0.02]">
                    <h4 className="font-semibold mb-3">Created Affirmations</h4>
                    <div className="space-y-2 max-h-[48vh] overflow-y-auto">
                      {createdAffirmations.length === 0 && (
                        <p className="text-sm text-white/50">Create one yourself or generate an AI suggestion.</p>
                      )}
                      {createdAffirmations.map((item) => (
                        <div key={item.id} className="rounded-lg border border-white/10 p-3 bg-black/20">
                          <p className="text-sm text-white/85">{item.text}</p>
                          <p className="text-xs text-white/45 mt-2 uppercase tracking-widest font-mono">{item.source === 'ai' ? 'AI-suggested' : 'User-created'}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'pmr' && (
                <div className="max-w-2xl space-y-4">
                  <div className="border border-white/10 rounded-xl p-4 bg-white/[0.02]">
                    <p className="text-xs font-mono uppercase tracking-widest text-white/50">Progressive Muscle Relaxation</p>
                    <h4 className="font-semibold text-lg mt-2 inline-flex items-center gap-2"><Wind className="w-4 h-4 text-cyan-300" /> {currentPmrStep.area}</h4>
                    <p className="text-sm text-white/75 mt-2">{currentPmrStep.instruction}</p>
                    <p className="text-xs text-white/50 mt-2">Hold tension for {currentPmrStep.holdSeconds}s, then release for 10s with slow breathing.</p>

                    <div className="flex items-center gap-2 mt-4">
                      <button
                        onClick={() => setPmrIndex((index) => Math.max(0, index - 1))}
                        className="px-3 py-2 rounded-lg border border-white/10 hover:border-white/30"
                        disabled={pmrIndex === 0}
                      >
                        <span className="inline-flex items-center gap-1"><ChevronLeft className="w-4 h-4" /> Previous</span>
                      </button>
                      <button
                        onClick={() => setPmrIndex((index) => Math.min(PMR_STEPS.length - 1, index + 1))}
                        className="px-3 py-2 rounded-lg border border-white/10 hover:border-white/30"
                        disabled={pmrIndex === PMR_STEPS.length - 1}
                      >
                        <span className="inline-flex items-center gap-1">Next <ChevronRight className="w-4 h-4" /></span>
                      </button>
                    </div>
                  </div>

                  <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full bg-cyan-300/70 transition-all"
                      style={{ width: `${((pmrIndex + 1) / PMR_STEPS.length) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default WellnessTools;
