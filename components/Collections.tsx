// Collections Component - Curate saved visualizations
import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FolderPlus, Folder, Plus, Trash2, Globe, Lock, Edit2, Check } from 'lucide-react';
import { Collection, VisualParams } from '../types';

interface CollectionsProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectVisualization?: (params: VisualParams) => void;
  currentVisualizationId?: string;
  userId?: string;
}

const STORAGE_KEY = 'aetheria_collections';

interface LocalCollection extends Collection {
  visualizations: { id: string; params: VisualParams; name: string }[];
}

export const Collections: React.FC<CollectionsProps> = ({
  isOpen,
  onClose,
  onSelectVisualization,
  currentVisualizationId,
  userId,
}) => {
  const [collections, setCollections] = useState<LocalCollection[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<LocalCollection | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [newCollectionDesc, setNewCollectionDesc] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  // Load collections from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setCollections(JSON.parse(saved));
      }
    } catch (e) {
      console.warn('Failed to load collections');
    }
  }, []);

  // Save collections to localStorage
  const saveCollections = useCallback((updated: LocalCollection[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to save collections');
    }
  }, []);

  const handleCreateCollection = useCallback(() => {
    if (!newCollectionName.trim()) return;

    const newCollection: LocalCollection = {
      id: Date.now().toString(),
      userId: userId || 'local',
      name: newCollectionName.trim(),
      description: newCollectionDesc.trim() || undefined,
      visualizationIds: [],
      visualizations: [],
      isPublic,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setCollections(prev => {
      const updated = [newCollection, ...prev];
      saveCollections(updated);
      return updated;
    });

    setNewCollectionName('');
    setNewCollectionDesc('');
    setIsPublic(false);
    setShowNewForm(false);
  }, [newCollectionName, newCollectionDesc, isPublic, userId, saveCollections]);

  const handleDeleteCollection = useCallback((id: string) => {
    if (!confirm('Delete this collection?')) return;

    setCollections(prev => {
      const updated = prev.filter(c => c.id !== id);
      saveCollections(updated);
      return updated;
    });

    if (selectedCollection?.id === id) {
      setSelectedCollection(null);
    }
  }, [selectedCollection, saveCollections]);

  const handleRenameCollection = useCallback((id: string) => {
    if (!editName.trim()) {
      setEditingId(null);
      return;
    }

    setCollections(prev => {
      const updated = prev.map(c =>
        c.id === id ? { ...c, name: editName.trim(), updatedAt: new Date().toISOString() } : c
      );
      saveCollections(updated);
      return updated;
    });

    setEditingId(null);
    setEditName('');
  }, [editName, saveCollections]);

  const handleRemoveFromCollection = useCallback((collectionId: string, vizId: string) => {
    setCollections(prev => {
      const updated = prev.map(c => {
        if (c.id === collectionId) {
          return {
            ...c,
            visualizationIds: c.visualizationIds.filter(id => id !== vizId),
            visualizations: c.visualizations.filter(v => v.id !== vizId),
            updatedAt: new Date().toISOString(),
          };
        }
        return c;
      });
      saveCollections(updated);
      return updated;
    });

    if (selectedCollection?.id === collectionId) {
      setSelectedCollection(prev => prev ? {
        ...prev,
        visualizationIds: prev.visualizationIds.filter(id => id !== vizId),
        visualizations: prev.visualizations.filter(v => v.id !== vizId),
      } : null);
    }
  }, [selectedCollection, saveCollections]);

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
            className="relative w-full max-w-lg mx-4 max-h-[80vh] flex flex-col bg-[#0a0a0a] border border-white/10 rounded-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                {selectedCollection ? (
                  <>
                    <button
                      onClick={() => setSelectedCollection(null)}
                      className="p-1 hover:bg-white/10 rounded-lg transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <Folder className="w-5 h-5" />
                    <h3 className="font-display text-lg font-bold">{selectedCollection.name}</h3>
                  </>
                ) : (
                  <>
                    <FolderPlus className="w-5 h-5" />
                    <h3 className="font-display text-lg font-bold">Collections</h3>
                  </>
                )}
              </div>
              <button
                onClick={onClose}
                className="p-1 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {selectedCollection ? (
                // Collection Detail View
                <div className="p-4">
                  {selectedCollection.description && (
                    <p className="text-sm text-white/60 mb-4">{selectedCollection.description}</p>
                  )}

                  {selectedCollection.visualizations.length === 0 ? (
                    <div className="text-center py-8">
                      <Folder className="w-10 h-10 mx-auto mb-3 opacity-20" />
                      <p className="text-white/50">This collection is empty</p>
                      <p className="text-xs text-white/30 mt-1">Add visualizations from the gallery</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      {selectedCollection.visualizations.map((viz) => (
                        <motion.div
                          key={viz.id}
                          whileHover={{ scale: 1.02 }}
                          className="group relative aspect-square rounded-xl overflow-hidden cursor-pointer"
                          onClick={() => onSelectVisualization?.(viz.params)}
                        >
                          <div
                            className="absolute inset-0"
                            style={{
                              background: `radial-gradient(circle at center, ${viz.params.color} 0%, #000 100%)`,
                            }}
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveFromCollection(selectedCollection.id, viz.id);
                              }}
                              className="p-2 bg-red-500/20 rounded-full text-red-400 hover:bg-red-500/30"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="absolute bottom-2 left-2 right-2">
                            <p className="text-xs font-medium truncate">{viz.name}</p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                // Collections List View
                <div className="p-4">
                  {/* New Collection Form */}
                  {showNewForm ? (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mb-4 p-4 bg-white/5 rounded-xl space-y-3"
                    >
                      <input
                        type="text"
                        value={newCollectionName}
                        onChange={(e) => setNewCollectionName(e.target.value)}
                        placeholder="Collection name"
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-white/30"
                        autoFocus
                      />
                      <textarea
                        value={newCollectionDesc}
                        onChange={(e) => setNewCollectionDesc(e.target.value)}
                        placeholder="Description (optional)"
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm resize-none h-20 focus:outline-none focus:border-white/30"
                      />
                      <button
                        onClick={() => setIsPublic(!isPublic)}
                        className={`flex items-center gap-2 w-full p-3 rounded-lg border transition-colors ${
                          isPublic ? 'border-green-500/30 bg-green-500/10' : 'border-white/10'
                        }`}
                      >
                        {isPublic ? <Globe className="w-4 h-4 text-green-400" /> : <Lock className="w-4 h-4" />}
                        <span className="text-sm">{isPublic ? 'Public' : 'Private'}</span>
                      </button>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setShowNewForm(false);
                            setNewCollectionName('');
                            setNewCollectionDesc('');
                          }}
                          className="flex-1 px-4 py-2 text-sm border border-white/10 rounded-lg hover:bg-white/5"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleCreateCollection}
                          disabled={!newCollectionName.trim()}
                          className="flex-1 px-4 py-2 text-sm bg-white text-black font-medium rounded-lg hover:bg-white/90 disabled:opacity-50"
                        >
                          Create
                        </button>
                      </div>
                    </motion.div>
                  ) : (
                    <button
                      onClick={() => setShowNewForm(true)}
                      className="w-full flex items-center justify-center gap-2 p-4 mb-4 border border-dashed border-white/20 rounded-xl hover:border-white/40 hover:bg-white/5 transition-all"
                    >
                      <Plus className="w-5 h-5" />
                      <span>New Collection</span>
                    </button>
                  )}

                  {/* Collections List */}
                  {collections.length === 0 && !showNewForm ? (
                    <div className="text-center py-8">
                      <FolderPlus className="w-10 h-10 mx-auto mb-3 opacity-20" />
                      <p className="text-white/50">No collections yet</p>
                      <p className="text-xs text-white/30 mt-1">Create one to organize your favorites</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {collections.map((collection) => (
                        <motion.div
                          key={collection.id}
                          layout
                          className="group flex items-center gap-3 p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors"
                        >
                          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500/30 to-pink-500/30 flex items-center justify-center">
                            <Folder className="w-6 h-6" />
                          </div>

                          <div
                            className="flex-1 min-w-0 cursor-pointer"
                            onClick={() => setSelectedCollection(collection)}
                          >
                            {editingId === collection.id ? (
                              <div className="flex items-center gap-2">
                                <input
                                  type="text"
                                  value={editName}
                                  onChange={(e) => setEditName(e.target.value)}
                                  className="flex-1 bg-white/5 border border-white/20 rounded px-2 py-1 text-sm"
                                  autoFocus
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleRenameCollection(collection.id);
                                    if (e.key === 'Escape') setEditingId(null);
                                  }}
                                />
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRenameCollection(collection.id);
                                  }}
                                  className="p-1 hover:bg-white/10 rounded"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                              </div>
                            ) : (
                              <>
                                <div className="flex items-center gap-2">
                                  <p className="font-medium truncate">{collection.name}</p>
                                  {collection.isPublic && <Globe className="w-3 h-3 text-green-400" />}
                                </div>
                                <p className="text-xs text-white/50">
                                  {collection.visualizations.length} items
                                </p>
                              </>
                            )}
                          </div>

                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingId(collection.id);
                                setEditName(collection.name);
                              }}
                              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteCollection(collection.id);
                              }}
                              className="p-2 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
