"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

export const InitialLoader: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Simulate loading progress
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => setLoading(false), 500);
          return 100;
        }
        return prev + Math.random() * 15;
      });
    }, 150);

    return () => clearInterval(interval);
  }, []);

  return (
    <AnimatePresence>
      {loading && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ 
            opacity: 0,
            transition: { duration: 0.8, ease: "easeInOut" }
          }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#0a0a0a]"
        >
          {/* Animated Background Elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <motion.div 
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.1, 0.2, 0.1]
              }}
              transition={{ duration: 8, repeat: Infinity }}
              className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-blue-600/20 blur-[120px]"
            />
            <motion.div 
              animate={{ 
                scale: [1, 1.3, 1],
                opacity: [0.1, 0.3, 0.1]
              }}
              transition={{ duration: 10, repeat: Infinity, delay: 1 }}
              className="absolute -bottom-[10%] -right-[10%] w-[50%] h-[50%] rounded-full bg-purple-600/20 blur-[120px]"
            />
          </div>

          {/* Main Content */}
          <div className="relative z-10 flex flex-col items-center">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="mb-8 relative"
            >
              <div className="w-24 h-24 md:w-32 md:h-32 relative">
                <Image
                  src="/icon.png"
                  alt="Smart Campus Logo"
                  fill
                  className="object-contain"
                  priority
                />
                {/* Outer Glow Ring */}
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                  className="absolute -inset-4 border-2 border-dashed border-blue-500/30 rounded-full"
                />
              </div>
            </motion.div>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="text-center"
            >
              <h1 className="text-3xl md:text-4xl font-bold tracking-tighter text-white mb-2">
                SMART <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">CAMPUS</span>
              </h1>
              <p className="text-gray-400 text-sm md:text-base font-medium tracking-widest uppercase opacity-70">
                Initializing Academic Portal
              </p>
            </motion.div>

            {/* Progress Bar Container */}
            <div className="mt-12 w-48 md:w-64 h-1 bg-white/10 rounded-full overflow-hidden relative">
              <motion.div
                className="h-full bg-gradient-to-r from-blue-500 to-purple-600"
                style={{ width: `${progress}%` }}
                initial={{ width: "0%" }}
                animate={{ width: `${progress}%` }}
              />
              {/* Animated Shine Effect */}
              <motion.div 
                animate={{ x: ["-100%", "200%"] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                className="absolute top-0 bottom-0 w-1/2 bg-gradient-to-r from-transparent via-white/20 to-transparent"
              />
            </div>

            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-4 text-[10px] text-gray-500 font-mono"
            >
              LOADING SYSTEM MODULES... {Math.round(progress)}%
            </motion.div>
          </div>
          
          {/* Bottom Footer Info */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="absolute bottom-8 text-gray-600 text-[10px] uppercase tracking-[0.2em]"
          >
            Powered by Thebes Academy AI
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default InitialLoader;
