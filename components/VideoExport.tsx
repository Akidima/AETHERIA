// Video Export Component - Record visualization loops
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Video, Download, Play, Square, Loader2 } from 'lucide-react';
import { ExportConfig } from '../types';

interface VideoExportProps {
  isOpen: boolean;
  onClose: () => void;
}

type RecordingState = 'idle' | 'countdown' | 'recording' | 'processing' | 'complete';

export const VideoExport: React.FC<VideoExportProps> = ({
  isOpen,
  onClose,
}) => {
  const [state, setState] = useState<RecordingState>('idle');
  const [countdown, setCountdown] = useState(3);
  const [progress, setProgress] = useState(0);
  const [config, setConfig] = useState<ExportConfig>({
    format: 'webm',
    duration: 5,
    quality: 'medium',
    fps: 30,
    width: 1080,
    height: 1080,
  });
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const canvasStreamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (downloadUrl) URL.revokeObjectURL(downloadUrl);
      if (canvasStreamRef.current) {
        canvasStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [downloadUrl]);

  const startRecording = useCallback(async () => {
    const canvas = document.querySelector('canvas');
    if (!canvas) {
      alert('Canvas not found');
      return;
    }

    // Start countdown
    setState('countdown');
    setCountdown(3);

    for (let i = 3; i > 0; i--) {
      setCountdown(i);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Start recording
    setState('recording');
    setProgress(0);
    chunksRef.current = [];

    try {
      // Get canvas stream
      const stream = canvas.captureStream(config.fps);
      canvasStreamRef.current = stream;

      // Create MediaRecorder
      const mimeType = config.format === 'webm' ? 'video/webm;codecs=vp9' : 'video/mp4';
      const recorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported(mimeType) ? mimeType : 'video/webm',
        videoBitsPerSecond: config.quality === 'high' ? 8000000 : config.quality === 'medium' ? 4000000 : 2000000,
      });

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        setState('processing');
        
        // Create blob and download URL
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        setDownloadUrl(url);
        setState('complete');
      };

      mediaRecorderRef.current = recorder;
      recorder.start(100); // Capture in 100ms chunks

      // Progress timer
      const startTime = Date.now();
      const durationMs = config.duration * 1000;

      timerRef.current = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const currentProgress = Math.min((elapsed / durationMs) * 100, 100);
        setProgress(currentProgress);

        if (elapsed >= durationMs) {
          stopRecording();
        }
      }, 100);

    } catch (error) {
      console.error('Failed to start recording:', error);
      setState('idle');
      alert('Failed to start recording. Please try again.');
    }
  }, [config]);

  const stopRecording = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    if (canvasStreamRef.current) {
      canvasStreamRef.current.getTracks().forEach(track => track.stop());
    }
  }, []);

  const handleDownload = useCallback(() => {
    if (!downloadUrl) return;

    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = `aetheria-${Date.now()}.${config.format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, [downloadUrl, config.format]);

  const resetExport = useCallback(() => {
    if (downloadUrl) {
      URL.revokeObjectURL(downloadUrl);
    }
    setDownloadUrl(null);
    setState('idle');
    setProgress(0);
  }, [downloadUrl]);

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
                <Video className="w-5 h-5" />
                <h3 className="font-display text-lg font-bold">Export Video</h3>
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
              {state === 'idle' && (
                <div className="space-y-4">
                  {/* Duration */}
                  <div className="space-y-2">
                    <label className="text-xs font-mono uppercase tracking-widest opacity-60">Duration</label>
                    <div className="flex gap-2">
                      {[3, 5, 10, 15].map((d) => (
                        <button
                          key={d}
                          onClick={() => setConfig(prev => ({ ...prev, duration: d }))}
                          className={`flex-1 py-2 text-sm rounded-lg border transition-colors ${
                            config.duration === d
                              ? 'border-white/30 bg-white/10'
                              : 'border-white/10 hover:border-white/20'
                          }`}
                        >
                          {d}s
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Quality */}
                  <div className="space-y-2">
                    <label className="text-xs font-mono uppercase tracking-widest opacity-60">Quality</label>
                    <div className="flex gap-2">
                      {(['low', 'medium', 'high'] as const).map((q) => (
                        <button
                          key={q}
                          onClick={() => setConfig(prev => ({ ...prev, quality: q }))}
                          className={`flex-1 py-2 text-sm rounded-lg border transition-colors capitalize ${
                            config.quality === q
                              ? 'border-white/30 bg-white/10'
                              : 'border-white/10 hover:border-white/20'
                          }`}
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* FPS */}
                  <div className="space-y-2">
                    <label className="text-xs font-mono uppercase tracking-widest opacity-60">Frame Rate</label>
                    <div className="flex gap-2">
                      {([15, 30, 60] as const).map((fps) => (
                        <button
                          key={fps}
                          onClick={() => setConfig(prev => ({ ...prev, fps }))}
                          className={`flex-1 py-2 text-sm rounded-lg border transition-colors ${
                            config.fps === fps
                              ? 'border-white/30 bg-white/10'
                              : 'border-white/10 hover:border-white/20'
                          }`}
                        >
                          {fps} FPS
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Start Button */}
                  <button
                    onClick={startRecording}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg transition-colors mt-4"
                  >
                    <Video className="w-5 h-5" />
                    Start Recording
                  </button>
                </div>
              )}

              {state === 'countdown' && (
                <div className="text-center py-8">
                  <motion.div
                    key={countdown}
                    initial={{ scale: 2, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.5, opacity: 0 }}
                    className="text-8xl font-display font-bold"
                  >
                    {countdown}
                  </motion.div>
                  <p className="text-white/50 mt-4">Get ready...</p>
                </div>
              )}

              {state === 'recording' && (
                <div className="text-center py-8">
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                    <span className="text-red-400 font-medium">Recording</span>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden mb-4">
                    <motion.div
                      className="h-full bg-red-500"
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                    />
                  </div>
                  
                  <p className="text-white/50 text-sm">
                    {Math.ceil((config.duration * (100 - progress)) / 100)}s remaining
                  </p>

                  <button
                    onClick={stopRecording}
                    className="mt-4 flex items-center justify-center gap-2 px-6 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors mx-auto"
                  >
                    <Square className="w-4 h-4" />
                    Stop Early
                  </button>
                </div>
              )}

              {state === 'processing' && (
                <div className="text-center py-8">
                  <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin" />
                  <p className="text-white/70">Processing video...</p>
                </div>
              )}

              {state === 'complete' && downloadUrl && (
                <div className="text-center py-8">
                  <div className="w-16 h-16 mx-auto mb-4 bg-green-500/20 rounded-full flex items-center justify-center">
                    <Video className="w-8 h-8 text-green-400" />
                  </div>
                  <p className="font-medium mb-4">Video Ready!</p>
                  
                  {/* Preview */}
                  <video
                    src={downloadUrl}
                    className="w-full max-w-xs mx-auto rounded-lg mb-4"
                    autoPlay
                    loop
                    muted
                    playsInline
                  />

                  <div className="flex gap-2">
                    <button
                      onClick={resetExport}
                      className="flex-1 py-2 text-sm border border-white/10 rounded-lg hover:bg-white/5 transition-colors"
                    >
                      Record Again
                    </button>
                    <button
                      onClick={handleDownload}
                      className="flex-1 flex items-center justify-center gap-2 py-2 bg-white text-black font-medium rounded-lg hover:bg-white/90 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
