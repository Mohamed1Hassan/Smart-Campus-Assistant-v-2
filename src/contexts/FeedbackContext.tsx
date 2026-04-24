"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

type FeedbackType = "success" | "error" | "hologram";

interface FeedbackContextType {
  triggerFeedback: (type: FeedbackType, message?: string) => void;
}

const FeedbackContext = createContext<FeedbackContextType | undefined>(undefined);

export const FeedbackProvider = ({ children }: { children: ReactNode }) => {
  const [activeFeedback, setActiveFeedback] = useState<{ type: FeedbackType; message?: string } | null>(null);

  const triggerFeedback = (type: FeedbackType, message?: string) => {
    setActiveFeedback({ type, message });
    setTimeout(() => setActiveFeedback(null), 3000);
  };

  return (
    <FeedbackContext.Provider value={{ triggerFeedback }}>
      {children}
      <FeedbackOverlay active={activeFeedback} />
    </FeedbackContext.Provider>
  );
};

export const useFeedback = () => {
  const context = useContext(FeedbackContext);
  if (!context) throw new Error("useFeedback must be used within FeedbackProvider");
  return context;
};

import { motion, AnimatePresence } from "framer-motion";
import { Check } from "lucide-react";

const FeedbackOverlay = ({ active }: { active: { type: FeedbackType; message?: string } | null }) => {
  return (
    <AnimatePresence>
      {active && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[11000] pointer-events-none flex items-center justify-center"
        >
          {active.type === "success" && (
            <div className="relative">
              {/* Particle Burst Simulation */}
              {[...Array(12)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 0, x: 0, y: 0 }}
                  animate={{ 
                    scale: [0, 1, 0],
                    x: Math.cos(i * 30 * (Math.PI / 180)) * 150,
                    y: Math.sin(i * 30 * (Math.PI / 180)) * 150,
                  }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className="absolute w-3 h-3 bg-blue-500 rounded-full blur-[2px]"
                />
              ))}

              <motion.div
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
                className="w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(37,99,235,0.6)] border-4 border-white/20"
              >
                <Check className="text-white w-12 h-12 stroke-[3px]" />
              </motion.div>
              
              {active.message && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute top-32 left-1/2 -translate-x-1/2 whitespace-nowrap text-white font-bold text-xl tracking-tight bg-black/40 backdrop-blur-md px-6 py-2 rounded-full border border-white/10"
                >
                  {active.message}
                </motion.div>
              )}
            </div>
          )}

          {active.type === "hologram" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative w-64 h-64 border-2 border-blue-500/30 rounded-xl overflow-hidden"
            >
                {/* Holographic Scan Effect */}
                <motion.div 
                    animate={{ y: ["-100%", "100%"] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-x-0 h-1 bg-blue-400 shadow-[0_0_15px_rgba(96,165,250,0.8)] z-10"
                />
                <div className="absolute inset-0 bg-blue-500/5 backdrop-blur-[2px]" />
                <div className="flex flex-col items-center justify-center h-full gap-4">
                    <div className="w-16 h-16 border-4 border-blue-500 rounded-full border-t-transparent animate-spin" />
                    <span className="text-blue-400 font-mono text-xs animate-pulse tracking-widest">BIOMETRIC SCANNING...</span>
                </div>
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};
