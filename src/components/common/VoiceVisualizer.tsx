"use client";

import React from "react";
import { motion } from "framer-motion";

export const VoiceVisualizer: React.FC<{ isListening: boolean }> = ({ isListening }) => {
  if (!isListening) return null;

  return (
    <div className="flex items-center justify-center gap-1 h-8 px-4">
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={i}
          animate={{
            height: [8, 24, 8],
          }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            delay: i * 0.1,
            ease: "easeInOut",
          }}
          className="w-1.5 bg-blue-500 rounded-full"
        />
      ))}
      <span className="ml-3 text-xs font-mono text-blue-400 animate-pulse uppercase tracking-widest">
        Listening...
      </span>
    </div>
  );
};
