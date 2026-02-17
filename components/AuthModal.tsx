// Authentication Modal Component
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Github, Loader2 } from 'lucide-react';
import { signInWithGoogle, signInWithGithub, signInWithEmail, signUpWithEmail } from '../lib/supabase';
import { useAuthStore } from '../store/useStore';
import { analytics } from '../services/analyticsService';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleOAuth = async (provider: 'google' | 'github') => {
    setIsLoading(true);
    setError(null);

    try {
      const signIn = provider === 'google' ? signInWithGoogle : signInWithGithub;
      const { error } = await signIn();
      
      if (error) {
        setError(error.message);
      } else {
        analytics.trackAuth('login', provider);
        onClose();
      }
    } catch (e) {
      setError('Authentication failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const authFn = mode === 'login' ? signInWithEmail : signUpWithEmail;
      const { data, error } = await authFn(email, password);

      if (error) {
        // Handle specific error cases
        if (error.message.includes('Email not confirmed')) {
          setError('Please check your email and click the confirmation link before signing in.');
        } else if (error.message.includes('Invalid login credentials')) {
          setError('Invalid email or password. Please try again.');
        } else {
          setError(error.message);
        }
      } else {
        analytics.trackAuth(mode === 'login' ? 'login' : 'signup', 'email');
        
        if (mode === 'signup') {
          // Check if user needs to confirm email
          if (data.user && !data.user.email_confirmed_at && data.user.confirmation_sent_at) {
            setSuccessMessage('Account created! Please check your email to confirm your account.');
            // Don't close modal, let user see the message
            setEmail('');
            setPassword('');
            setMode('login');
          } else {
            // Auto-confirmed or instant signup
            setSuccessMessage('Account created successfully!');
            setTimeout(() => onClose(), 1500);
          }
        } else {
          // Login successful
          onClose();
        }
      }
    } catch (e) {
      setError('Authentication failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
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
                {mode === 'login' ? 'Welcome Back' : 'Join Aetheria'}
              </h2>
              <button
                onClick={onClose}
                className="p-2 text-white/60 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* OAuth Buttons */}
              <div className="space-y-3">
                <button
                  onClick={() => handleOAuth('google')}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white text-black rounded-lg font-medium hover:bg-white/90 transition-colors disabled:opacity-50"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continue with Google
                </button>

                <button
                  onClick={() => handleOAuth('github')}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-[#24292e] text-white rounded-lg font-medium hover:bg-[#2f363d] transition-colors disabled:opacity-50"
                >
                  <Github className="w-5 h-5" />
                  Continue with GitHub
                </button>
              </div>

              {/* Divider */}
              <div className="flex items-center gap-4">
                <div className="flex-1 h-px bg-white/10" />
                <span className="text-xs font-mono uppercase tracking-widest text-white/40">or</span>
                <div className="flex-1 h-px bg-white/10" />
              </div>

              {/* Email Form */}
              <form onSubmit={handleEmailAuth} className="space-y-4">
                <div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email"
                    required
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg outline-none focus:border-white/30 transition-colors"
                  />
                </div>
                <div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    required
                    minLength={6}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg outline-none focus:border-white/30 transition-colors"
                  />
                </div>

                {error && (
                  <p className="text-sm text-red-400">{error}</p>
                )}
                
                {successMessage && (
                  <p className="text-sm text-green-400">{successMessage}</p>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white text-black rounded-lg font-medium hover:bg-white/90 transition-colors disabled:opacity-50"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Mail className="w-5 h-5" />
                      {mode === 'login' ? 'Sign In' : 'Create Account'}
                    </>
                  )}
                </button>
              </form>

              {/* Toggle Mode */}
              <p className="text-center text-sm text-white/60">
                {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
                <button
                  onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
                  className="text-white hover:underline"
                >
                  {mode === 'login' ? 'Sign up' : 'Sign in'}
                </button>
              </p>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-white/10 bg-white/5">
              <p className="text-xs text-white/40 text-center">
                By continuing, you agree to our Terms of Service and Privacy Policy.
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
