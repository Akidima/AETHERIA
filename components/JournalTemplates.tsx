// Journal Templates Component
// Template browser with category filtering and template selection
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, FileText, Heart, Brain, Eye, Leaf, ChevronRight, Sparkles
} from 'lucide-react';
import { JournalTemplate, JOURNAL_TEMPLATES, TextBlock } from '../types';

// ============================================
// PROPS
// ============================================
interface JournalTemplatesProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (template: JournalTemplate) => void;
}

// ============================================
// CATEGORY CONFIG
// ============================================
const CATEGORY_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string; description: string }> = {
  gratitude: {
    label: 'Gratitude',
    icon: <Heart className="w-4 h-4" />,
    color: '#10B981',
    description: 'Cultivate appreciation and thankfulness',
  },
  cbt: {
    label: 'CBT Exercises',
    icon: <Brain className="w-4 h-4" />,
    color: '#8B5CF6',
    description: 'Cognitive behavioral therapy techniques',
  },
  reflection: {
    label: 'Reflection',
    icon: <Eye className="w-4 h-4" />,
    color: '#3B82F6',
    description: 'Review and process your experiences',
  },
  mindfulness: {
    label: 'Mindfulness',
    icon: <Leaf className="w-4 h-4" />,
    color: '#06B6D4',
    description: 'Present-moment awareness exercises',
  },
};

type CategoryFilter = 'all' | 'gratitude' | 'cbt' | 'reflection' | 'mindfulness';

// ============================================
// SUB-COMPONENT: Template Card
// ============================================
const TemplateCard: React.FC<{
  template: JournalTemplate;
  onSelect: () => void;
}> = ({ template, onSelect }) => {
  const [showPreview, setShowPreview] = useState(false);
  const catConfig = CATEGORY_CONFIG[template.category];
  const headingCount = template.blocks.filter(b => b.type === 'heading').length;
  const blockCount = template.blocks.length;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="p-4 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/15 transition-all"
    >
      <div className="flex items-start gap-3">
        <span className="text-2xl flex-shrink-0">{template.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-sm font-bold text-white/90">{template.name}</h4>
            <span
              className="text-[10px] px-1.5 py-0.5 rounded-full border"
              style={{
                borderColor: `${catConfig?.color || '#fff'}40`,
                color: catConfig?.color || '#fff',
              }}
            >
              {catConfig?.label || template.category}
            </span>
          </div>
          <p className="text-xs text-white/40 mb-3">{template.description}</p>

          {/* Template preview */}
          <AnimatePresence>
            {showPreview && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden mb-3"
              >
                <div className="p-3 rounded-lg bg-white/5 border border-white/5 space-y-1.5">
                  {template.blocks.map((block, i) => {
                    switch (block.type) {
                      case 'heading':
                        return (
                          <p key={block.id} className="text-xs font-bold text-white/60">
                            {block.content || `Section ${i + 1}`}
                          </p>
                        );
                      case 'quote':
                        return (
                          <p key={block.id} className="text-[10px] italic text-white/30 border-l border-white/10 pl-2">
                            {block.content || 'Guided prompt...'}
                          </p>
                        );
                      case 'list':
                        return (
                          <p key={block.id} className="text-[10px] text-white/25 pl-3">
                            {block.content ? `• ${block.content}` : '• List item...'}
                          </p>
                        );
                      default:
                        return (
                          <p key={block.id} className="text-[10px] text-white/20">
                            {block.content || 'Your thoughts...'}
                          </p>
                        );
                    }
                  })}

                  {/* Prompt Questions */}
                  {template.promptQuestions && template.promptQuestions.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-white/5">
                      <p className="text-[10px] font-mono uppercase tracking-widest text-white/25 mb-1">
                        Guiding Questions
                      </p>
                      {template.promptQuestions.map((q, i) => (
                        <p key={i} className="text-[10px] text-white/30 italic">
                          {q}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="text-[10px] text-white/30 hover:text-white/50 transition-colors"
            >
              {showPreview ? 'Hide preview' : 'Preview'}
            </button>
            <span className="text-white/10">|</span>
            <span className="text-[10px] text-white/20 font-mono">
              {headingCount} sections, {blockCount} blocks
            </span>
            <div className="flex-1" />
            <button
              onClick={onSelect}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-xs font-medium transition-colors"
            >
              <Sparkles className="w-3 h-3" />
              Use Template
            </button>
          </div>

          {/* Tags */}
          {template.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {template.tags.map(tag => (
                <span
                  key={tag}
                  className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/5 border border-white/5 text-white/25"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================
export const JournalTemplates: React.FC<JournalTemplatesProps> = ({
  isOpen,
  onClose,
  onSelectTemplate,
}) => {
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');

  const filteredTemplates = useMemo(() => {
    if (categoryFilter === 'all') return JOURNAL_TEMPLATES;
    return JOURNAL_TEMPLATES.filter(t => t.category === categoryFilter);
  }, [categoryFilter]);

  const handleSelect = (template: JournalTemplate) => {
    onSelectTemplate(template);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[210] flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-xl mx-4 max-h-[80vh] overflow-hidden bg-[#0a0a0a] border border-white/10 rounded-2xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-white/10 flex-shrink-0">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5" />
                <h2 className="font-display text-lg font-bold">Journal Templates</h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-white/60 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Category Filter */}
            <div className="px-5 py-3 border-b border-white/5 flex-shrink-0">
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => setCategoryFilter('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs border transition-colors ${
                    categoryFilter === 'all'
                      ? 'border-white/30 bg-white/10 text-white'
                      : 'border-white/10 text-white/40 hover:text-white/60'
                  }`}
                >
                  All ({JOURNAL_TEMPLATES.length})
                </button>
                {(Object.entries(CATEGORY_CONFIG) as [CategoryFilter, typeof CATEGORY_CONFIG[string]][]).map(([key, config]) => {
                  const count = JOURNAL_TEMPLATES.filter(t => t.category === key).length;
                  return (
                    <button
                      key={key}
                      onClick={() => setCategoryFilter(categoryFilter === key ? 'all' : key)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border transition-colors ${
                        categoryFilter === key
                          ? 'bg-white/10 text-white'
                          : 'border-white/10 text-white/40 hover:text-white/60'
                      }`}
                      style={{
                        borderColor: categoryFilter === key ? `${config.color}50` : undefined,
                      }}
                    >
                      {config.icon}
                      {config.label} ({count})
                    </button>
                  );
                })}
              </div>

              {/* Category description */}
              {categoryFilter !== 'all' && CATEGORY_CONFIG[categoryFilter] && (
                <p className="text-[10px] text-white/30 mt-2">
                  {CATEGORY_CONFIG[categoryFilter].description}
                </p>
              )}
            </div>

            {/* Template List */}
            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              <AnimatePresence>
                {filteredTemplates.map(template => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    onSelect={() => handleSelect(template)}
                  />
                ))}
              </AnimatePresence>

              {filteredTemplates.length === 0 && (
                <div className="text-center py-8">
                  <FileText className="w-8 h-8 mx-auto mb-2 opacity-20" />
                  <p className="text-sm text-white/30">No templates in this category.</p>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default JournalTemplates;
