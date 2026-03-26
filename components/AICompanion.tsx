import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Send, MessageCircle, Plus, Trash2, Settings,
  Sparkles, Heart, RefreshCw, ChevronLeft, Bot, User,
  Palette, History, Brain, Smile,
} from 'lucide-react';
import { useCompanionStore } from '../store/useStore';
import { chatWithCompanion, CompanionResponse } from '../services/aiService';
import { VisualParams, ChatMessage, ConversationMode } from '../types';

// ============================================================================
// Types
// ============================================================================

interface AICompanionProps {
  isOpen: boolean;
  onClose: () => void;
  onParamsChange?: (params: VisualParams) => void;
  currentParams?: VisualParams;
}

// ============================================================================
// Constants
// ============================================================================

const CONVERSATION_STARTERS = [
  { label: 'Mood check ✨', icon: Smile, mode: 'check-in' as ConversationMode, message: "Can we do a quick mood check?" },
  { label: 'Reframe spiral', icon: RefreshCw, mode: 'reframe' as ConversationMode, message: "Help me reframe this thought spiral." },
  { label: 'Locked-in goals', icon: Brain, mode: 'coaching' as ConversationMode, message: "Help me set grounded emotional goals." },
  { label: 'Just vibe', icon: MessageCircle, mode: 'chat' as ConversationMode, message: "I just need to talk." },
];

const PERSONALITY_OPTIONS = [
  { value: 'empathetic', label: 'Soft Bestie', desc: 'Warm + validating' },
  { value: 'coaching', label: 'Locked In', desc: 'Action-forward' },
  { value: 'reflective', label: 'Deep Thinker', desc: 'Thoughtful + curious' },
  { value: 'playful', label: 'Chaotic Good', desc: 'Light + kind' },
];

const MODE_LABELS: Record<ConversationMode, string> = {
  'chat': 'Vibe Chat',
  'check-in': 'Mood Check',
  'reframe': 'Reframe Loop',
  'coaching': 'Goal Mode',
};

// ============================================================================
// Component
// ============================================================================

export const AICompanion: React.FC<AICompanionProps> = ({
  isOpen,
  onClose,
  onParamsChange,
  currentParams,
}) => {
  const {
    conversations,
    activeConversationId,
    settings,
    isTyping,
    createConversation,
    setActiveConversation,
    addMessage,
    updateConversationTitle,
    deleteConversation,
    getActiveConversation,
    getRecentSummary,
    setTyping,
    updateSettings,
  } = useCompanionStore();

  const [inputText, setInputText] = useState('');
  const [currentMode, setCurrentMode] = useState<ConversationMode>('chat');
  const [showHistory, setShowHistory] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [view, setView] = useState<'welcome' | 'chat'>('welcome');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const activeConversation = getActiveConversation();
  const activePersonality = PERSONALITY_OPTIONS.find((opt) => opt.value === settings.personality);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeConversation?.messages?.length, isTyping]);

  // When modal opens, determine view
  useEffect(() => {
    if (isOpen) {
      if (activeConversation && activeConversation.messages.length > 0) {
        setView('chat');
      } else {
        setView('welcome');
      }
    }
  }, [isOpen, activeConversationId]);

  // Focus input when switching to chat
  useEffect(() => {
    if (view === 'chat' && isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [view, isOpen]);

  // ---- Handlers ----

  const handleStartConversation = useCallback((starter: typeof CONVERSATION_STARTERS[0]) => {
    setCurrentMode(starter.mode);
    const convId = createConversation(starter.label);
    setView('chat');

    // Send the starter message automatically
    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: starter.message,
      timestamp: Date.now(),
    };
    addMessage(convId, userMsg);

    // Get AI response
    sendToAI(convId, [{ role: 'user', content: starter.message }]);
  }, [createConversation, addMessage, currentMode]);

  const handleNewConversation = useCallback(() => {
    setCurrentMode('chat');
    setView('welcome');
    setActiveConversation(null);
    setShowHistory(false);
  }, [setActiveConversation]);

  const handleSelectConversation = useCallback((convId: string) => {
    setActiveConversation(convId);
    setView('chat');
    setShowHistory(false);
  }, [setActiveConversation]);

  const handleDeleteConversation = useCallback((e: React.MouseEvent, convId: string) => {
    e.stopPropagation();
    deleteConversation(convId);
    if (activeConversationId === convId) {
      setView('welcome');
    }
  }, [deleteConversation, activeConversationId]);

  const sendToAI = useCallback(async (
    convId: string,
    messagesToSend: Array<{ role: string; content: string }>
  ) => {
    setTyping(true);
    try {
      const memorySummary = settings.enableMemory ? getRecentSummary() : '';
      const response: CompanionResponse = await chatWithCompanion(
        messagesToSend,
        settings.personality,
        memorySummary,
        currentMode
      );

      const assistantMsg: ChatMessage = {
        id: `msg-${Date.now()}-ai`,
        role: 'assistant',
        content: response.reply,
        timestamp: Date.now(),
        sentiment: response.sentiment,
        visualParams: response.suggestVisual
          ? {
              color: response.suggestVisual.color,
              speed: response.suggestVisual.speed,
              distort: response.suggestVisual.distort,
              phrase: response.suggestVisual.phrase,
              explanation: `Reflecting: ${response.sentiment}`,
            }
          : undefined,
      };

      addMessage(convId, assistantMsg);

      // Auto-title from first assistant response
      const conv = useCompanionStore.getState().conversations.find((c) => c.id === convId);
      if (conv && conv.messages.length <= 2 && conv.title === 'New conversation') {
        const title = response.sentiment
          ? `${response.sentiment.charAt(0).toUpperCase() + response.sentiment.slice(1)} conversation`
          : 'Conversation';
        updateConversationTitle(convId, title);
      }

      // Sync visualization if enabled
      if (settings.enableVisualization && response.suggestVisual && onParamsChange) {
        onParamsChange({
          color: response.suggestVisual.color,
          speed: response.suggestVisual.speed,
          distort: response.suggestVisual.distort,
          phrase: response.suggestVisual.phrase,
          explanation: `AI Companion: ${response.sentiment}`,
          advice: response.reply,
        });
      }
    } catch (err) {
      console.error('AI Companion error:', err);
      const errorMsg: ChatMessage = {
        id: `msg-${Date.now()}-err`,
        role: 'assistant',
        content: "I'm having trouble connecting right now. Please try again in a moment.",
        timestamp: Date.now(),
      };
      addMessage(convId, errorMsg);
    } finally {
      setTyping(false);
    }
  }, [settings, currentMode, addMessage, updateConversationTitle, onParamsChange, getRecentSummary, setTyping]);

  const handleSend = useCallback(async () => {
    if (!inputText.trim()) return;

    let convId = activeConversationId;
    if (!convId) {
      convId = createConversation();
      setView('chat');
    }

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: inputText.trim(),
      timestamp: Date.now(),
    };
    addMessage(convId, userMsg);
    setInputText('');

    // Build messages array from conversation for context
    const conv = useCompanionStore.getState().conversations.find((c) => c.id === convId);
    const contextMessages = (conv?.messages || [])
      .filter((m) => m.role !== 'system')
      .slice(-10) // Keep last 10 messages for context window
      .map((m) => ({ role: m.role, content: m.content }));
    contextMessages.push({ role: 'user', content: inputText.trim() });

    await sendToAI(convId, contextMessages);
  }, [inputText, activeConversationId, createConversation, addMessage, sendToAI]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  const handleApplyVisual = useCallback((params: VisualParams) => {
    if (onParamsChange) onParamsChange(params);
  }, [onParamsChange]);

  // ---- Render helpers ----

  const renderWelcomeView = () => (
    <div className="relative flex flex-col items-center justify-center h-full px-6 py-8 space-y-6 overflow-hidden">
      <div className="pointer-events-none absolute -top-24 -left-20 w-56 h-56 rounded-full bg-violet-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-20 w-56 h-56 rounded-full bg-cyan-500/10 blur-3xl" />

      {/* Header */}
      <div className="relative text-center space-y-2">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-violet-500/30 via-fuchsia-500/20 to-cyan-500/30 border border-white/15 flex items-center justify-center mb-4 shadow-[0_0_35px_rgba(139,92,246,0.25)]">
          <Bot className="w-8 h-8 text-violet-300" />
        </div>
        <h3 className="font-display text-2xl text-white">Aetheria Chat</h3>
        <p className="text-sm text-white/60 max-w-xs">
          Spill your thoughts, unpack feelings, and get grounded support — one message at a time.
        </p>
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-violet-400/25 bg-violet-500/10 text-[10px] text-violet-200 font-mono uppercase tracking-widest">
          <Heart className="w-3 h-3" /> therapist mode
        </span>
      </div>

      {/* Conversation Starters */}
      <div className="relative grid grid-cols-2 gap-3 w-full max-w-sm">
        {CONVERSATION_STARTERS.map((starter) => (
          <button
            key={starter.label}
            onClick={() => handleStartConversation(starter)}
            className="flex flex-col items-center gap-2 p-4 rounded-2xl border border-white/10 hover:border-violet-400/40 bg-white/[0.03] hover:bg-white/[0.06] transition-all text-center group hover:-translate-y-0.5"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500/20 to-cyan-500/20 border border-white/10 flex items-center justify-center">
              <starter.icon className="w-4 h-4 text-white/70 group-hover:text-violet-300 transition-colors" />
            </div>
            <span className="text-xs text-white/80 group-hover:text-white transition-colors">{starter.label}</span>
          </button>
        ))}
      </div>

      {/* Or type directly */}
      <div className="w-full max-w-sm space-y-2">
        <div className="relative">
          <input
            ref={inputRef}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="or type your lore..."
            className="w-full px-4 py-3 pr-12 bg-white/[0.04] border border-white/15 rounded-2xl text-sm text-white placeholder-white/35 focus:outline-none focus:border-violet-500/50 transition-colors"
          />
          <button
            onClick={handleSend}
            disabled={!inputText.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-xl bg-gradient-to-br from-violet-500/40 to-fuchsia-500/40 hover:from-violet-500/50 hover:to-fuchsia-500/50 disabled:opacity-30 transition-colors"
            title="Send"
          >
            <Send className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>

      {/* Past conversations count */}
      {conversations.length > 0 && (
        <button
          onClick={() => setShowHistory(true)}
          className="text-xs text-white/55 hover:text-white/80 transition-colors flex items-center gap-1 px-2 py-1 rounded-full border border-white/10 bg-white/[0.03]"
        >
          <History className="w-3 h-3" />
          {conversations.length} saved chat{conversations.length !== 1 ? 's' : ''}
        </button>
      )}
    </div>
  );

  const renderChatView = () => (
    <div className="relative flex flex-col h-full">
      <div className="pointer-events-none absolute -top-20 right-0 w-44 h-44 rounded-full bg-violet-500/10 blur-3xl" />

      {/* Chat header */}
      <div className="relative flex items-center justify-between px-4 py-3 border-b border-white/10 bg-black/20 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <button
            onClick={handleNewConversation}
            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
            title="New conversation"
          >
            <ChevronLeft className="w-4 h-4 text-white/50" />
          </button>
          <div>
            <p className="text-sm text-white font-medium truncate max-w-[180px]">
              {activeConversation?.title || 'New conversation'}
            </p>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-mono uppercase tracking-widest border border-violet-400/20 bg-violet-500/10 text-violet-200/90">
                {MODE_LABELS[currentMode]}
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-mono uppercase tracking-widest border border-cyan-400/20 bg-cyan-500/10 text-cyan-200/90">
                {activePersonality?.label || 'Soft Bestie'}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
            title="Conversation history"
          >
            <History className="w-4 h-4 text-white/40" />
          </button>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
            title="Companion settings"
          >
            <Settings className="w-4 h-4 text-white/40" />
          </button>
        </div>
      </div>

      {/* Messages area */}
      <div className="relative flex-1 overflow-y-auto px-4 py-4 space-y-4 scrollbar-thin scrollbar-thumb-white/10">
        {activeConversation?.messages
          .filter((m) => m.role !== 'system')
          .map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-br from-violet-500/35 to-fuchsia-500/30 border border-violet-300/30 text-white'
                    : 'bg-white/[0.06] border border-white/15 text-white/90'
                }`}
              >
                <div className="flex items-start gap-2">
                  {msg.role === 'assistant' && (
                    <div className="w-5 h-5 rounded-full bg-violet-500/20 border border-violet-400/20 flex items-center justify-center mt-0.5 shrink-0">
                      <Bot className="w-3 h-3 text-violet-300" />
                    </div>
                  )}
                  <div className="space-y-2">
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>

                    {/* Visual suggestion badge */}
                    {msg.visualParams && onParamsChange && (
                      <button
                        onClick={() => handleApplyVisual(msg.visualParams!)}
                        className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/[0.06] border border-white/10 hover:border-violet-500/30 transition-colors group"
                      >
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: msg.visualParams.color }}
                        />
                        <span className="text-[10px] text-white/45 group-hover:text-white/70 font-mono">
                          {msg.visualParams.phrase} — vibe match visuals
                        </span>
                        <Palette className="w-3 h-3 text-white/30 group-hover:text-violet-400" />
                      </button>
                    )}

                    {/* Sentiment badge */}
                    {msg.sentiment && msg.role === 'assistant' && (
                      <span className="inline-block text-[10px] text-white/40 font-mono uppercase tracking-wider">
                        mood: {msg.sentiment}
                      </span>
                    )}
                  </div>
                  {msg.role === 'user' && (
                    <User className="w-4 h-4 text-white/55 mt-0.5 shrink-0" />
                  )}
                </div>
              </div>
            </div>
          ))}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white/[0.06] border border-white/15 rounded-2xl px-4 py-3 flex items-center gap-2">
              <Bot className="w-4 h-4 text-violet-300" />
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-white/30 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-white/30 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-white/30 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <span className="text-[10px] text-white/50 font-mono uppercase tracking-wider">thinking</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="px-4 py-3 border-t border-white/10 bg-black/20 backdrop-blur-sm">
        <div className="relative">
          <input
            ref={inputRef}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="type what’s up..."
            disabled={isTyping}
            className="w-full px-4 py-3 pr-12 bg-white/[0.06] border border-white/15 rounded-2xl text-sm text-white placeholder-white/35 focus:outline-none focus:border-violet-500/50 transition-colors disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={!inputText.trim() || isTyping}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-xl bg-gradient-to-br from-violet-500/45 to-fuchsia-500/45 hover:from-violet-500/55 hover:to-fuchsia-500/55 disabled:opacity-30 transition-colors"
            title="Send"
          >
            <Send className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>
    </div>
  );

  const renderHistoryPanel = () => (
    <motion.div
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -20, opacity: 0 }}
      className="absolute inset-0 z-10 bg-[#0b0b10] flex flex-col"
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <h4 className="font-display text-sm text-white">Chat Archive</h4>
        <div className="flex items-center gap-2">
          <button
            onClick={handleNewConversation}
            className="p-1.5 rounded-lg hover:bg-white/5 transition-colors"
            title="New conversation"
          >
            <Plus className="w-4 h-4 text-white/50" />
          </button>
          <button
            onClick={() => setShowHistory(false)}
            className="p-1.5 rounded-lg hover:bg-white/5 transition-colors"
          >
            <X className="w-4 h-4 text-white/50" />
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {conversations.length === 0 ? (
          <p className="text-xs text-white/30 text-center py-8">No conversations yet</p>
        ) : (
          conversations.map((conv) => (
            <div
              key={conv.id}
              onClick={() => handleSelectConversation(conv.id)}
              className={`flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-colors group ${
                conv.id === activeConversationId
                  ? 'bg-violet-500/10 border border-violet-500/20'
                  : 'hover:bg-white/[0.03] border border-transparent'
              }`}
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white/80 truncate">{conv.title}</p>
                <p className="text-[10px] text-white/25 font-mono">
                  {new Date(conv.updatedAt).toLocaleDateString()} &middot; {conv.messages.length} messages
                </p>
              </div>
              <button
                onClick={(e) => handleDeleteConversation(e, conv.id)}
                className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-red-500/20 transition-all"
                title="Delete"
              >
                <Trash2 className="w-3 h-3 text-red-400/60" />
              </button>
            </div>
          ))
        )}
      </div>
    </motion.div>
  );

  const renderSettingsPanel = () => (
    <motion.div
      initial={{ x: 20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 20, opacity: 0 }}
      className="absolute inset-0 z-10 bg-[#0b0b10] flex flex-col"
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <h4 className="font-display text-sm text-white">Vibe Settings</h4>
        <button
          onClick={() => setShowSettings(false)}
          className="p-1.5 rounded-lg hover:bg-white/5 transition-colors"
        >
          <X className="w-4 h-4 text-white/50" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Personality */}
        <div className="space-y-2">
          <label className="text-xs font-mono text-white/40 uppercase tracking-wider">Chat vibe</label>
          <div className="grid grid-cols-2 gap-2">
            {PERSONALITY_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => updateSettings({ personality: opt.value as any })}
                className={`px-3 py-2 rounded-lg border text-left transition-all ${
                  settings.personality === opt.value
                    ? 'border-violet-500/40 bg-violet-500/10'
                    : 'border-white/10 hover:border-white/20 bg-white/[0.02]'
                }`}
              >
                <p className="text-xs text-white/80">{opt.label}</p>
                <p className="text-[10px] text-white/30">{opt.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Visualization sync */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-white/70">Sync visuals</p>
            <p className="text-[10px] text-white/30">Let chat mood update visuals</p>
          </div>
          <button
            onClick={() => updateSettings({ enableVisualization: !settings.enableVisualization })}
            className={`w-10 h-5 rounded-full transition-colors ${
              settings.enableVisualization ? 'bg-violet-500/60' : 'bg-white/10'
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full bg-white transition-transform ${
                settings.enableVisualization ? 'translate-x-5' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>

        {/* Memory */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-white/70">Memory on/off</p>
            <p className="text-[10px] text-white/30">Keep context from old chats</p>
          </div>
          <button
            onClick={() => updateSettings({ enableMemory: !settings.enableMemory })}
            className={`w-10 h-5 rounded-full transition-colors ${
              settings.enableMemory ? 'bg-violet-500/60' : 'bg-white/10'
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full bg-white transition-transform ${
                settings.enableMemory ? 'translate-x-5' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>
      </div>
    </motion.div>
  );

  // ============================================================================
  // Main render
  // ============================================================================

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center p-4"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-xl h-[640px] max-h-[88vh] bg-[#09090d] border border-violet-400/20 rounded-3xl overflow-hidden flex flex-col shadow-[0_0_50px_rgba(139,92,246,0.18)]"
          >
            {/* Top bar */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-black/30 backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500/40 via-fuchsia-500/30 to-cyan-500/40 border border-white/10 flex items-center justify-center">
                  <Sparkles className="w-3.5 h-3.5 text-violet-200" />
                </div>
                <div>
                  <h2 className="font-display text-base text-white">Aetheria Chat</h2>
                  <p className="text-[10px] text-white/40 font-mono uppercase tracking-widest">gen-z therapist vibe</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                title="Close"
              >
                <X className="w-4 h-4 text-white/50" />
              </button>
            </div>

            {/* Content area */}
            <div className="flex-1 relative overflow-hidden">
              {view === 'welcome' ? renderWelcomeView() : renderChatView()}

              {/* Overlay panels */}
              <AnimatePresence>
                {showHistory && renderHistoryPanel()}
                {showSettings && renderSettingsPanel()}
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
