// Public Gallery Component
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Eye, Heart, Clock, TrendingUp, Loader2, Play } from 'lucide-react';
import { getGallery, GalleryItem } from '../services/apiService';
import { VisualParams } from '../types';

interface GalleryProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (params: VisualParams) => void;
}

type SortOption = 'recent' | 'popular' | 'liked';

export const Gallery: React.FC<GalleryProps> = ({ isOpen, onClose, onSelect }) => {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sort, setSort] = useState<SortOption>('recent');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadGallery();
    }
  }, [isOpen, sort]);

  const loadGallery = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await getGallery(sort, 20, 0);
      setItems(result.items);
    } catch (e) {
      setError('Failed to load gallery');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelect = (item: GalleryItem) => {
    onSelect(item.params);
    onClose();
  };

  const sortOptions: { value: SortOption; label: string; icon: React.ReactNode }[] = [
    { value: 'recent', label: 'Recent', icon: <Clock className="w-4 h-4" /> },
    { value: 'popular', label: 'Popular', icon: <TrendingUp className="w-4 h-4" /> },
    { value: 'liked', label: 'Most Liked', icon: <Heart className="w-4 h-4" /> },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[150] bg-black/95 backdrop-blur-xl overflow-y-auto"
        >
          {/* Header */}
          <div className="sticky top-0 z-10 bg-black/90 backdrop-blur-sm border-b border-white/10">
            <div className="container mx-auto px-6 py-6 flex items-center justify-between">
              <div>
                <h2 className="font-display text-3xl md:text-4xl font-bold uppercase tracking-tighter">
                  Gallery
                </h2>
                <p className="text-white/60 font-mono text-sm mt-1">
                  Community Emotions
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-3 rounded-full border border-white/10 hover:border-white/30 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Sort Options */}
            <div className="container mx-auto px-6 pb-4 flex gap-2">
              {sortOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setSort(option.value)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-mono uppercase tracking-widest transition-colors ${
                    sort === option.value
                      ? 'bg-white text-black'
                      : 'bg-white/5 text-white/60 hover:bg-white/10'
                  }`}
                >
                  {option.icon}
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="container mx-auto px-6 py-8">
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-10 h-10 animate-spin text-white/40" />
              </div>
            ) : error ? (
              <div className="text-center py-20">
                <p className="text-white/60 mb-4">{error}</p>
                <button
                  onClick={loadGallery}
                  className="px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
                >
                  Try Again
                </button>
              </div>
            ) : items.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-white/60">No visualizations shared yet.</p>
                <p className="text-white/40 text-sm mt-2">Be the first to share!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {items.map((item, index) => (
                  <motion.button
                    key={item.shareId}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => handleSelect(item)}
                    className="group relative bg-white/5 border border-white/10 rounded-xl overflow-hidden hover:border-white/30 transition-all text-left"
                  >
                    {/* Color Preview */}
                    <div
                      className="aspect-video relative"
                      style={{ backgroundColor: item.params.color }}
                    >
                      {/* Overlay with play icon */}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                          <Play className="w-6 h-6 text-white fill-white" />
                        </div>
                      </div>

                      {/* Stats overlay */}
                      <div className="absolute bottom-2 right-2 flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="flex items-center gap-1 text-xs bg-black/50 rounded-full px-2 py-1 backdrop-blur-sm">
                          <Eye className="w-3 h-3" />
                          {item.views}
                        </div>
                        <div className="flex items-center gap-1 text-xs bg-black/50 rounded-full px-2 py-1 backdrop-blur-sm">
                          <Heart className="w-3 h-3" />
                          {item.likes}
                        </div>
                      </div>
                    </div>

                    {/* Info */}
                    <div className="p-4">
                      <h3 className="font-display text-lg font-bold truncate">
                        {item.params.phrase}
                      </h3>
                      <p className="text-sm text-white/60 truncate mt-1">
                        {item.params.explanation}
                      </p>
                      <p className="text-xs text-white/30 mt-2 font-mono">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </motion.button>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
