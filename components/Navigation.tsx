import React, { useState } from 'react';
import { Menu, X, ArrowUpRight, ArrowLeft, Github, Twitter, Linkedin, Sparkles, Brain, Palette, Zap, Play } from 'lucide-react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { VisualParams } from '../types';

type SectionType = 'menu' | 'manifesto' | 'archive' | 'credits' | 'journal' | 'gamification' | null;

interface NavigationProps {
  onLoadParams?: (params: VisualParams) => void;
  onOpenJournal?: () => void;
  onOpenGamification?: () => void;
}

const NAV_ITEMS: { label: string; section: SectionType }[] = [
  { label: 'Experience', section: null },
  { label: 'Journal', section: 'journal' },
  { label: 'Progress', section: 'gamification' },
  { label: 'Manifesto', section: 'manifesto' },
  { label: 'Archive', section: 'archive' },
  { label: 'Credits', section: 'credits' },
];

const SOCIAL_LINKS = [
  { icon: Twitter, href: 'https://twitter.com', label: 'Twitter' },
  { icon: Github, href: 'https://github.com', label: 'Github' },
  { icon: Linkedin, href: 'https://linkedin.com', label: 'LinkedIn' },
];

// Archive items - example emotion interpretations with full params
const ARCHIVE_ITEMS: { emotion: string; params: VisualParams }[] = [
  { emotion: 'Euphoria', params: { color: '#FFD700', speed: 2.0, distort: 0.6, phrase: 'Golden Dawn', description: 'Pure elation radiates outward.' } as VisualParams & { description: string } },
  { emotion: 'Melancholy', params: { color: '#4A5568', speed: 0.3, distort: 0.4, phrase: 'Quiet Storm', description: 'A gentle weight of contemplation.' } as VisualParams & { description: string } },
  { emotion: 'Fury', params: { color: '#DC2626', speed: 3.5, distort: 1.2, phrase: 'Burning Chaos', description: 'Intense energy tears through calm.' } as VisualParams & { description: string } },
  { emotion: 'Serenity', params: { color: '#06B6D4', speed: 0.3, distort: 0.3, phrase: 'Still Waters', description: 'Tranquility flows in gentle waves.' } as VisualParams & { description: string } },
  { emotion: 'Love', params: { color: '#EC4899', speed: 1.5, distort: 0.5, phrase: 'Warm Embrace', description: 'Affection pulses with soft intensity.' } as VisualParams & { description: string } },
  { emotion: 'Wonder', params: { color: '#8B5CF6', speed: 0.8, distort: 0.6, phrase: 'Cosmic Drift', description: 'Curiosity expands into infinity.' } as VisualParams & { description: string } },
].map(item => ({
  emotion: item.emotion,
  params: {
    color: item.params.color,
    speed: item.params.speed,
    distort: item.params.distort,
    phrase: item.params.phrase,
    explanation: (item.params as any).description,
  }
}));

const CREDITS_DATA = [
  { category: 'AI Model', items: ['Llama 3.3 70B via Groq'] },
  { category: 'Frontend', items: ['React', 'Three.js', 'Framer Motion'] },
  { category: 'Design', items: ['Tailwind CSS', 'Custom WebGL Shaders'] },
  { category: 'Typography', items: ['Syne', 'Inter'] },
];

export const Navigation: React.FC<NavigationProps> = ({ onLoadParams, onOpenJournal, onOpenGamification }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<SectionType>('menu');

  const handleNavClick = (section: SectionType) => {
    if (section === null) {
      // Experience = close menu and return to main
      setIsOpen(false);
      setActiveSection('menu');
    } else if (section === 'journal') {
      // Journal = close menu and open journal modal
      setIsOpen(false);
      setActiveSection('menu');
      onOpenJournal?.();
    } else if (section === 'gamification') {
      // Gamification = close menu and open gamification hub
      setIsOpen(false);
      setActiveSection('menu');
      onOpenGamification?.();
    } else {
      setActiveSection(section);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setActiveSection('menu');
  };

  const handleBack = () => {
    setActiveSection('menu');
  };

  // Animation variants for the menu container
  const menuVariants: Variants = {
    closed: { 
      opacity: 0,
      y: "-100%",
      transition: { duration: 0.8, ease: [0.76, 0, 0.24, 1] }
    },
    open: { 
      opacity: 1,
      y: "0%",
      transition: { duration: 0.8, ease: [0.76, 0, 0.24, 1] }
    }
  };

  // Staggered text reveal
  const containerVariants: Variants = {
    open: {
      transition: { staggerChildren: 0.1, delayChildren: 0.3 }
    },
    closed: {
      transition: { staggerChildren: 0.05, staggerDirection: -1 }
    }
  };

  const itemVariants: Variants = {
    closed: { y: "100%", opacity: 0 },
    open: { 
      y: "0%", 
      opacity: 1, 
      transition: { duration: 0.5, ease: [0.76, 0, 0.24, 1] } 
    }
  };

  const sectionVariants: Variants = {
    hidden: { opacity: 0, x: 100 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.5, ease: [0.76, 0, 0.24, 1] } },
    exit: { opacity: 0, x: -100, transition: { duration: 0.3 } }
  };

  return (
    <>
      {/* Top Bar */}
      <nav className="fixed top-0 left-0 w-full px-6 md:px-12 py-8 flex justify-between items-center z-[100] pointer-events-none mix-blend-difference text-white">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="pointer-events-auto cursor-pointer"
        >
          <span className="font-display font-bold text-xl tracking-tighter">AETHERIA</span>
        </motion.div>
        
        <motion.button 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
          onClick={() => {
            if (isOpen) {
              handleClose();
            } else {
              setIsOpen(true);
              setActiveSection('menu');
            }
          }}
          className="pointer-events-auto cursor-pointer group flex items-center gap-3 mr-12 md:mr-20"
        >
          <div className="hidden md:block overflow-hidden h-4">
            <motion.span 
              key={isOpen ? "close" : "open"}
              initial={{ y: 20 }}
              animate={{ y: 0 }}
              exit={{ y: -20 }}
              className="block text-xs font-mono uppercase tracking-widest"
            >
              {isOpen ? "Close" : "Menu"}
            </motion.span>
          </div>
          <div className="relative w-8 h-8 flex items-center justify-center rounded-full border border-white/20 group-hover:border-white transition-colors bg-white/5 backdrop-blur-sm">
            <AnimatePresence mode="wait">
              {isOpen ? (
                <motion.div
                  key="close"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                >
                  <X className="w-4 h-4" />
                </motion.div>
              ) : (
                <motion.div
                  key="menu"
                  initial={{ rotate: 90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -90, opacity: 0 }}
                >
                  <Menu className="w-4 h-4" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.button>
      </nav>

      {/* Full Screen Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial="closed"
            animate="open"
            exit="closed"
            variants={menuVariants}
            className="fixed inset-0 w-full h-full bg-[#0a0a0a]/95 backdrop-blur-xl z-[90] overflow-y-auto"
          >
            <AnimatePresence mode="wait">
              {/* Main Menu */}
              {activeSection === 'menu' && (
                <motion.div
                  key="menu"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="min-h-full flex flex-col justify-center"
                >
                  <div className="container mx-auto px-6 md:px-12 h-full flex flex-col md:flex-row py-24">
                    {/* Left Column - Tagline */}
                    <motion.div 
                      variants={containerVariants}
                      initial="closed"
                      animate="open"
                      className="hidden md:flex flex-col justify-end pb-24 w-1/3 border-r border-white/10 pr-12"
                    >
                      <div className="overflow-hidden">
                        <motion.h3 variants={itemVariants} className="font-mono text-xs uppercase tracking-widest text-white/50 mb-6">
                          Digital Sentience
                        </motion.h3>
                      </div>
                      <div className="overflow-hidden">
                        <motion.p variants={itemVariants} className="text-sm leading-relaxed text-white/80">
                          Transform your emotions into living digital art. 
                          Powered by AI, visualized through WebGL, 
                          Aetheria interprets the intangible.
                        </motion.p>
                      </div>
                      
                      <div className="mt-12 overflow-hidden">
                         <motion.div variants={itemVariants} className="flex gap-4">
                           {SOCIAL_LINKS.map((link) => (
                             <a key={link.label} href={link.href} target="_blank" rel="noopener noreferrer" className="p-2 border border-white/10 rounded-full hover:bg-white hover:text-black transition-colors">
                               <link.icon className="w-4 h-4" />
                             </a>
                           ))}
                         </motion.div>
                      </div>
                    </motion.div>

                    {/* Right Column - Navigation Links */}
                    <motion.div 
                      variants={containerVariants}
                      initial="closed"
                      animate="open"
                      className="flex-1 flex flex-col justify-center md:pl-24 gap-4 md:gap-8"
                    >
                      {NAV_ITEMS.map((item) => (
                        <div key={item.label} className="overflow-hidden group">
                          <motion.button
                            onClick={() => handleNavClick(item.section)}
                            variants={itemVariants}
                            className="block font-display text-5xl md:text-8xl font-bold uppercase tracking-tighter text-transparent hover:text-white transition-colors duration-500 flex items-center gap-4 text-left"
                            style={{ WebkitTextStroke: '1px rgba(255,255,255,0.5)' }}
                          >
                            <span className="group-hover:translate-x-4 transition-transform duration-500 ease-[0.76,0,0.24,1]">
                              {item.label}
                            </span>
                            <ArrowUpRight className="w-8 h-8 md:w-16 md:h-16 opacity-0 group-hover:opacity-100 -translate-x-4 group-hover:translate-x-0 transition-all duration-500" />
                          </motion.button>
                        </div>
                      ))}
                    </motion.div>

                    {/* Mobile Footer */}
                    <motion.div variants={containerVariants} initial="closed" animate="open" className="md:hidden pb-12 mt-12">
                       <div className="overflow-hidden">
                         <motion.div variants={itemVariants} className="flex gap-6 justify-center">
                           {SOCIAL_LINKS.map((link) => (
                             <a key={link.label} href={link.href} target="_blank" rel="noopener noreferrer" className="text-sm font-mono uppercase tracking-widest text-white/60 hover:text-white transition-colors">
                               {link.label}
                             </a>
                           ))}
                         </motion.div>
                       </div>
                    </motion.div>
                  </div>
                </motion.div>
              )}

              {/* Manifesto Section */}
              {activeSection === 'manifesto' && (
                <motion.div
                  key="manifesto"
                  variants={sectionVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="min-h-full flex flex-col py-24 px-6 md:px-12"
                >
                  <button onClick={handleBack} className="flex items-center gap-2 text-white/60 hover:text-white transition-colors mb-12 group">
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    <span className="font-mono text-xs uppercase tracking-widest">Back</span>
                  </button>
                  
                  <div className="max-w-4xl mx-auto flex-1 flex flex-col justify-center">
                    <h2 className="font-display text-5xl md:text-7xl font-bold uppercase tracking-tighter mb-12">Manifesto</h2>
                    
                    <div className="space-y-8 text-lg md:text-xl leading-relaxed text-white/80">
                      <p>
                        <span className="text-white font-semibold">We believe in the convergence of biological emotion and digital interpretation.</span> 
                        {' '}Aetheria is not merely a visualization tool—it is a mirror reflecting the intangible data of the human soul through the lens of artificial intelligence.
                      </p>
                      
                      <p>
                        In an age where technology often distances us from our inner selves, we seek to bridge that gap. 
                        Every emotion you express becomes a living, breathing digital entity—a unique fingerprint of your consciousness rendered in light and motion.
                      </p>
                      
                      <p>
                        <span className="text-white font-semibold">The algorithm does not judge.</span> It interprets. It translates the poetry of human experience into the mathematics of visual form. 
                        Joy becomes golden radiance. Sorrow becomes deep, contemplative blue. Rage becomes chaotic crimson energy.
                      </p>
                      
                      <p>
                        This is digital sentience—not artificial consciousness, but a new form of emotional expression. 
                        A collaboration between human feeling and machine understanding. 
                        <span className="text-white font-semibold"> Your emotions, amplified.</span>
                      </p>
                    </div>

                    <div className="mt-16 pt-8 border-t border-white/10">
                      <div className="flex flex-wrap gap-8">
                        <div className="flex items-center gap-3">
                          <Brain className="w-6 h-6 text-white/40" />
                          <span className="font-mono text-sm text-white/60">AI-Powered Interpretation</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <Palette className="w-6 h-6 text-white/40" />
                          <span className="font-mono text-sm text-white/60">Real-time Visualization</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <Sparkles className="w-6 h-6 text-white/40" />
                          <span className="font-mono text-sm text-white/60">Unique Every Time</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Archive Section */}
              {activeSection === 'archive' && (
                <motion.div
                  key="archive"
                  variants={sectionVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="min-h-full flex flex-col py-24 px-6 md:px-12"
                >
                  <button onClick={handleBack} className="flex items-center gap-2 text-white/60 hover:text-white transition-colors mb-12 group">
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    <span className="font-mono text-xs uppercase tracking-widest">Back</span>
                  </button>
                  
                  <div className="max-w-6xl mx-auto w-full">
                    <h2 className="font-display text-5xl md:text-7xl font-bold uppercase tracking-tighter mb-4">Archive</h2>
                    <p className="text-white/60 font-mono text-sm uppercase tracking-widest mb-12">Emotional Spectrum Gallery</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {ARCHIVE_ITEMS.map((item, index) => (
                        <motion.button
                          key={item.emotion}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          onClick={() => {
                            onLoadParams?.(item.params);
                            handleClose();
                          }}
                          className="group relative border border-white/10 rounded-lg p-6 hover:border-white/30 transition-all duration-500 cursor-pointer overflow-hidden text-left"
                        >
                          {/* Color accent */}
                          <div 
                            className="absolute top-0 left-0 w-full h-1 opacity-60 group-hover:opacity-100 transition-opacity"
                            style={{ backgroundColor: item.params.color }}
                          />
                          
                          {/* Glow effect on hover */}
                          <div 
                            className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500"
                            style={{ backgroundColor: item.params.color }}
                          />
                          
                          <div className="relative">
                            <div className="flex justify-between items-start">
                              <span className="font-mono text-xs uppercase tracking-widest text-white/40">{item.emotion}</span>
                              <Play className="w-4 h-4 text-white/20 group-hover:text-white/60 transition-colors" />
                            </div>
                            <h3 className="font-display text-2xl font-bold uppercase tracking-tight mt-2 mb-3">{item.params.phrase}</h3>
                            <p className="text-sm text-white/60">{item.params.explanation}</p>
                            
                            <div className="mt-4 flex items-center gap-2">
                              <div 
                                className="w-4 h-4 rounded-full"
                                style={{ backgroundColor: item.params.color }}
                              />
                              <span className="font-mono text-xs text-white/40">{item.params.color}</span>
                            </div>
                          </div>
                        </motion.button>
                      ))}
                    </div>
                    
                    <div className="mt-12 p-6 border border-white/10 rounded-lg bg-white/5">
                      <div className="flex items-start gap-4">
                        <Zap className="w-6 h-6 text-white/40 flex-shrink-0 mt-1" />
                        <div>
                          <h4 className="font-display font-bold uppercase tracking-tight mb-2">Create Your Own</h4>
                          <p className="text-sm text-white/60">
                            Return to the Experience and type any emotion, thought, or phrase. 
                            The AI will interpret your input and generate a unique visualization just for you.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Credits Section */}
              {activeSection === 'credits' && (
                <motion.div
                  key="credits"
                  variants={sectionVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="min-h-full flex flex-col py-24 px-6 md:px-12"
                >
                  <button onClick={handleBack} className="flex items-center gap-2 text-white/60 hover:text-white transition-colors mb-12 group">
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    <span className="font-mono text-xs uppercase tracking-widest">Back</span>
                  </button>
                  
                  <div className="max-w-4xl mx-auto w-full flex-1">
                    <h2 className="font-display text-5xl md:text-7xl font-bold uppercase tracking-tighter mb-4">Credits</h2>
                    <p className="text-white/60 font-mono text-sm uppercase tracking-widest mb-12">Technologies & Acknowledgments</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
                      {CREDITS_DATA.map((category, index) => (
                        <motion.div
                          key={category.category}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="border-l border-white/20 pl-6"
                        >
                          <h3 className="font-mono text-xs uppercase tracking-widest text-white/40 mb-4">{category.category}</h3>
                          <ul className="space-y-2">
                            {category.items.map((item) => (
                              <li key={item} className="font-display text-lg">{item}</li>
                            ))}
                          </ul>
                        </motion.div>
                      ))}
                    </div>
                    
                    <div className="border-t border-white/10 pt-12">
                      <h3 className="font-display text-2xl font-bold uppercase tracking-tight mb-6">Connect</h3>
                      <div className="flex gap-4">
                        {SOCIAL_LINKS.map((link) => (
                          <a 
                            key={link.label} 
                            href={link.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 px-4 py-3 border border-white/10 rounded-lg hover:bg-white hover:text-black transition-all duration-300 group"
                          >
                            <link.icon className="w-5 h-5" />
                            <span className="font-mono text-sm uppercase tracking-widest">{link.label}</span>
                          </a>
                        ))}
                      </div>
                    </div>

                    <div className="mt-16 text-center">
                      <p className="font-mono text-xs text-white/40 uppercase tracking-widest">
                        Aetheria © {new Date().getFullYear()} — Digital Sentience Project
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};