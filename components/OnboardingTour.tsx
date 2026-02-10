// Onboarding Tour Component - First-time user walkthrough
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, ChevronLeft, Sparkles, Check } from 'lucide-react';
import { ONBOARDING_STEPS } from '../types';

interface OnboardingTourProps {
  onComplete: () => void;
}

const STORAGE_KEY = 'aetheria_onboarding_complete';

export const OnboardingTour: React.FC<OnboardingTourProps> = ({ onComplete }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [highlightPosition, setHighlightPosition] = useState<DOMRect | null>(null);

  // Check if onboarding was completed
  useEffect(() => {
    const completed = localStorage.getItem(STORAGE_KEY);
    if (!completed) {
      // Small delay to let the page render
      setTimeout(() => setIsVisible(true), 1000);
    }
  }, []);

  // Update highlight position when step changes
  useEffect(() => {
    if (!isVisible) return;

    const step = ONBOARDING_STEPS[currentStep];
    if (step && step.target !== 'body') {
      const element = document.querySelector(step.target);
      if (element) {
        const rect = element.getBoundingClientRect();
        setHighlightPosition(rect);
      } else {
        setHighlightPosition(null);
      }
    } else {
      setHighlightPosition(null);
    }
  }, [currentStep, isVisible]);

  const handleNext = useCallback(() => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleComplete();
    }
  }, [currentStep]);

  const handlePrev = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  const handleSkip = useCallback(() => {
    handleComplete();
  }, []);

  const handleComplete = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setIsVisible(false);
    onComplete();
  }, [onComplete]);

  if (!isVisible) return null;

  const step = ONBOARDING_STEPS[currentStep];
  const isLastStep = currentStep === ONBOARDING_STEPS.length - 1;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[300]"
      >
        {/* Backdrop with cutout */}
        <div className="absolute inset-0">
          {highlightPosition ? (
            <svg className="absolute inset-0 w-full h-full">
              <defs>
                <mask id="spotlight">
                  <rect x="0" y="0" width="100%" height="100%" fill="white" />
                  <rect
                    x={highlightPosition.left - 8}
                    y={highlightPosition.top - 8}
                    width={highlightPosition.width + 16}
                    height={highlightPosition.height + 16}
                    rx="12"
                    fill="black"
                  />
                </mask>
              </defs>
              <rect
                x="0"
                y="0"
                width="100%"
                height="100%"
                fill="rgba(0,0,0,0.85)"
                mask="url(#spotlight)"
              />
            </svg>
          ) : (
            <div className="absolute inset-0 bg-black/85" />
          )}
        </div>

        {/* Highlight ring */}
        {highlightPosition && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute pointer-events-none"
            style={{
              left: highlightPosition.left - 8,
              top: highlightPosition.top - 8,
              width: highlightPosition.width + 16,
              height: highlightPosition.height + 16,
            }}
          >
            <div className="absolute inset-0 rounded-xl border-2 border-white/50 animate-pulse" />
          </motion.div>
        )}

        {/* Content Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="absolute left-1/2 bottom-24 -translate-x-1/2 w-full max-w-sm mx-4"
          style={{
            ...(highlightPosition && highlightPosition.top > window.innerHeight / 2
              ? { bottom: 'auto', top: highlightPosition.top - 20, transform: 'translate(-50%, -100%)' }
              : {}),
          }}
        >
          <div className="bg-[#0a0a0a] border border-white/20 rounded-2xl p-6 shadow-2xl">
            {/* Step indicator */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-400" />
                <span className="text-xs font-mono uppercase tracking-widest text-white/50">
                  Step {currentStep + 1} of {ONBOARDING_STEPS.length}
                </span>
              </div>
              <button
                onClick={handleSkip}
                className="text-xs text-white/40 hover:text-white/60 transition-colors"
              >
                Skip tour
              </button>
            </div>

            {/* Progress bar */}
            <div className="flex gap-1 mb-6">
              {ONBOARDING_STEPS.map((_, i) => (
                <div
                  key={i}
                  className={`flex-1 h-1 rounded-full transition-colors ${
                    i <= currentStep ? 'bg-purple-500' : 'bg-white/10'
                  }`}
                />
              ))}
            </div>

            {/* Content */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-3"
              >
                <h3 className="font-display text-xl font-bold">{step.title}</h3>
                <p className="text-white/60">{step.description}</p>
              </motion.div>
            </AnimatePresence>

            {/* Navigation */}
            <div className="flex items-center justify-between mt-6">
              <button
                onClick={handlePrev}
                disabled={currentStep === 0}
                className="flex items-center gap-1 px-3 py-2 text-sm text-white/60 hover:text-white disabled:opacity-30 disabled:hover:text-white/60 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>

              <button
                onClick={handleNext}
                className={`flex items-center gap-2 px-5 py-2 rounded-full font-medium transition-colors ${
                  isLastStep
                    ? 'bg-purple-500 hover:bg-purple-600 text-white'
                    : 'bg-white text-black hover:bg-white/90'
                }`}
              >
                {isLastStep ? (
                  <>
                    Get Started
                    <Check className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// Hook to trigger onboarding
export function useOnboarding() {
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    const completed = localStorage.getItem(STORAGE_KEY);
    if (!completed) {
      setShowOnboarding(true);
    }
  }, []);

  const resetOnboarding = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setShowOnboarding(true);
  }, []);

  const completeOnboarding = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setShowOnboarding(false);
  }, []);

  return { showOnboarding, resetOnboarding, completeOnboarding };
}
