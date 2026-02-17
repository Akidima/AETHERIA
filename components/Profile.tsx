// Profile Component - User profile view and edit modal
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Edit2, Save, Check, AlertCircle, Upload, Loader } from 'lucide-react';
import { useAuthStore } from '../store/useStore';
import { getProfile, updateProfile } from '../services/apiService';
import { analytics } from '../services/analyticsService';

interface ProfileData {
  username?: string;
  displayName?: string;
  bio?: string;
  avatarUrl?: string;
  joinedAt?: string;
  visualizationsCount?: number;
  followersCount?: number;
  followingCount?: number;
}

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
  const user = useAuthStore((state) => state.user);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    username: '',
    displayName: '',
    bio: '',
  });

  // Load profile data
  useEffect(() => {
    if (isOpen && user) {
      loadProfile();
    }
  }, [isOpen, user]);

  const loadProfile = async () => {
    if (!user?.id) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await getProfile(user.id);
      setProfile(data);

      // Populate form
      setFormData({
        username: data.username || '',
        displayName: data.displayName || '',
        bio: data.bio || '',
      });
    } catch (err) {
      console.error('Profile load error:', err);
      // Initialize with empty profile data
      setProfile({
        displayName: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
        avatarUrl: user.user_metadata?.avatar_url,
        visualizationsCount: 0,
        followersCount: 0,
        followingCount: 0,
      });

      setFormData({
        username: '',
        displayName: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
        bio: '',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError(null);
  };

  const validateForm = (): boolean => {
    if (formData.username && !/^[a-zA-Z0-9_]{3,20}$/.test(formData.username)) {
      setError('Username must be 3-20 characters, alphanumeric and underscores only');
      return false;
    }

    if (formData.displayName && formData.displayName.length > 50) {
      setError('Display name must be less than 50 characters');
      return false;
    }

    if (formData.bio && formData.bio.length > 500) {
      setError('Bio must be less than 500 characters');
      return false;
    }

    return true;
  };

  const handleSaveProfile = async () => {
    if (!validateForm()) return;
    if (!user?.id) return;

    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const token = useAuthStore.getState().session?.access_token || '';
      await updateProfile(token, {
        username: formData.username || null,
        displayName: formData.displayName || null,
        bio: formData.bio || null,
      });

      setSuccess('Profile updated successfully!');
      setIsEditing(false);

      // Reload profile
      setTimeout(() => {
        loadProfile();
      }, 1000);
    } catch (err) {
      console.error('Profile save error:', err);
      setError(err instanceof Error ? err.message : 'Failed to save profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setError(null);
    setSuccess(null);
    // Reset form
    if (profile) {
      setFormData({
        username: profile.username || '',
        displayName: profile.displayName || '',
        bio: profile.bio || '',
      });
    }
  };

  const initials = user?.email
    ? user.email.substring(0, 2).toUpperCase()
    : user?.user_metadata?.name?.substring(0, 2).toUpperCase() || 'U';

  const displayName = profile?.displayName || user?.user_metadata?.name || user?.email?.split('@')[0] || 'User';

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-[#0a0a0a] border border-white/10 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 flex items-center justify-between p-6 border-b border-white/10 bg-[#0a0a0a]">
              <h2 className="text-xl font-bold">Profile</h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/5 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center p-12">
                <div className="flex gap-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                </div>
              </div>
            ) : profile ? (
              <div className="p-6 space-y-6">
                {/* Account Info */}
                <div>
                  <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wide mb-4">
                    Account
                  </h3>
                  <div className="space-y-4">
                    <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                      <p className="text-xs text-white/40 mb-1">Email</p>
                      <p className="font-mono text-sm truncate">{user?.email}</p>
                    </div>

                    <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                      <p className="text-xs text-white/40 mb-1">Joined</p>
                      <p className="text-sm">
                        {profile.joinedAt
                          ? new Date(profile.joinedAt).toLocaleDateString()
                          : 'Recently'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Avatar */}
                <div>
                  <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wide mb-4">
                    Avatar
                  </h3>
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                      {profile.avatarUrl ? (
                        <img
                          src={profile.avatarUrl}
                          alt={displayName}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        initials
                      )}
                    </div>
                    <button
                      disabled={isEditing}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                    >
                      <Upload className="w-4 h-4" />
                      Upload
                    </button>
                  </div>
                  <p className="text-xs text-white/40 mt-2">
                    Placeholder - avatar upload coming soon
                  </p>
                </div>

                {/* Editable Profile Fields */}
                <div>
                  <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wide mb-4">
                    Profile Information
                  </h3>
                  <div className="space-y-4">
                    {/* Username */}
                    <div>
                      <label className="block text-xs font-medium text-white/60 mb-2">
                        Username
                      </label>
                      <input
                        type="text"
                        name="username"
                        value={formData.username}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        placeholder="Choose a username"
                        maxLength={20}
                        className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 disabled:opacity-50 disabled:cursor-not-allowed focus:border-purple-500 focus:outline-none transition-colors text-sm"
                      />
                      <p className="text-xs text-white/40 mt-1">
                        {formData.username.length}/20 characters
                      </p>
                    </div>

                    {/* Display Name */}
                    <div>
                      <label className="block text-xs font-medium text-white/60 mb-2">
                        Display Name
                      </label>
                      <input
                        type="text"
                        name="displayName"
                        value={formData.displayName}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        placeholder="Your display name"
                        maxLength={50}
                        className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 disabled:opacity-50 disabled:cursor-not-allowed focus:border-purple-500 focus:outline-none transition-colors text-sm"
                      />
                      <p className="text-xs text-white/40 mt-1">
                        {formData.displayName.length}/50 characters
                      </p>
                    </div>

                    {/* Bio */}
                    <div>
                      <label className="block text-xs font-medium text-white/60 mb-2">
                        Bio
                      </label>
                      <textarea
                        name="bio"
                        value={formData.bio}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        placeholder="Tell us about yourself..."
                        maxLength={500}
                        rows={4}
                        className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 disabled:opacity-50 disabled:cursor-not-allowed focus:border-purple-500 focus:outline-none transition-colors text-sm resize-none"
                      />
                      <p className="text-xs text-white/40 mt-1">
                        {formData.bio.length}/500 characters
                      </p>
                    </div>
                  </div>
                </div>

                {/* Statistics */}
                <div>
                  <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wide mb-4">
                    Statistics
                  </h3>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 rounded-lg bg-white/5 border border-white/10 text-center">
                      <p className="text-2xl font-bold text-purple-400">
                        {profile.visualizationsCount || 0}
                      </p>
                      <p className="text-xs text-white/40 mt-1">Visualizations</p>
                    </div>
                    <div className="p-3 rounded-lg bg-white/5 border border-white/10 text-center">
                      <p className="text-2xl font-bold text-pink-400">
                        {profile.followersCount || 0}
                      </p>
                      <p className="text-xs text-white/40 mt-1">Followers</p>
                    </div>
                    <div className="p-3 rounded-lg bg-white/5 border border-white/10 text-center">
                      <p className="text-2xl font-bold text-blue-400">
                        {profile.followingCount || 0}
                      </p>
                      <p className="text-xs text-white/40 mt-1">Following</p>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                {error && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-red-200">{error}</p>
                  </div>
                )}

                {success && (
                  <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30 flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-green-200">{success}</p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4 border-t border-white/10">
                  {!isEditing ? (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 transition-all font-medium"
                    >
                      <Edit2 className="w-4 h-4" />
                      Edit Profile
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={handleCancel}
                        disabled={isSaving}
                        className="flex-1 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveProfile}
                        disabled={isSaving}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
                      >
                        {isSaving ? (
                          <>
                            <Loader className="w-4 h-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4" />
                            Save Changes
                          </>
                        )}
                      </button>
                    </>
                  )}
                </div>
              </div>
            ) : null}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
