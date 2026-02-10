import React from 'react';
import { motion } from 'framer-motion';
import { Volume2, VolumeX } from 'lucide-react';

interface FooterProps {
  soundEnabled?: boolean;
  onToggleSound?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ soundEnabled = false, onToggleSound }) => {
  return (
    <footer className="fixed bottom-0 left-0 w-full px-8 py-8 flex justify-between items-end z-40 pointer-events-none text-[#555]">
       <motion.div 
         initial={{ opacity: 0 }}
         animate={{ opacity: 1 }}
         transition={{ delay: 1, duration: 1 }}
         className="hidden md:block"
       >
         <p className="text-[10px] uppercase tracking-widest font-mono">
           Created by<br/>
           George Akidima
         </p>
       </motion.div>

       {/* Center - Sound Toggle */}
       <motion.div
         initial={{ opacity: 0 }}
         animate={{ opacity: 1 }}
         transition={{ delay: 1.1, duration: 1 }}
         className="absolute left-1/2 -translate-x-1/2 bottom-8"
       >
         <button
           onClick={onToggleSound}
           className="pointer-events-auto flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 hover:border-white/30 bg-black/30 backdrop-blur-sm transition-all group"
         >
           {soundEnabled ? (
             <Volume2 className="w-4 h-4 text-white/60 group-hover:text-white transition-colors" />
           ) : (
             <VolumeX className="w-4 h-4 text-white/40 group-hover:text-white/60 transition-colors" />
           )}
           <span className="text-[10px] uppercase tracking-widest font-mono text-white/40 group-hover:text-white/60 transition-colors">
             Sound {soundEnabled ? 'On' : 'Off'} [M]
           </span>
         </button>
       </motion.div>

       <motion.div 
         initial={{ opacity: 0 }}
         animate={{ opacity: 1 }}
         transition={{ delay: 1.2, duration: 1 }}
         className="text-right"
       >
          <p className="text-[10px] uppercase tracking-widest font-mono">
            Powered by Groq<br/>
            &copy; 2026
          </p>
       </motion.div>
    </footer>
  );
};
