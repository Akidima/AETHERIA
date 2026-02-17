// Journal Integration Component
// Rich text journal entries linked to visualizations with emotion-based prompts,
// tag system for situations/triggers, and search/filter through journal history.
import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, BookOpen, Plus, Search, Filter, Tag, Sparkles, ChevronLeft,
  ChevronRight, Trash2, Edit3, Save, Clock, Hash, Lightbulb,
  Palette, SortAsc, SortDesc, Eye, Calendar, ArrowLeft,
  Bold, Italic, Quote, List, Type, AlignLeft, FileText
} from 'lucide-react';
import {
  VisualParams, JournalEntry, JournalTag, JournalPrompt, TextBlock,
  JournalFilter, JOURNAL_TAGS, JOURNAL_PROMPTS, EMOTION_CATEGORIES,
  MOOD_EMOJIS, JournalTemplate
} from '../types';
import { useJournalStore, useGamificationStore } from '../store/useStore';
import { JournalTemplates } from './JournalTemplates';

// ============================================
// PROPS
// ============================================
interface JournalProps {
  isOpen: boolean;
  onClose: () => void;
  currentParams?: VisualParams;
  currentInput?: string;
  onLoadVisualization?: (params: VisualParams) => void;
}

// ============================================
// HELPER: Detect emotion from params/input
// ============================================
function detectEmotion(input?: string, params?: VisualParams): string {
  if (!input && !params) return 'default';
  const text = (input || '' + ' ' + (params?.phrase || '') + ' ' + (params?.explanation || '')).toLowerCase();

  const emotionKeywords: Record<string, string[]> = {
    happy: ['happy', 'joy', 'elat', 'cheer', 'delight', 'bliss', 'euphori', 'golden', 'bright', 'smile'],
    sad: ['sad', 'sorrow', 'melanchol', 'grief', 'mourn', 'blue', 'down', 'depress', 'lonely', 'quiet storm'],
    anxious: ['anxi', 'worry', 'nervous', 'stress', 'panic', 'fear', 'tense', 'restless', 'overwhelm', 'uneasy'],
    angry: ['anger', 'angry', 'furi', 'rage', 'frustrat', 'irrit', 'burn', 'chaos', 'mad'],
    calm: ['calm', 'peace', 'seren', 'tranquil', 'still', 'relax', 'gentle', 'quiet', 'zen'],
    tired: ['tired', 'exhaust', 'drain', 'fatigue', 'sleepy', 'weary', 'burn out'],
    excited: ['excit', 'thrill', 'buzz', 'energi', 'alive', 'vibrant', 'electric'],
    grateful: ['grateful', 'thankful', 'appreciat', 'bless', 'gratitude'],
    hopeful: ['hope', 'optimis', 'bright future', 'looking forward', 'dream'],
    loved: ['love', 'affection', 'warm', 'embrace', 'tender', 'heart', 'care'],
  };

  for (const [emotion, keywords] of Object.entries(emotionKeywords)) {
    if (keywords.some(k => text.includes(k))) {
      return emotion;
    }
  }

  // Color-based fallback detection
  if (params?.color) {
    const hex = params.color.replace('#', '');
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);

    if (r > 200 && g > 180 && b < 100) return 'happy';
    if (r > 200 && g < 100 && b < 100) return 'angry';
    if (r < 100 && g < 100 && b > 150) return 'sad';
    if (r < 100 && g > 150 && b > 150) return 'calm';
    if (r > 150 && g < 100 && b > 150) return 'hopeful';
    if (r > 200 && g < 150 && b > 150) return 'loved';
  }

  return 'default';
}

// ============================================
// HELPER: Get prompts for detected emotion
// ============================================
function getPromptsForEmotion(emotion: string): JournalPrompt[] {
  const specific = JOURNAL_PROMPTS.filter(p => p.emotion === emotion);
  const defaults = JOURNAL_PROMPTS.filter(p => p.emotion === 'default');
  return specific.length > 0 ? specific : defaults;
}

// ============================================
// SUB-COMPONENT: Rich Text Editor
// ============================================
interface EditorProps {
  blocks: TextBlock[];
  onChange: (blocks: TextBlock[]) => void;
}

const RichTextEditor: React.FC<EditorProps> = ({ blocks, onChange }) => {
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null);

  const addBlock = useCallback((type: TextBlock['type'] = 'paragraph') => {
    const newBlock: TextBlock = {
      id: Date.now().toString() + Math.random().toString(36).slice(2, 6),
      type,
      content: '',
    };
    onChange([...blocks, newBlock]);
    setTimeout(() => setActiveBlockId(newBlock.id), 50);
  }, [blocks, onChange]);

  const updateBlock = useCallback((id: string, content: string) => {
    onChange(blocks.map(b => b.id === id ? { ...b, content } : b));
  }, [blocks, onChange]);

  const updateBlockType = useCallback((id: string, type: TextBlock['type']) => {
    onChange(blocks.map(b => b.id === id ? { ...b, type } : b));
  }, [blocks, onChange]);

  const toggleStyle = useCallback((id: string, styleProp: 'bold' | 'italic') => {
    onChange(blocks.map(b => {
      if (b.id !== id) return b;
      return { ...b, style: { ...b.style, [styleProp]: !b.style?.[styleProp] } };
    }));
  }, [blocks, onChange]);

  const removeBlock = useCallback((id: string) => {
    if (blocks.length <= 1) return;
    onChange(blocks.filter(b => b.id !== id));
  }, [blocks, onChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent, blockId: string) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      addBlock('paragraph');
    }
    if (e.key === 'Backspace') {
      const block = blocks.find(b => b.id === blockId);
      if (block && block.content === '' && blocks.length > 1) {
        e.preventDefault();
        removeBlock(blockId);
        const idx = blocks.findIndex(b => b.id === blockId);
        if (idx > 0) {
          setActiveBlockId(blocks[idx - 1].id);
        }
      }
    }
  }, [blocks, addBlock, removeBlock]);

  // Auto-add first block if empty
  useEffect(() => {
    if (blocks.length === 0) {
      addBlock('paragraph');
    }
  }, []);

  const getBlockPlaceholder = (type: TextBlock['type'], index: number): string => {
    if (index === 0) return 'Start writing your thoughts...';
    switch (type) {
      case 'heading': return 'Heading...';
      case 'quote': return 'Quote or reflection...';
      case 'list': return 'List item...';
      default: return 'Continue writing...';
    }
  };

  const getBlockClassName = (block: TextBlock): string => {
    const base = 'w-full bg-transparent outline-none resize-none text-white/90 placeholder:text-white/20 leading-relaxed';
    const styleClasses = [
      block.style?.bold ? 'font-bold' : '',
      block.style?.italic ? 'italic' : '',
    ].filter(Boolean).join(' ');

    switch (block.type) {
      case 'heading':
        return `${base} font-display text-xl font-bold ${styleClasses}`;
      case 'quote':
        return `${base} border-l-2 border-white/30 pl-4 italic text-white/70 ${styleClasses}`;
      case 'list':
        return `${base} pl-6 ${styleClasses}`;
      default:
        return `${base} ${styleClasses}`;
    }
  };

  return (
    <div className="space-y-1">
      {blocks.map((block, index) => (
        <div
          key={block.id}
          className={`group relative ${activeBlockId === block.id ? '' : ''}`}
        >
          {/* Block toolbar - shows on focus */}
          {activeBlockId === block.id && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-1 mb-1"
            >
              <button
                onClick={() => updateBlockType(block.id, 'paragraph')}
                className={`p-1 rounded text-xs ${block.type === 'paragraph' ? 'bg-white/20 text-white' : 'text-white/40 hover:text-white/70'}`}
                title="Paragraph"
              >
                <AlignLeft className="w-3 h-3" />
              </button>
              <button
                onClick={() => updateBlockType(block.id, 'heading')}
                className={`p-1 rounded text-xs ${block.type === 'heading' ? 'bg-white/20 text-white' : 'text-white/40 hover:text-white/70'}`}
                title="Heading"
              >
                <Type className="w-3 h-3" />
              </button>
              <button
                onClick={() => updateBlockType(block.id, 'quote')}
                className={`p-1 rounded text-xs ${block.type === 'quote' ? 'bg-white/20 text-white' : 'text-white/40 hover:text-white/70'}`}
                title="Quote"
              >
                <Quote className="w-3 h-3" />
              </button>
              <button
                onClick={() => updateBlockType(block.id, 'list')}
                className={`p-1 rounded text-xs ${block.type === 'list' ? 'bg-white/20 text-white' : 'text-white/40 hover:text-white/70'}`}
                title="List"
              >
                <List className="w-3 h-3" />
              </button>
              <div className="w-px h-4 bg-white/10 mx-1" />
              <button
                onClick={() => toggleStyle(block.id, 'bold')}
                className={`p-1 rounded text-xs ${block.style?.bold ? 'bg-white/20 text-white' : 'text-white/40 hover:text-white/70'}`}
                title="Bold"
              >
                <Bold className="w-3 h-3" />
              </button>
              <button
                onClick={() => toggleStyle(block.id, 'italic')}
                className={`p-1 rounded text-xs ${block.style?.italic ? 'bg-white/20 text-white' : 'text-white/40 hover:text-white/70'}`}
                title="Italic"
              >
                <Italic className="w-3 h-3" />
              </button>
              {blocks.length > 1 && (
                <>
                  <div className="w-px h-4 bg-white/10 mx-1" />
                  <button
                    onClick={() => removeBlock(block.id)}
                    className="p-1 rounded text-xs text-red-400/60 hover:text-red-400"
                    title="Remove block"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </>
              )}
            </motion.div>
          )}

          {/* Block content */}
          <div className="relative">
            {block.type === 'list' && (
              <span className="absolute left-1 top-1 text-white/30 text-sm select-none">&#8226;</span>
            )}
            <textarea
              value={block.content}
              onChange={(e) => updateBlock(block.id, e.target.value)}
              onFocus={() => setActiveBlockId(block.id)}
              onKeyDown={(e) => handleKeyDown(e, block.id)}
              placeholder={getBlockPlaceholder(block.type, index)}
              className={getBlockClassName(block)}
              rows={Math.max(1, block.content.split('\n').length)}
              autoFocus={activeBlockId === block.id && block.content === ''}
              style={{ minHeight: '1.75rem' }}
            />
          </div>
        </div>
      ))}

      {/* Add block button */}
      <button
        onClick={() => addBlock('paragraph')}
        className="flex items-center gap-2 px-3 py-2 text-white/30 hover:text-white/60 text-sm transition-colors w-full text-left rounded hover:bg-white/5"
      >
        <Plus className="w-3 h-3" />
        <span>Add block</span>
      </button>
    </div>
  );
};

// ============================================
// SUB-COMPONENT: Emotion Prompts
// ============================================
interface PromptsProps {
  emotion: string;
  onSelectPrompt: (prompt: JournalPrompt) => void;
  currentPrompt?: string;
}

const EmotionPrompts: React.FC<PromptsProps> = ({ emotion, onSelectPrompt, currentPrompt }) => {
  const prompts = useMemo(() => getPromptsForEmotion(emotion), [emotion]);
  const emotionInfo = EMOTION_CATEGORIES.find(e => e.id === emotion);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Lightbulb className="w-4 h-4 text-amber-400/80" />
        <span className="font-mono text-xs uppercase tracking-widest text-white/50">
          Suggested Prompts
          {emotionInfo && (
            <span className="ml-2">{emotionInfo.emoji} {emotionInfo.label}</span>
          )}
        </span>
      </div>
      <div className="space-y-2">
        {prompts.map((prompt) => (
          <button
            key={prompt.id}
            onClick={() => onSelectPrompt(prompt)}
            className={`w-full text-left p-3 rounded-lg border transition-all text-sm ${
              currentPrompt === prompt.text
                ? 'border-white/30 bg-white/10'
                : 'border-white/5 hover:border-white/20 bg-white/[0.02] hover:bg-white/5'
            }`}
          >
            <p className="text-white/80">{prompt.text}</p>
            {prompt.followUp && (
              <p className="text-white/40 text-xs mt-1">{prompt.followUp}</p>
            )}
            <div className="flex items-center gap-2 mt-2">
              <span className={`text-xs px-2 py-0.5 rounded-full border border-white/10 text-white/40`}>
                {prompt.category}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

// ============================================
// SUB-COMPONENT: Tag Selector
// ============================================
interface TagSelectorProps {
  selectedTags: string[];
  customTags: string[];
  onToggleTag: (tagId: string) => void;
  onAddCustomTag: (tag: string) => void;
  onRemoveCustomTag: (tag: string) => void;
  compact?: boolean;
}

const TagSelector: React.FC<TagSelectorProps> = ({
  selectedTags,
  customTags,
  onToggleTag,
  onAddCustomTag,
  onRemoveCustomTag,
  compact = false,
}) => {
  const [showInput, setShowInput] = useState(false);
  const [newTag, setNewTag] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleAddTag = () => {
    const trimmed = newTag.trim().toLowerCase();
    if (trimmed && !customTags.includes(trimmed)) {
      onAddCustomTag(trimmed);
      onToggleTag(trimmed);
    }
    setNewTag('');
    setShowInput(false);
  };

  useEffect(() => {
    if (showInput && inputRef.current) {
      inputRef.current.focus();
    }
  }, [showInput]);

  return (
    <div className="space-y-3">
      {!compact && (
        <div className="flex items-center gap-2">
          <Tag className="w-4 h-4 text-white/50" />
          <span className="font-mono text-xs uppercase tracking-widest text-white/50">
            Tags & Triggers
          </span>
        </div>
      )}

      <div className="flex flex-wrap gap-1.5">
        {JOURNAL_TAGS.map((tag) => (
          <button
            key={tag.id}
            onClick={() => onToggleTag(tag.id)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs transition-all ${
              selectedTags.includes(tag.id)
                ? 'bg-white/15 border border-white/30 text-white'
                : 'bg-white/[0.03] border border-white/10 text-white/50 hover:text-white/80 hover:border-white/20'
            }`}
          >
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: tag.color, opacity: selectedTags.includes(tag.id) ? 1 : 0.5 }}
            />
            {tag.label}
          </button>
        ))}

        {/* Custom tags */}
        {customTags.map((tag) => (
          <button
            key={`custom-${tag}`}
            onClick={() => onToggleTag(tag)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs transition-all ${
              selectedTags.includes(tag)
                ? 'bg-purple-500/20 border border-purple-500/40 text-purple-300'
                : 'bg-white/[0.03] border border-white/10 text-white/50 hover:text-white/80'
            }`}
          >
            <Hash className="w-2.5 h-2.5" />
            {tag}
            <span
              onClick={(e) => { e.stopPropagation(); onRemoveCustomTag(tag); }}
              className="ml-0.5 text-white/30 hover:text-red-400 cursor-pointer"
            >
              x
            </span>
          </button>
        ))}

        {/* Add custom tag */}
        {showInput ? (
          <div className="flex items-center gap-1">
            <input
              ref={inputRef}
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddTag();
                if (e.key === 'Escape') { setShowInput(false); setNewTag(''); }
              }}
              onBlur={() => { if (!newTag.trim()) setShowInput(false); }}
              placeholder="tag name"
              className="bg-white/5 border border-white/20 rounded-full px-3 py-1 text-xs outline-none w-24 text-white"
              maxLength={20}
            />
            <button
              onClick={handleAddTag}
              className="p-1 text-white/50 hover:text-white"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowInput(true)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-white/[0.03] border border-dashed border-white/15 text-white/40 hover:text-white/60 hover:border-white/30 transition-all"
          >
            <Plus className="w-3 h-3" />
            Custom
          </button>
        )}
      </div>
    </div>
  );
};

// ============================================
// SUB-COMPONENT: Journal Entry Card (for history list)
// ============================================
interface EntryCardProps {
  entry: JournalEntry;
  onSelect: () => void;
  onDelete: () => void;
  isActive: boolean;
}

const JournalEntryCard: React.FC<EntryCardProps> = ({ entry, onSelect, onDelete, isActive }) => {
  const emotionInfo = EMOTION_CATEGORIES.find(e => e.id === entry.detectedEmotion);
  const preview = entry.plainText.slice(0, 120) + (entry.plainText.length > 120 ? '...' : '');
  const date = new Date(entry.createdAt);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`group p-4 rounded-xl border cursor-pointer transition-all ${
        isActive
          ? 'border-white/30 bg-white/10'
          : 'border-white/5 hover:border-white/15 bg-white/[0.02] hover:bg-white/[0.05]'
      }`}
      onClick={onSelect}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {entry.linkedVisualization && (
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: entry.linkedVisualization.params.color }}
              />
            )}
            <h4 className="font-display font-bold text-sm truncate">{entry.title}</h4>
          </div>
          <p className="text-xs text-white/40 line-clamp-2 mb-2">{preview || 'Empty entry'}</p>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-white/30 font-mono">
              {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>

            {emotionInfo && (
              <span className="text-xs">{emotionInfo.emoji}</span>
            )}

            {entry.mood && (
              <span className="text-xs">{MOOD_EMOJIS[entry.mood]}</span>
            )}

            {entry.tags.slice(0, 2).map(tagId => {
              const tag = JOURNAL_TAGS.find(t => t.id === tagId);
              return tag ? (
                <span
                  key={tagId}
                  className="text-[10px] px-1.5 py-0.5 rounded-full border border-white/10 text-white/40"
                >
                  {tag.label}
                </span>
              ) : null;
            })}

            {entry.tags.length > 2 && (
              <span className="text-[10px] text-white/30">+{entry.tags.length - 2}</span>
            )}
          </div>
        </div>

        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="p-1.5 text-white/0 group-hover:text-white/30 hover:!text-red-400 transition-colors flex-shrink-0"
          title="Delete entry"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </motion.div>
  );
};

// ============================================
// SUB-COMPONENT: Search & Filter Bar
// ============================================
interface FilterBarProps {
  filter: JournalFilter;
  onFilterChange: (updates: Partial<JournalFilter>) => void;
  onReset: () => void;
  totalResults: number;
}

const FilterBar: React.FC<FilterBarProps> = ({ filter, onFilterChange, onReset, totalResults }) => {
  const [showFilters, setShowFilters] = useState(false);
  const hasActiveFilters = filter.tags.length > 0 || filter.emotions.length > 0 ||
    filter.dateRange.start !== null || filter.hasVisualization !== null;

  return (
    <div className="space-y-3">
      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
        <input
          type="text"
          value={filter.searchQuery}
          onChange={(e) => onFilterChange({ searchQuery: e.target.value })}
          placeholder="Search journal entries..."
          className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-sm outline-none focus:border-white/30 placeholder:text-white/25 text-white"
        />
        {filter.searchQuery && (
          <button
            onClick={() => onFilterChange({ searchQuery: '' })}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Filter toggle & sort */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border transition-colors ${
              hasActiveFilters || showFilters
                ? 'border-white/30 bg-white/10 text-white'
                : 'border-white/10 text-white/50 hover:text-white/80'
            }`}
          >
            <Filter className="w-3 h-3" />
            Filters
            {hasActiveFilters && (
              <span className="ml-1 px-1.5 py-0.5 bg-white/20 rounded-full text-[10px]">
                {filter.tags.length + filter.emotions.length + (filter.hasVisualization !== null ? 1 : 0)}
              </span>
            )}
          </button>

          {hasActiveFilters && (
            <button
              onClick={onReset}
              className="text-xs text-white/40 hover:text-white/60"
            >
              Clear all
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-white/30 font-mono">{totalResults} entries</span>
          <select
            value={filter.sortBy}
            onChange={(e) => onFilterChange({ sortBy: e.target.value as JournalFilter['sortBy'] })}
            className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs outline-none text-white/70"
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="mood-high">Best Mood</option>
            <option value="mood-low">Lowest Mood</option>
          </select>
        </div>
      </div>

      {/* Expanded filters */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="space-y-4 pt-2 pb-1">
              {/* Emotion filter */}
              <div>
                <span className="text-xs text-white/40 font-mono uppercase tracking-widest mb-2 block">Emotions</span>
                <div className="flex flex-wrap gap-1.5">
                  {EMOTION_CATEGORIES.map((em) => (
                    <button
                      key={em.id}
                      onClick={() => {
                        const emotions = filter.emotions.includes(em.id)
                          ? filter.emotions.filter(e => e !== em.id)
                          : [...filter.emotions, em.id];
                        onFilterChange({ emotions });
                      }}
                      className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs transition-all ${
                        filter.emotions.includes(em.id)
                          ? 'bg-white/15 border border-white/30 text-white'
                          : 'bg-white/[0.03] border border-white/10 text-white/40 hover:text-white/60'
                      }`}
                    >
                      <span>{em.emoji}</span>
                      <span>{em.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Tag filter */}
              <div>
                <span className="text-xs text-white/40 font-mono uppercase tracking-widest mb-2 block">Tags</span>
                <div className="flex flex-wrap gap-1.5">
                  {JOURNAL_TAGS.map((tag) => (
                    <button
                      key={tag.id}
                      onClick={() => {
                        const tags = filter.tags.includes(tag.id)
                          ? filter.tags.filter(t => t !== tag.id)
                          : [...filter.tags, tag.id];
                        onFilterChange({ tags });
                      }}
                      className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs transition-all ${
                        filter.tags.includes(tag.id)
                          ? 'bg-white/15 border border-white/30 text-white'
                          : 'bg-white/[0.03] border border-white/10 text-white/40 hover:text-white/60'
                      }`}
                    >
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: tag.color, opacity: 0.7 }} />
                      {tag.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Visualization filter */}
              <div>
                <span className="text-xs text-white/40 font-mono uppercase tracking-widest mb-2 block">Visualization</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => onFilterChange({ hasVisualization: filter.hasVisualization === true ? null : true })}
                    className={`px-3 py-1.5 rounded-lg text-xs border transition-all ${
                      filter.hasVisualization === true
                        ? 'border-white/30 bg-white/10 text-white'
                        : 'border-white/10 text-white/40 hover:text-white/60'
                    }`}
                  >
                    With visualization
                  </button>
                  <button
                    onClick={() => onFilterChange({ hasVisualization: filter.hasVisualization === false ? null : false })}
                    className={`px-3 py-1.5 rounded-lg text-xs border transition-all ${
                      filter.hasVisualization === false
                        ? 'border-white/30 bg-white/10 text-white'
                        : 'border-white/10 text-white/40 hover:text-white/60'
                    }`}
                  >
                    Text only
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ============================================
// MAIN COMPONENT: Journal
// ============================================
type JournalView = 'list' | 'editor' | 'read';

export const Journal: React.FC<JournalProps> = ({
  isOpen,
  onClose,
  currentParams,
  currentInput,
  onLoadVisualization,
}) => {
  const {
    entries, addEntry, updateEntry, removeEntry,
    activeEntryId, setActiveEntry,
    filter, setFilter, resetFilter, getFilteredEntries,
    customTags, addCustomTag, removeCustomTag,
  } = useJournalStore();

  const { recordJournalEntry, recordTemplateUsed } = useGamificationStore();

  const [view, setView] = useState<JournalView>('list');
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const [title, setTitle] = useState('');
  const [blocks, setBlocks] = useState<TextBlock[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [entryCustomTags, setEntryCustomTags] = useState<string[]>([]);
  const [mood, setMood] = useState<number>(0);
  const [selectedPrompt, setSelectedPrompt] = useState<string>('');
  const [linkVisualization, setLinkVisualization] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [isTemplatesOpen, setTemplatesOpen] = useState(false);

  // Detect emotion from current visualization
  const detectedEmotion = useMemo(
    () => detectEmotion(currentInput, currentParams),
    [currentInput, currentParams]
  );

  // Get filtered entries
  const filteredEntries = useMemo(() => getFilteredEntries(), [entries, filter]);

  // Reset editor state
  const resetEditor = useCallback(() => {
    setTitle('');
    setBlocks([{ id: '1', type: 'paragraph', content: '' }]);
    setSelectedTags([]);
    setEntryCustomTags([]);
    setMood(0);
    setSelectedPrompt('');
    setEditingEntry(null);
    setLinkVisualization(true);
  }, []);

  // Start new entry
  const startNewEntry = useCallback(() => {
    resetEditor();
    setView('editor');
  }, [resetEditor]);

  // Edit existing entry
  const startEditEntry = useCallback((entry: JournalEntry) => {
    setEditingEntry(entry);
    setTitle(entry.title);
    setBlocks(entry.blocks.length > 0 ? entry.blocks : [{ id: '1', type: 'paragraph', content: '' }]);
    setSelectedTags(entry.tags);
    setEntryCustomTags(entry.customTags);
    setMood(entry.mood || 0);
    setSelectedPrompt(entry.promptUsed || '');
    setLinkVisualization(!!entry.linkedVisualization);
    setView('editor');
  }, []);

  // View entry (read-only)
  const viewEntry = useCallback((entry: JournalEntry) => {
    setEditingEntry(entry);
    setActiveEntry(entry.id);
    setView('read');
  }, [setActiveEntry]);

  // Save entry
  const saveEntry = useCallback(() => {
    const plainText = blocks.map(b => b.content).join('\n').trim();
    if (!title.trim() && !plainText) return;

    const entryData: JournalEntry = {
      id: editingEntry?.id || Date.now().toString(),
      title: title.trim() || 'Untitled Entry',
      blocks: blocks.filter(b => b.content.trim()),
      plainText,
      tags: selectedTags,
      customTags: entryCustomTags,
      detectedEmotion: detectedEmotion !== 'default' ? detectedEmotion : editingEntry?.detectedEmotion,
      promptUsed: selectedPrompt || undefined,
      linkedVisualization: linkVisualization && currentParams && currentParams.phrase !== 'Waiting for Input'
        ? { input: currentInput || '', params: currentParams }
        : editingEntry?.linkedVisualization,
      mood: mood > 0 ? mood : undefined,
      createdAt: editingEntry?.createdAt || Date.now(),
      updatedAt: Date.now(),
    };

    if (editingEntry) {
      updateEntry(editingEntry.id, entryData);
    } else {
      addEntry(entryData);
      recordJournalEntry();
    }

    // Register custom tags globally
    entryCustomTags.forEach(tag => addCustomTag(tag));

    resetEditor();
    setView('list');
  }, [title, blocks, selectedTags, entryCustomTags, mood, selectedPrompt,
    linkVisualization, currentParams, currentInput, detectedEmotion,
    editingEntry, addEntry, updateEntry, addCustomTag, resetEditor, recordJournalEntry]);

  // Handle prompt selection
  const handleSelectPrompt = useCallback((prompt: JournalPrompt) => {
    setSelectedPrompt(prompt.text);
    // If title is empty, use a short version of the prompt
    if (!title.trim()) {
      const shortTitle = prompt.text.split('?')[0].split('.')[0].trim();
      setTitle(shortTitle.length > 50 ? shortTitle.slice(0, 50) + '...' : shortTitle);
    }
    // If blocks are empty, pre-fill with the prompt
    if (blocks.length <= 1 && blocks[0]?.content === '') {
      setBlocks([
        { id: '1', type: 'quote', content: prompt.text },
        { id: '2', type: 'paragraph', content: '' },
      ]);
    }
  }, [title, blocks]);

  // Toggle tag
  const handleToggleTag = useCallback((tagId: string) => {
    // Check if it's a predefined tag or custom
    const isPredefined = JOURNAL_TAGS.some(t => t.id === tagId);
    if (isPredefined) {
      setSelectedTags(prev =>
        prev.includes(tagId) ? prev.filter(t => t !== tagId) : [...prev, tagId]
      );
    } else {
      setEntryCustomTags(prev =>
        prev.includes(tagId) ? prev.filter(t => t !== tagId) : [...prev, tagId]
      );
    }
  }, []);

  // Delete entry
  const handleDelete = useCallback((id: string) => {
    if (confirmDelete === id) {
      removeEntry(id);
      setConfirmDelete(null);
      if (editingEntry?.id === id) {
        resetEditor();
        setView('list');
      }
    } else {
      setConfirmDelete(id);
      setTimeout(() => setConfirmDelete(null), 3000);
    }
  }, [confirmDelete, removeEntry, editingEntry, resetEditor]);

  // Handle template selection
  const handleTemplateSelect = useCallback((template: JournalTemplate) => {
    // Set title from template name
    setTitle(template.name);
    // Set blocks from template, with fresh IDs
    setBlocks(template.blocks.map((block, i) => ({
      ...block,
      id: Date.now().toString() + '-' + i + '-' + Math.random().toString(36).slice(2, 6),
    })));
    // Set tags from template
    setSelectedTags(template.tags || []);
    // Record template usage for gamification
    recordTemplateUsed();
    // Switch to editor view
    setView('editor');
    setTemplatesOpen(false);
  }, [recordTemplateUsed]);

  // Navigate back
  const goBack = useCallback(() => {
    if (view === 'editor' || view === 'read') {
      resetEditor();
      setView('list');
    } else {
      onClose();
    }
  }, [view, resetEditor, onClose]);

  // Reset on close
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        resetEditor();
        setView('list');
      }, 300);
    }
  }, [isOpen, resetEditor]);

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
            transition={{ duration: 0.3 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-3xl mx-4 max-h-[90vh] bg-[#0a0a0a] border border-white/10 rounded-2xl overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-white/10 flex-shrink-0">
              <div className="flex items-center gap-3">
                {view !== 'list' && (
                  <button
                    onClick={goBack}
                    className="p-1.5 text-white/50 hover:text-white transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                )}
                <BookOpen className="w-5 h-5" />
                <h2 className="font-display text-lg font-bold">
                  {view === 'list' && 'Journal'}
                  {view === 'editor' && (editingEntry ? 'Edit Entry' : 'New Entry')}
                  {view === 'read' && 'Journal Entry'}
                </h2>
              </div>
              <div className="flex items-center gap-2">
                {view === 'list' && (
                  <>
                    <button
                      onClick={() => setTemplatesOpen(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/15 border border-white/10 rounded-lg text-sm transition-colors text-white/70 hover:text-white"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      Templates
                    </button>
                    <button
                      onClick={startNewEntry}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-sm transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      New Entry
                    </button>
                  </>
                )}
                {view === 'editor' && (
                  <button
                    onClick={saveEntry}
                    disabled={!title.trim() && blocks.every(b => !b.content.trim())}
                    className="flex items-center gap-1.5 px-4 py-1.5 bg-white text-black font-medium rounded-lg text-sm hover:bg-white/90 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <Save className="w-3.5 h-3.5" />
                    Save
                  </button>
                )}
                {view === 'read' && editingEntry && (
                  <button
                    onClick={() => startEditEntry(editingEntry)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-sm transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    Edit
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="p-2 text-white/60 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              <AnimatePresence mode="wait">
                {/* ============ LIST VIEW ============ */}
                {view === 'list' && (
                  <motion.div
                    key="list"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="p-5 space-y-4"
                  >
                    {/* Visualization link prompt */}
                    {currentParams && currentParams.phrase !== 'Waiting for Input' && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 rounded-xl border border-white/10 bg-white/[0.03]"
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <div
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: currentParams.color }}
                          />
                          <span className="text-sm text-white/70">
                            Current: <strong>{currentParams.phrase}</strong>
                          </span>
                        </div>
                        <button
                          onClick={startNewEntry}
                          className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/15 rounded-lg text-sm transition-colors w-full justify-center"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          Write about this emotion
                        </button>
                      </motion.div>
                    )}

                    {/* Search & Filters */}
                    <FilterBar
                      filter={filter}
                      onFilterChange={setFilter}
                      onReset={resetFilter}
                      totalResults={filteredEntries.length}
                    />

                    {/* Entries list */}
                    <div className="space-y-2">
                      {filteredEntries.length === 0 ? (
                        <div className="text-center py-16">
                          <BookOpen className="w-12 h-12 text-white/10 mx-auto mb-4" />
                          <h3 className="font-display text-lg font-bold text-white/30 mb-2">
                            {entries.length === 0 ? 'No journal entries yet' : 'No matching entries'}
                          </h3>
                          <p className="text-sm text-white/20 mb-6 max-w-sm mx-auto">
                            {entries.length === 0
                              ? 'Start journaling to capture your emotional journey alongside your visualizations.'
                              : 'Try adjusting your filters or search query.'}
                          </p>
                          {entries.length === 0 && (
                            <button
                              onClick={startNewEntry}
                              className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/15 rounded-lg text-sm transition-colors"
                            >
                              <Plus className="w-4 h-4" />
                              Write your first entry
                            </button>
                          )}
                        </div>
                      ) : (
                        <AnimatePresence>
                          {filteredEntries.map((entry) => (
                            <JournalEntryCard
                              key={entry.id}
                              entry={entry}
                              onSelect={() => viewEntry(entry)}
                              onDelete={() => handleDelete(entry.id)}
                              isActive={activeEntryId === entry.id}
                            />
                          ))}
                        </AnimatePresence>
                      )}
                    </div>
                  </motion.div>
                )}

                {/* ============ EDITOR VIEW ============ */}
                {view === 'editor' && (
                  <motion.div
                    key="editor"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="p-5 space-y-5"
                  >
                    {/* Linked visualization indicator */}
                    {currentParams && currentParams.phrase !== 'Waiting for Input' && (
                      <div className="flex items-center justify-between p-3 rounded-lg border border-white/10 bg-white/[0.03]">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: currentParams.color }}
                          />
                          <span className="text-sm text-white/60">
                            Link to <strong className="text-white/80">{currentParams.phrase}</strong>
                          </span>
                        </div>
                        <button
                          onClick={() => setLinkVisualization(!linkVisualization)}
                          className={`px-2.5 py-1 rounded text-xs border transition-colors ${
                            linkVisualization
                              ? 'border-white/30 bg-white/10 text-white'
                              : 'border-white/10 text-white/40'
                          }`}
                        >
                          {linkVisualization ? 'Linked' : 'Unlinked'}
                        </button>
                      </div>
                    )}

                    {/* Title */}
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Entry title..."
                      className="w-full bg-transparent font-display text-2xl font-bold outline-none placeholder:text-white/15 text-white"
                      autoFocus
                    />

                    {/* Mood selector */}
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-white/40 font-mono uppercase tracking-widest">Mood</span>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((value) => (
                          <button
                            key={value}
                            onClick={() => setMood(mood === value ? 0 : value)}
                            className={`text-lg transition-transform hover:scale-110 ${
                              mood === value ? 'scale-125' : 'opacity-30 hover:opacity-60'
                            }`}
                          >
                            {MOOD_EMOJIS[value]}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Emotion prompts */}
                    <EmotionPrompts
                      emotion={detectedEmotion}
                      onSelectPrompt={handleSelectPrompt}
                      currentPrompt={selectedPrompt}
                    />

                    {/* Rich text editor */}
                    <div className="min-h-[200px] p-4 rounded-xl border border-white/10 bg-white/[0.02]">
                      <RichTextEditor blocks={blocks} onChange={setBlocks} />
                    </div>

                    {/* Tags */}
                    <TagSelector
                      selectedTags={[...selectedTags, ...entryCustomTags]}
                      customTags={customTags}
                      onToggleTag={handleToggleTag}
                      onAddCustomTag={(tag) => {
                        addCustomTag(tag);
                        setEntryCustomTags(prev =>
                          prev.includes(tag) ? prev : [...prev, tag]
                        );
                      }}
                      onRemoveCustomTag={removeCustomTag}
                    />
                  </motion.div>
                )}

                {/* ============ READ VIEW ============ */}
                {view === 'read' && editingEntry && (
                  <motion.div
                    key="read"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="p-5 space-y-5"
                  >
                    {/* Linked visualization */}
                    {editingEntry.linkedVisualization && (
                      <div
                        className="p-4 rounded-xl border border-white/10 cursor-pointer hover:border-white/20 transition-colors"
                        onClick={() => {
                          if (editingEntry.linkedVisualization && onLoadVisualization) {
                            onLoadVisualization(editingEntry.linkedVisualization.params);
                          }
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-6 h-6 rounded-full"
                            style={{ backgroundColor: editingEntry.linkedVisualization.params.color }}
                          />
                          <div>
                            <p className="font-display font-bold text-sm">
                              {editingEntry.linkedVisualization.params.phrase}
                            </p>
                            <p className="text-xs text-white/40">
                              {editingEntry.linkedVisualization.params.explanation}
                            </p>
                          </div>
                          <Palette className="w-4 h-4 text-white/30 ml-auto" />
                        </div>
                      </div>
                    )}

                    {/* Title & meta */}
                    <div>
                      <h2 className="font-display text-2xl font-bold mb-2">{editingEntry.title}</h2>
                      <div className="flex items-center gap-3 text-xs text-white/40">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(editingEntry.createdAt).toLocaleDateString('en-US', {
                            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
                          })}
                        </span>
                        {editingEntry.mood && (
                          <span>{MOOD_EMOJIS[editingEntry.mood]}</span>
                        )}
                        {editingEntry.detectedEmotion && (
                          <span className="flex items-center gap-1">
                            {EMOTION_CATEGORIES.find(e => e.id === editingEntry.detectedEmotion)?.emoji}
                            {EMOTION_CATEGORIES.find(e => e.id === editingEntry.detectedEmotion)?.label}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Prompt used */}
                    {editingEntry.promptUsed && (
                      <div className="p-3 rounded-lg border-l-2 border-amber-500/30 bg-amber-500/5">
                        <p className="text-xs text-white/40 font-mono uppercase tracking-widest mb-1">Prompt</p>
                        <p className="text-sm text-white/70 italic">{editingEntry.promptUsed}</p>
                      </div>
                    )}

                    {/* Content blocks */}
                    <div className="space-y-3">
                      {editingEntry.blocks.map((block) => {
                        const styleClasses = [
                          block.style?.bold ? 'font-bold' : '',
                          block.style?.italic ? 'italic' : '',
                        ].filter(Boolean).join(' ');

                        switch (block.type) {
                          case 'heading':
                            return (
                              <h3 key={block.id} className={`font-display text-xl font-bold ${styleClasses}`}>
                                {block.content}
                              </h3>
                            );
                          case 'quote':
                            return (
                              <blockquote key={block.id} className={`border-l-2 border-white/30 pl-4 italic text-white/70 ${styleClasses}`}>
                                {block.content}
                              </blockquote>
                            );
                          case 'list':
                            return (
                              <div key={block.id} className={`pl-6 flex gap-2 ${styleClasses}`}>
                                <span className="text-white/30">&#8226;</span>
                                <span>{block.content}</span>
                              </div>
                            );
                          default:
                            return (
                              <p key={block.id} className={`leading-relaxed text-white/80 ${styleClasses}`}>
                                {block.content}
                              </p>
                            );
                        }
                      })}
                    </div>

                    {/* Tags */}
                    {(editingEntry.tags.length > 0 || editingEntry.customTags.length > 0) && (
                      <div className="flex flex-wrap gap-1.5 pt-4 border-t border-white/10">
                        {editingEntry.tags.map(tagId => {
                          const tag = JOURNAL_TAGS.find(t => t.id === tagId);
                          return tag ? (
                            <span
                              key={tagId}
                              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs bg-white/5 border border-white/10 text-white/60"
                            >
                              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: tag.color }} />
                              {tag.label}
                            </span>
                          ) : null;
                        })}
                        {editingEntry.customTags.map(tag => (
                          <span
                            key={`custom-${tag}`}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-purple-500/10 border border-purple-500/20 text-purple-300/70"
                          >
                            <Hash className="w-2.5 h-2.5" />
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Journal Templates Modal */}
      <JournalTemplates
        isOpen={isTemplatesOpen}
        onClose={() => setTemplatesOpen(false)}
        onSelectTemplate={handleTemplateSelect}
      />
    </AnimatePresence>
  );
};

export default Journal;
