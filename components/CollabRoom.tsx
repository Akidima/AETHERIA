// Collaborative Room Component - Real-time shared sessions
import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Users, Copy, Check, Plus, Globe, Lock, Trash2, Play, ExternalLink } from 'lucide-react';
import { VisualParams, VisualMode } from '../types';

interface CollabRoomProps {
  isOpen: boolean;
  onClose: () => void;
  currentParams: VisualParams;
  currentMode: VisualMode;
  userId?: string;
  onJoinRoom?: (params: VisualParams, mode: VisualMode) => void;
}

interface Room {
  id: string;
  room_code: string;
  name: string;
  params: VisualParams;
  visual_mode: VisualMode;
  is_public: boolean;
  host_id: string;
  created_at: string;
}

export const CollabRoom: React.FC<CollabRoomProps> = ({
  isOpen,
  onClose,
  currentParams,
  currentMode,
  userId,
  onJoinRoom,
}) => {
  const [view, setView] = useState<'list' | 'create' | 'join'>('list');
  const [rooms, setRooms] = useState<Room[]>([]);
  const [publicRooms, setPublicRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [joinCode, setJoinCode] = useState('');
  const [copied, setCopied] = useState<string | null>(null);
  
  // Create form state
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomPublic, setNewRoomPublic] = useState(true);
  const [creating, setCreating] = useState(false);

  // Fetch rooms
  useEffect(() => {
    if (!isOpen) return;
    
    const fetchRooms = async () => {
      setLoading(true);
      try {
        // Fetch user's rooms
        if (userId) {
          const res = await fetch('/api/collab', {
            headers: { Authorization: `Bearer ${userId}` },
          });
          const data = await res.json();
          if (data.rooms) setRooms(data.rooms);
        }

        // Fetch public rooms
        const publicRes = await fetch('/api/collab?list=public');
        const publicData = await publicRes.json();
        if (publicData.rooms) setPublicRooms(publicData.rooms);
      } catch (error) {
        console.error('Failed to fetch rooms:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRooms();
  }, [isOpen, userId]);

  const handleCreateRoom = useCallback(async () => {
    if (!newRoomName.trim() || !userId) return;

    setCreating(true);
    try {
      const res = await fetch('/api/collab', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userId}`,
        },
        body: JSON.stringify({
          name: newRoomName.trim(),
          params: currentParams,
          visualMode: currentMode,
          isPublic: newRoomPublic,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setRooms(prev => [data.room, ...prev]);
        setNewRoomName('');
        setView('list');
      }
    } catch (error) {
      console.error('Failed to create room:', error);
    } finally {
      setCreating(false);
    }
  }, [newRoomName, newRoomPublic, currentParams, currentMode, userId]);

  const handleJoinRoom = useCallback(async (code?: string) => {
    const roomCode = code || joinCode.trim().toUpperCase();
    if (!roomCode) return;

    try {
      const res = await fetch(`/api/collab?code=${roomCode}`);
      if (res.ok) {
        const data = await res.json();
        if (data.room && onJoinRoom) {
          onJoinRoom(data.room.params, data.room.visual_mode);
          onClose();
        }
      } else {
        alert('Room not found or expired');
      }
    } catch (error) {
      console.error('Failed to join room:', error);
    }
  }, [joinCode, onJoinRoom, onClose]);

  const handleDeleteRoom = useCallback(async (code: string) => {
    if (!confirm('Delete this room?') || !userId) return;

    try {
      const res = await fetch('/api/collab', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userId}`,
        },
        body: JSON.stringify({ code }),
      });

      if (res.ok) {
        setRooms(prev => prev.filter(r => r.room_code !== code));
      }
    } catch (error) {
      console.error('Failed to delete room:', error);
    }
  }, [userId]);

  const copyCode = useCallback((code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(null), 2000);
  }, []);

  const getShareUrl = (code: string) => {
    return `${window.location.origin}?room=${code}`;
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
                <Users className="w-5 h-5" />
                <h3 className="font-display text-lg font-bold">Collab Rooms</h3>
              </div>
              <button
                onClick={onClose}
                className="p-1 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation */}
            <div className="flex border-b border-white/10">
              {[
                { id: 'list', label: 'My Rooms' },
                { id: 'join', label: 'Join' },
                { id: 'create', label: 'Create' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setView(tab.id as typeof view)}
                  className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                    view === tab.id
                      ? 'text-white border-b-2 border-white'
                      : 'text-white/50 hover:text-white/80'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {view === 'list' && (
                <div className="space-y-4">
                  {/* User's Rooms */}
                  {userId ? (
                    loading ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      </div>
                    ) : rooms.length === 0 ? (
                      <div className="text-center py-8">
                        <Users className="w-10 h-10 mx-auto mb-3 opacity-20" />
                        <p className="text-white/50">No rooms yet</p>
                        <button
                          onClick={() => setView('create')}
                          className="mt-4 px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
                        >
                          Create your first room
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {rooms.map((room) => (
                          <div
                            key={room.id}
                            className="flex items-center gap-3 p-3 bg-white/5 rounded-xl"
                          >
                            <div
                              className="w-10 h-10 rounded-lg flex-shrink-0"
                              style={{
                                background: `radial-gradient(circle, ${room.params.color} 0%, #000 100%)`,
                              }}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="font-medium truncate">{room.name}</p>
                                {room.is_public ? (
                                  <Globe className="w-3 h-3 text-green-400" />
                                ) : (
                                  <Lock className="w-3 h-3 text-white/50" />
                                )}
                              </div>
                              <p className="text-xs text-white/50 font-mono">{room.room_code}</p>
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => copyCode(room.room_code)}
                                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                                title="Copy code"
                              >
                                {copied === room.room_code ? (
                                  <Check className="w-4 h-4 text-green-400" />
                                ) : (
                                  <Copy className="w-4 h-4" />
                                )}
                              </button>
                              <button
                                onClick={() => handleJoinRoom(room.room_code)}
                                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                                title="Join"
                              >
                                <Play className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteRoom(room.room_code)}
                                className="p-2 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-white/50">Sign in to create rooms</p>
                    </div>
                  )}

                  {/* Public Rooms */}
                  {publicRooms.length > 0 && (
                    <div className="mt-6">
                      <p className="text-xs font-mono uppercase tracking-widest opacity-60 mb-3">
                        Public Rooms
                      </p>
                      <div className="space-y-2">
                        {publicRooms.slice(0, 5).map((room) => (
                          <button
                            key={room.id}
                            onClick={() => handleJoinRoom(room.room_code)}
                            className="w-full flex items-center gap-3 p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors"
                          >
                            <Globe className="w-4 h-4 text-green-400" />
                            <span className="flex-1 text-left truncate">{room.name}</span>
                            <span className="text-xs text-white/50 font-mono">{room.room_code}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {view === 'join' && (
                <div className="space-y-4">
                  <div className="text-center py-4">
                    <p className="text-white/60 mb-6">Enter a room code to join</p>
                    <input
                      type="text"
                      value={joinCode}
                      onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                      placeholder="ABCD1234"
                      maxLength={8}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-6 py-4 text-center text-2xl font-mono uppercase tracking-widest focus:outline-none focus:border-white/30"
                      autoFocus
                    />
                    <button
                      onClick={() => handleJoinRoom()}
                      disabled={joinCode.length < 4}
                      className="w-full mt-4 py-3 bg-white text-black font-medium rounded-lg hover:bg-white/90 transition-colors disabled:opacity-50"
                    >
                      Join Room
                    </button>
                  </div>
                </div>
              )}

              {view === 'create' && (
                <div className="space-y-4">
                  {!userId ? (
                    <div className="text-center py-8">
                      <p className="text-white/50">Sign in to create rooms</p>
                    </div>
                  ) : (
                    <>
                      {/* Preview */}
                      <div className="p-4 bg-white/5 rounded-xl">
                        <p className="text-xs font-mono uppercase tracking-widest opacity-60 mb-3">
                          Current Visualization
                        </p>
                        <div className="flex items-center gap-3">
                          <div
                            className="w-12 h-12 rounded-lg"
                            style={{
                              background: `radial-gradient(circle, ${currentParams.color} 0%, #000 100%)`,
                            }}
                          />
                          <div>
                            <p className="font-medium">{currentParams.phrase}</p>
                            <p className="text-xs text-white/50">{currentMode} mode</p>
                          </div>
                        </div>
                      </div>

                      {/* Room Name */}
                      <input
                        type="text"
                        value={newRoomName}
                        onChange={(e) => setNewRoomName(e.target.value)}
                        placeholder="Room name..."
                        maxLength={50}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-white/30"
                        autoFocus
                      />

                      {/* Public Toggle */}
                      <button
                        onClick={() => setNewRoomPublic(!newRoomPublic)}
                        className={`flex items-center justify-between w-full p-4 rounded-xl border transition-colors ${
                          newRoomPublic
                            ? 'border-green-500/30 bg-green-500/10'
                            : 'border-white/10'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {newRoomPublic ? (
                            <Globe className="w-5 h-5 text-green-400" />
                          ) : (
                            <Lock className="w-5 h-5" />
                          )}
                          <div className="text-left">
                            <p className="font-medium">{newRoomPublic ? 'Public' : 'Private'}</p>
                            <p className="text-xs text-white/50">
                              {newRoomPublic
                                ? 'Anyone can discover and join'
                                : 'Only people with the code can join'}
                            </p>
                          </div>
                        </div>
                      </button>

                      {/* Create Button */}
                      <button
                        onClick={handleCreateRoom}
                        disabled={!newRoomName.trim() || creating}
                        className="w-full flex items-center justify-center gap-2 py-3 bg-white text-black font-medium rounded-lg hover:bg-white/90 transition-colors disabled:opacity-50"
                      >
                        {creating ? (
                          <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                        ) : (
                          <>
                            <Plus className="w-5 h-5" />
                            Create Room
                          </>
                        )}
                      </button>
                    </>
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
