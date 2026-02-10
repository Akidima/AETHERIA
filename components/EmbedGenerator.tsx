// Embed Generator Component - Generate iframe embed codes
import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Code, Copy, Check, ExternalLink } from 'lucide-react';
import { VisualParams, ThemeMode } from '../types';

interface EmbedGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
  visualizationId?: string;
  params: VisualParams;
}

export const EmbedGenerator: React.FC<EmbedGeneratorProps> = ({
  isOpen,
  onClose,
  visualizationId,
  params,
}) => {
  const [width, setWidth] = useState(400);
  const [height, setHeight] = useState(400);
  const [autoplay, setAutoplay] = useState(true);
  const [showControls, setShowControls] = useState(false);
  const [showWatermark, setShowWatermark] = useState(true);
  const [theme, setTheme] = useState<ThemeMode>('dark');
  const [copied, setCopied] = useState(false);

  // Generate embed URL with params
  const embedUrl = useMemo(() => {
    const base = typeof window !== 'undefined' ? window.location.origin : '';
    const searchParams = new URLSearchParams({
      embed: '1',
      color: encodeURIComponent(params.color),
      speed: params.speed.toString(),
      distort: params.distort.toString(),
      autoplay: autoplay ? '1' : '0',
      controls: showControls ? '1' : '0',
      watermark: showWatermark ? '1' : '0',
      theme,
    });
    
    if (visualizationId) {
      searchParams.set('id', visualizationId);
    }
    
    return `${base}/embed?${searchParams.toString()}`;
  }, [params, visualizationId, autoplay, showControls, showWatermark, theme]);

  // Generate embed code
  const embedCode = useMemo(() => {
    return `<iframe
  src="${embedUrl}"
  width="${width}"
  height="${height}"
  frameborder="0"
  allow="autoplay"
  style="border-radius: 12px; overflow: hidden;"
></iframe>`;
  }, [embedUrl, width, height]);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [embedCode]);

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
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto bg-[#0a0a0a] border border-white/10 rounded-2xl"
          >
            {/* Header */}
            <div className="sticky top-0 flex items-center justify-between p-4 border-b border-white/10 bg-[#0a0a0a] z-10">
              <div className="flex items-center gap-2">
                <Code className="w-5 h-5" />
                <h3 className="font-display text-lg font-bold">Embed Widget</h3>
              </div>
              <button
                onClick={onClose}
                className="p-1 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Preview */}
              <div className="space-y-2">
                <label className="text-xs font-mono uppercase tracking-widest opacity-60">Preview</label>
                <div
                  className="relative mx-auto rounded-xl overflow-hidden border border-white/10"
                  style={{ width: Math.min(width, 320), height: Math.min(height, 320) }}
                >
                  <div
                    className="absolute inset-0"
                    style={{
                      background: `radial-gradient(circle at center, ${params.color} 0%, ${theme === 'light' ? '#fafafa' : '#050505'} 100%)`,
                    }}
                  />
                  {showWatermark && (
                    <div className="absolute bottom-2 right-2 text-xs opacity-40 font-mono">
                      aetheria
                    </div>
                  )}
                </div>
              </div>

              {/* Size */}
              <div className="space-y-3">
                <label className="text-xs font-mono uppercase tracking-widest opacity-60">Size</label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-white/50 mb-1 block">Width</label>
                    <input
                      type="number"
                      value={width}
                      onChange={(e) => setWidth(Math.max(200, parseInt(e.target.value) || 200))}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-white/50 mb-1 block">Height</label>
                    <input
                      type="number"
                      value={height}
                      onChange={(e) => setHeight(Math.max(200, parseInt(e.target.value) || 200))}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  {[
                    { label: 'Square', w: 400, h: 400 },
                    { label: 'Wide', w: 600, h: 400 },
                    { label: 'Tall', w: 400, h: 600 },
                  ].map(({ label, w, h }) => (
                    <button
                      key={label}
                      onClick={() => { setWidth(w); setHeight(h); }}
                      className={`flex-1 py-1.5 text-xs rounded-lg border transition-colors ${
                        width === w && height === h
                          ? 'border-white/30 bg-white/10'
                          : 'border-white/10 hover:border-white/20'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Theme */}
              <div className="space-y-2">
                <label className="text-xs font-mono uppercase tracking-widest opacity-60">Theme</label>
                <div className="flex gap-2">
                  {(['dark', 'light', 'cosmic'] as ThemeMode[]).map((t) => (
                    <button
                      key={t}
                      onClick={() => setTheme(t)}
                      className={`flex-1 py-2 text-sm rounded-lg border transition-colors capitalize ${
                        theme === t
                          ? 'border-white/30 bg-white/10'
                          : 'border-white/10 hover:border-white/20'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Options */}
              <div className="space-y-2">
                <label className="text-xs font-mono uppercase tracking-widest opacity-60">Options</label>
                <div className="space-y-2">
                  {[
                    { id: 'autoplay', label: 'Autoplay', value: autoplay, onChange: setAutoplay },
                    { id: 'controls', label: 'Show Controls', value: showControls, onChange: setShowControls },
                    { id: 'watermark', label: 'Show Watermark', value: showWatermark, onChange: setShowWatermark },
                  ].map(({ id, label, value, onChange }) => (
                    <button
                      key={id}
                      onClick={() => onChange(!value)}
                      className={`flex items-center justify-between w-full p-3 rounded-lg border transition-colors ${
                        value ? 'border-white/30 bg-white/10' : 'border-white/10'
                      }`}
                    >
                      <span className="text-sm">{label}</span>
                      <div
                        className={`w-8 h-5 rounded-full transition-colors ${
                          value ? 'bg-green-500' : 'bg-white/20'
                        }`}
                      >
                        <motion.div
                          className="w-4 h-4 bg-white rounded-full mt-0.5"
                          animate={{ x: value ? 14 : 2 }}
                          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        />
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Embed Code */}
              <div className="space-y-2">
                <label className="text-xs font-mono uppercase tracking-widest opacity-60">Embed Code</label>
                <div className="relative">
                  <pre className="bg-white/5 border border-white/10 rounded-lg p-4 text-xs overflow-x-auto">
                    <code className="text-green-400">{embedCode}</code>
                  </pre>
                  <button
                    onClick={handleCopy}
                    className="absolute top-2 right-2 p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-green-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Direct Link */}
              <div className="flex items-center gap-2 p-3 bg-white/5 rounded-lg">
                <ExternalLink className="w-4 h-4 text-white/40" />
                <input
                  type="text"
                  value={embedUrl}
                  readOnly
                  className="flex-1 bg-transparent text-xs text-white/60 outline-none"
                />
                <button
                  onClick={() => window.open(embedUrl, '_blank')}
                  className="text-xs text-white/60 hover:text-white transition-colors"
                >
                  Open
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
