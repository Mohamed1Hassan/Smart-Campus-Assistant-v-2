"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../../contexts/ThemeContext";

export const ThemeTransitionOverlay: React.FC = () => {
  const { transitionData } = useTheme();

  if (!transitionData) return null;

  const targetColor = transitionData.targetTheme === "dark" ? "#030303" : "#ffffff";
  const secondaryColor = transitionData.targetTheme === "dark" ? "#1e1e1e" : "#f0f0f0";

  return (
    <AnimatePresence>
      {transitionData.isTransitioning && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[10000] pointer-events-none overflow-hidden"
        >
          {/* Origin Glow Pulse */}
          <motion.div
            initial={{ scale: 0, opacity: 0.8 }}
            animate={{ scale: 4, opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            style={{ 
              left: transitionData.x, 
              top: transitionData.y,
              backgroundColor: transitionData.targetTheme === "dark" ? "#3b82f6" : "#6366f1"
            }}
            className="absolute w-20 h-20 -left-10 -top-10 rounded-full blur-3xl"
          />

          {/* Secondary "Shadow" Wave for Depth */}
          <motion.div
            initial={{ 
              clipPath: `circle(0% at ${transitionData.x}px ${transitionData.y}px)` 
            }}
            animate={{ 
              clipPath: `circle(150% at ${transitionData.x}px ${transitionData.y}px)` 
            }}
            transition={{ 
              type: "spring",
              damping: 35,
              stiffness: 100,
              restDelta: 0.001,
              delay: 0.05
            }}
            style={{ backgroundColor: secondaryColor, opacity: 0.4 }}
            className="absolute inset-0 blur-[2px]"
          />

          {/* Primary Liquid Wave */}
          <motion.div
            initial={{ 
              clipPath: `circle(0% at ${transitionData.x}px ${transitionData.y}px)` 
            }}
            animate={{ 
              clipPath: `circle(150% at ${transitionData.x}px ${transitionData.y}px)` 
            }}
            transition={{ 
              type: "spring",
              damping: 30,
              stiffness: 90,
              restDelta: 0.001
            }}
            style={{ backgroundColor: targetColor }}
            className="absolute inset-0"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ThemeTransitionOverlay;
