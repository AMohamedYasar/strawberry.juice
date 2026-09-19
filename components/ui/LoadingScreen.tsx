"use client";
import { motion, AnimatePresence } from "framer-motion";

export default function LoadingScreen({ progress, isLoaded }: { progress: number, isLoaded: boolean }) {
  return (
    <AnimatePresence>
      {!isLoaded && (
        <motion.div 
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-luxury-black text-white"
        >
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 text-3xl font-light tracking-[0.3em] font-sans text-brand-coral"
          >
            PURE.
          </motion.div>
          <div className="w-64 h-[1px] bg-white/10 overflow-hidden">
            <motion.div 
              className="h-full bg-brand-red"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.2 }}
            />
          </div>
          <div className="mt-4 text-xs tracking-widest text-white/50 font-sans">{progress}%</div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
