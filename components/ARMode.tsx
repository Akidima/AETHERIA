// AR Mode Component - WebXR visualization
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Smartphone, Camera, AlertCircle, Check } from 'lucide-react';
import { VisualParams } from '../types';

interface ARModeProps {
  isOpen: boolean;
  onClose: () => void;
  params: VisualParams;
}

type ARStatus = 'checking' | 'supported' | 'unsupported' | 'active' | 'error';

export const ARMode: React.FC<ARModeProps> = ({
  isOpen,
  onClose,
  params,
}) => {
  const [status, setStatus] = useState<ARStatus>('checking');
  const [errorMessage, setErrorMessage] = useState('');
  const xrSessionRef = useRef<XRSession | null>(null);

  // Check WebXR support
  useEffect(() => {
    if (!isOpen) return;

    const checkSupport = async () => {
      setStatus('checking');
      
      if (!navigator.xr) {
        setStatus('unsupported');
        setErrorMessage('WebXR is not supported in this browser. Try Chrome on Android or Safari on iOS.');
        return;
      }

      try {
        const isSupported = await navigator.xr.isSessionSupported('immersive-ar');
        setStatus(isSupported ? 'supported' : 'unsupported');
        if (!isSupported) {
          setErrorMessage('AR mode is not supported on this device. Try on a mobile device with AR capabilities.');
        }
      } catch (error) {
        setStatus('unsupported');
        setErrorMessage('Failed to check AR support. Please try again.');
      }
    };

    checkSupport();

    return () => {
      endSession();
    };
  }, [isOpen]);

  const startSession = useCallback(async () => {
    if (!navigator.xr) return;

    try {
      setStatus('active');
      
      const session = await navigator.xr.requestSession('immersive-ar', {
        requiredFeatures: ['hit-test', 'dom-overlay'],
        domOverlay: { root: document.body },
      });

      xrSessionRef.current = session;

      session.addEventListener('end', () => {
        setStatus('supported');
        xrSessionRef.current = null;
      });

      // Here you would set up the WebXR render loop
      // For a full implementation, you'd integrate with Three.js XR
      
      // Simplified: just show we're in AR mode
      console.log('AR Session started with params:', params);
      
    } catch (error) {
      console.error('AR session error:', error);
      setStatus('error');
      setErrorMessage('Failed to start AR session. Please ensure camera permissions are granted.');
    }
  }, [params]);

  const endSession = useCallback(() => {
    if (xrSessionRef.current) {
      xrSessionRef.current.end();
      xrSessionRef.current = null;
    }
    setStatus('supported');
  }, []);

  const getStatusContent = () => {
    switch (status) {
      case 'checking':
        return (
          <div className="text-center py-8">
            <div className="w-12 h-12 mx-auto mb-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            <p>Checking AR support...</p>
          </div>
        );

      case 'unsupported':
        return (
          <div className="text-center py-8">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-yellow-400" />
            <h3 className="font-display text-lg font-bold mb-2">AR Not Available</h3>
            <p className="text-white/60 text-sm mb-4">{errorMessage}</p>
            <div className="p-4 bg-white/5 rounded-xl text-left">
              <p className="text-xs font-mono uppercase tracking-widest opacity-60 mb-2">Requirements</p>
              <ul className="text-sm space-y-1 text-white/70">
                <li>• Chrome on Android (ARCore)</li>
                <li>• Safari on iOS (ARKit)</li>
                <li>• Camera permissions</li>
              </ul>
            </div>
          </div>
        );

      case 'supported':
        return (
          <div className="text-center py-8">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Camera className="w-10 h-10" />
            </div>
            <h3 className="font-display text-lg font-bold mb-2">AR Ready</h3>
            <p className="text-white/60 text-sm mb-6">
              Place your emotion visualization in the real world
            </p>
            
            {/* Preview */}
            <div className="mb-6 p-4 bg-white/5 rounded-xl">
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-lg"
                  style={{
                    background: `radial-gradient(circle, ${params.color} 0%, #000 100%)`,
                  }}
                />
                <div className="text-left">
                  <p className="font-medium">{params.phrase}</p>
                  <p className="text-xs text-white/50">{params.explanation}</p>
                </div>
              </div>
            </div>

            <button
              onClick={startSession}
              className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium rounded-lg hover:opacity-90 transition-opacity"
            >
              <Smartphone className="w-5 h-5" />
              Start AR Experience
            </button>
          </div>
        );

      case 'active':
        return (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
              <Check className="w-8 h-8 text-green-400" />
            </div>
            <h3 className="font-display text-lg font-bold mb-2">AR Active</h3>
            <p className="text-white/60 text-sm mb-6">
              Point your camera at a surface to place the visualization
            </p>
            
            <div className="space-y-3">
              <div className="p-3 bg-white/5 rounded-lg text-sm">
                <p className="font-medium">Instructions:</p>
                <ul className="mt-2 space-y-1 text-white/60 text-left">
                  <li>• Move your device slowly</li>
                  <li>• Look for flat surfaces</li>
                  <li>• Tap to place visualization</li>
                  <li>• Pinch to resize</li>
                </ul>
              </div>
              
              <button
                onClick={endSession}
                className="w-full py-2 border border-white/20 rounded-lg hover:bg-white/5 transition-colors"
              >
                Exit AR Mode
              </button>
            </div>
          </div>
        );

      case 'error':
        return (
          <div className="text-center py-8">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-400" />
            <h3 className="font-display text-lg font-bold mb-2">AR Error</h3>
            <p className="text-white/60 text-sm mb-4">{errorMessage}</p>
            <button
              onClick={() => setStatus('supported')}
              className="px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
            >
              Try Again
            </button>
          </div>
        );

      default:
        return null;
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
            className="relative w-full max-w-sm mx-4 bg-[#0a0a0a] border border-white/10 rounded-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5" />
                <h3 className="font-display text-lg font-bold">AR Mode</h3>
              </div>
              <button
                onClick={onClose}
                className="p-1 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              {getStatusContent()}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
