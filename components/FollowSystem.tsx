// Follow System Component - Follow users and see their feed
import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Users, UserPlus, UserMinus, Search, ExternalLink } from 'lucide-react';
import { UserProfile, VisualParams } from '../types';

interface FollowSystemProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserId?: string;
  onSelectVisualization?: (params: VisualParams) => void;
}

interface FollowedUser extends UserProfile {
  isFollowing: boolean;
  recentVisualization?: {
    id: string;
    params: VisualParams;
    createdAt: string;
  };
}

type Tab = 'following' | 'followers' | 'discover';

export const FollowSystem: React.FC<FollowSystemProps> = ({
  isOpen,
  onClose,
  currentUserId,
  onSelectVisualization,
}) => {
  const [tab, setTab] = useState<Tab>('following');
  const [users, setUsers] = useState<FollowedUser[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Fetch users based on tab
  useEffect(() => {
    if (!isOpen || !currentUserId) return;

    setLoading(true);
    fetch(`/api/users?tab=${tab}&userId=${currentUserId}${searchQuery ? `&q=${searchQuery}` : ''}`)
      .then(res => res.json())
      .then(data => {
        if (data.users) {
          setUsers(data.users);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [isOpen, tab, currentUserId, searchQuery]);

  const handleFollow = useCallback(async (targetUserId: string) => {
    if (!currentUserId) return;

    try {
      const res = await fetch('/api/follow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId }),
      });

      if (res.ok) {
        setUsers(prev =>
          prev.map(u =>
            u.id === targetUserId
              ? { ...u, isFollowing: true }
              : u
          )
        );
      }
    } catch (error) {
      console.error('Failed to follow:', error);
    }
  }, [currentUserId]);

  const handleUnfollow = useCallback(async (targetUserId: string) => {
    if (!currentUserId) return;

    try {
      const res = await fetch('/api/follow', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId }),
      });

      if (res.ok) {
        setUsers(prev =>
          prev.map(u =>
            u.id === targetUserId
              ? { ...u, isFollowing: false }
              : u
          )
        );
      }
    } catch (error) {
      console.error('Failed to unfollow:', error);
    }
  }, [currentUserId]);

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
                <Users className="w-5 h-5" />
                <h3 className="font-display text-lg font-bold">Community</h3>
              </div>
              <button
                onClick={onClose}
                className="p-1 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-white/10">
              {(['following', 'followers', 'discover'] as Tab[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                    tab === t
                      ? 'text-white border-b-2 border-white'
                      : 'text-white/50 hover:text-white/80'
                  }`}
                >
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>

            {/* Search (for discover tab) */}
            {tab === 'discover' && (
              <div className="p-4 border-b border-white/10">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search users..."
                    className="w-full bg-white/5 border border-white/10 rounded-full pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-white/30"
                  />
                </div>
              </div>
            )}

            {/* User List */}
            <div className="flex-1 overflow-y-auto">
              {!currentUserId ? (
                <div className="p-8 text-center">
                  <Users className="w-10 h-10 mx-auto mb-3 opacity-20" />
                  <p className="text-white/50">Sign in to see your community</p>
                </div>
              ) : loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                </div>
              ) : users.length === 0 ? (
                <div className="p-8 text-center">
                  <Users className="w-10 h-10 mx-auto mb-3 opacity-20" />
                  <p className="text-white/50">
                    {tab === 'following' && "You're not following anyone yet"}
                    {tab === 'followers' && "You don't have any followers yet"}
                    {tab === 'discover' && "No users found"}
                  </p>
                </div>
              ) : (
                <div className="p-2 space-y-2">
                  {users.map((user) => (
                    <motion.div
                      key={user.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-3 p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors"
                    >
                      {/* Avatar */}
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center font-bold">
                        {user.username[0].toUpperCase()}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{user.displayName || user.username}</p>
                        <p className="text-xs text-white/50">@{user.username}</p>
                      </div>

                      {/* Recent visualization preview */}
                      {user.recentVisualization && (
                        <button
                          onClick={() => onSelectVisualization?.(user.recentVisualization!.params)}
                          className="w-8 h-8 rounded-lg flex-shrink-0"
                          style={{
                            background: `radial-gradient(circle, ${user.recentVisualization.params.color} 0%, #000 100%)`,
                          }}
                          title="View recent visualization"
                        />
                      )}

                      {/* Follow/Unfollow Button */}
                      {user.id !== currentUserId && (
                        <button
                          onClick={() => user.isFollowing ? handleUnfollow(user.id) : handleFollow(user.id)}
                          className={`flex items-center gap-1 px-3 py-1.5 text-sm rounded-full transition-colors ${
                            user.isFollowing
                              ? 'bg-white/10 text-white/70 hover:bg-red-500/20 hover:text-red-400'
                              : 'bg-white text-black hover:bg-white/90'
                          }`}
                        >
                          {user.isFollowing ? (
                            <>
                              <UserMinus className="w-3 h-3" />
                              <span className="hidden sm:inline">Unfollow</span>
                            </>
                          ) : (
                            <>
                              <UserPlus className="w-3 h-3" />
                              <span className="hidden sm:inline">Follow</span>
                            </>
                          )}
                        </button>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
