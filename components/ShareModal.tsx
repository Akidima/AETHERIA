// Share Modal Component
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Link, Twitter, Copy, Check, Download, Loader2 } from 'lucide-react';
import { VisualParams } from '../types';
import { createShare } from '../services/apiService';
import { useScreenshot } from '../hooks/useAppFeatures';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  input: string;
  params: VisualParams;
  userId?: string;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  input,
  params,
  userId,
}) => {
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { download } = useScreenshot();

  useEffect(() => {
    if (isOpen && !shareUrl) {
      createShareLink();
    }
  }, [isOpen]);

  const createShareLink = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await createShare(input, params, userId);
      setShareUrl(`${window.location.origin}/share/${result.shareId}`);
    } catch (e) {
      setError('Failed to create share link. Try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async () => {
    if (!shareUrl) return;

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      // Fallback
      const input = document.createElement('input');
      input.value = shareUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const shareToTwitter = () => {
    const text = `"${params.phrase}" - ${params.explanation}`;
    const url = encodeURIComponent(shareUrl || window.location.href);
    const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${url}&hashtags=Aetheria,DigitalArt,AI`;
    window.open(tweetUrl, '_blank');
  };

  const handleDownload = () => {
    download(`aetheria-${params.phrase.toLowerCase().replace(/\s+/g, '-')}.png`);
  };

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
            className="relative w-full max-w-md mx-4 bg-[#0a0a0a] border border-white/10 rounded-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <h2 className="font-display text-2xl font-bold uppercase tracking-tight">
                Share
              </h2>
              <button
                onClick={onClose}
                className="p-2 text-white/60 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Preview */}
            <div className="p-6 border-b border-white/10">
              <div className="flex items-center gap-4">
                <div
                  className="w-16 h-16 rounded-lg flex-shrink-0"
                  style={{ backgroundColor: params.color }}
                />
                <div>
                  <h3 className="font-display text-lg font-bold">{params.phrase}</h3>
                  <p className="text-sm text-white/60">{params.explanation}</p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-white/40" />
                </div>
              ) : error ? (
                <div className="text-center py-4">
                  <p className="text-red-400 mb-4">{error}</p>
                  <button
                    onClick={createShareLink}
                    className="px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
                  >
                    Try Again
                  </button>
                </div>
              ) : (
                <>
                  {/* Share URL */}
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={shareUrl || ''}
                      readOnly
                      className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-sm truncate"
                    />
                    <button
                      onClick={copyToClipboard}
                      className="p-3 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
                    >
                      {copied ? (
                        <Check className="w-5 h-5 text-green-400" />
                      ) : (
                        <Copy className="w-5 h-5" />
                      )}
                    </button>
                  </div>

                  {/* Share Buttons */}
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      onClick={copyToClipboard}
                      className="flex flex-col items-center gap-2 p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                    >
                      <Link className="w-6 h-6" />
                      <span className="text-xs">Copy Link</span>
                    </button>

                    <button
                      onClick={shareToTwitter}
                      className="flex flex-col items-center gap-2 p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                    >
                      <Twitter className="w-6 h-6" />
                      <span className="text-xs">Twitter</span>
                    </button>

                    <button
                      onClick={handleDownload}
                      className="flex flex-col items-center gap-2 p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                    >
                      <Download className="w-6 h-6" />
                      <span className="text-xs">Download</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
