// Comments Component - For gallery items
import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MessageCircle, Send, Heart, Trash2, MoreHorizontal } from 'lucide-react';
import { Comment } from '../types';

interface CommentsProps {
  visualizationId: string;
  isOpen: boolean;
  onClose: () => void;
  currentUserId?: string;
}

export const Comments: React.FC<CommentsProps> = ({
  visualizationId,
  isOpen,
  onClose,
  currentUserId,
}) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Fetch comments
  useEffect(() => {
    if (isOpen && visualizationId) {
      setLoading(true);
      fetch(`/api/comments?visualizationId=${visualizationId}`)
        .then(res => res.json())
        .then(data => {
          if (data.comments) {
            setComments(data.comments);
          }
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [isOpen, visualizationId]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || submitting) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          visualizationId,
          content: newComment.trim(),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.comment) {
          setComments(prev => [data.comment, ...prev]);
          setNewComment('');
        }
      }
    } catch (error) {
      console.error('Failed to post comment:', error);
    } finally {
      setSubmitting(false);
    }
  }, [newComment, visualizationId, submitting]);

  const handleLike = useCallback(async (commentId: string) => {
    try {
      const res = await fetch(`/api/comments/${commentId}/like`, {
        method: 'POST',
      });

      if (res.ok) {
        setComments(prev =>
          prev.map(c =>
            c.id === commentId
              ? { ...c, likes: c.userLiked ? c.likes - 1 : c.likes + 1, userLiked: !c.userLiked }
              : c
          )
        );
      }
    } catch (error) {
      console.error('Failed to like comment:', error);
    }
  }, []);

  const handleDelete = useCallback(async (commentId: string) => {
    if (!confirm('Delete this comment?')) return;

    try {
      const res = await fetch(`/api/comments/${commentId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setComments(prev => prev.filter(c => c.id !== commentId));
      }
    } catch (error) {
      console.error('Failed to delete comment:', error);
    }
  }, []);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
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
            className="relative w-full max-w-md mx-4 max-h-[80vh] flex flex-col bg-[#0a0a0a] border border-white/10 rounded-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5" />
                <h3 className="font-display text-lg font-bold">Comments</h3>
                <span className="text-sm text-white/50">({comments.length})</span>
              </div>
              <button
                onClick={onClose}
                className="p-1 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Comments List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                </div>
              ) : comments.length === 0 ? (
                <div className="text-center py-8">
                  <MessageCircle className="w-10 h-10 mx-auto mb-3 opacity-20" />
                  <p className="text-white/50">No comments yet</p>
                  <p className="text-xs text-white/30 mt-1">Be the first to comment!</p>
                </div>
              ) : (
                comments.map((comment) => (
                  <motion.div
                    key={comment.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="group"
                  >
                    <div className="flex gap-3">
                      {/* Avatar */}
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-xs font-bold flex-shrink-0">
                        {comment.username[0].toUpperCase()}
                      </div>

                      <div className="flex-1 min-w-0">
                        {/* Header */}
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">{comment.username}</span>
                          <span className="text-xs text-white/30">{formatTime(comment.createdAt)}</span>
                        </div>

                        {/* Content */}
                        <p className="text-sm text-white/80 break-words">{comment.content}</p>

                        {/* Actions */}
                        <div className="flex items-center gap-4 mt-2">
                          <button
                            onClick={() => handleLike(comment.id)}
                            className={`flex items-center gap-1 text-xs transition-colors ${
                              comment.userLiked ? 'text-red-400' : 'text-white/40 hover:text-white/60'
                            }`}
                          >
                            <Heart className={`w-3 h-3 ${comment.userLiked ? 'fill-current' : ''}`} />
                            {comment.likes > 0 && <span>{comment.likes}</span>}
                          </button>

                          {currentUserId === comment.userId && (
                            <button
                              onClick={() => handleDelete(comment.id)}
                              className="text-xs text-white/40 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {/* Input */}
            <form onSubmit={handleSubmit} className="p-4 border-t border-white/10">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder={currentUserId ? "Add a comment..." : "Sign in to comment"}
                  disabled={!currentUserId || submitting}
                  className="flex-1 bg-white/5 border border-white/10 rounded-full px-4 py-2 text-sm focus:outline-none focus:border-white/30 disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={!newComment.trim() || !currentUserId || submitting}
                  className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors disabled:opacity-30"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
