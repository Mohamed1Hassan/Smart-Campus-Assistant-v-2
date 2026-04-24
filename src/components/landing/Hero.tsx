"use client";

import React from "react";
import { motion } from "framer-motion";
import { ArrowRight, Shield, Zap, Cpu } from "lucide-react";
import Link from "next/link";

export const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#020202] pt-12">
      {/* Premium Background Effects - Enhanced with more vibrant glows */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/20 blur-[140px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-600/20 blur-[140px] rounded-full animate-pulse delay-700" />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Side Feature (Desktop) */}
          <div className="hidden lg:flex lg:col-span-3 flex-col gap-8 relative">
            {/* Soft Glow behind card */}
            <div className="absolute -inset-10 bg-blue-500/5 blur-[80px] rounded-full" />
            <motion.div
              initial={{ x: -50, opacity: 0 }}
              animate={{ 
                x: 0, 
                opacity: 1,
                y: [0, -20, 0] 
              }}
              whileHover={{ scale: 1.05, rotateY: -10 }}
              transition={{ 
                x: { duration: 0.8, delay: 0.5 },
                opacity: { duration: 0.8, delay: 0.5 },
                y: { duration: 6, repeat: Infinity, ease: "easeInOut" }
              }}
              className="relative p-8 bg-white/[0.02] backdrop-blur-3xl border border-white/[0.08] rounded-[2.5rem] shadow-2xl hover:border-blue-500/40 transition-all group overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Shield className="text-blue-400 w-7 h-7" />
              </div>
              <h2 className="text-white text-xl font-bold mb-3">Biometric Shield</h2>
              <p className="text-gray-400 text-sm leading-relaxed opacity-90">Advanced Face ID verification for guaranteed attendance integrity.</p>
            </motion.div>
          </div>

          {/* Center Content (Always Hero) */}
          <div className="lg:col-span-6 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-xl mb-10"
            >
              <div className="flex -space-x-2">
                {[1,2,3].map(i => (
                  <div key={i} className="w-6 h-6 rounded-full border-2 border-[#020202] bg-gray-800 flex items-center justify-center text-[8px] font-bold text-white">
                    {i}
                  </div>
                ))}
              </div>
              <span className="text-[10px] font-bold text-blue-300 tracking-[0.2em] uppercase ml-2">
                Trusted by 50+ Academies
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.05 }}
              className="text-6xl md:text-[88px] font-black tracking-tighter text-white mb-10 leading-[1.1] drop-shadow-[0_10px_25px_rgba(0,0,0,0.5)]"
            >
              Elevate Your <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-br from-blue-400 via-indigo-400 to-purple-500">
                Campus Experience
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-lg md:text-xl text-gray-400/70 max-w-lg mx-auto mb-12 leading-relaxed"
            >
              A state-of-the-art AI ecosystem designed for Thebes Academy. 
              Seamless attendance and intelligent assistance.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-5"
            >
              <Link href="/login" className="group relative w-full sm:w-auto">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl blur opacity-30 group-hover:opacity-60 transition duration-500" />
                <div className="relative px-10 py-5 bg-blue-600 text-white rounded-2xl font-black text-lg transition-all hover:bg-blue-700 flex items-center justify-center gap-2">
                  <span>Enter Portal</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
              
              <button className="w-full sm:w-auto px-10 py-5 bg-white/[0.03] backdrop-blur-3xl text-white border border-white/10 rounded-2xl font-black text-lg hover:bg-white/[0.08] transition-all hover:border-white/20">
                Watch Demo
              </button>
            </motion.div>
          </div>

          {/* Right Side Features (Desktop) */}
          <div className="hidden lg:flex lg:col-span-3 flex-col gap-6 relative">
            <div className="absolute -inset-10 bg-purple-500/5 blur-[80px] rounded-full" />
            
            <motion.div
              initial={{ x: 50, opacity: 0 }}
              animate={{ 
                x: 0, 
                opacity: 1,
                y: [0, 25, 0] 
              }}
              whileHover={{ scale: 1.05, rotateY: 10 }}
              transition={{ 
                x: { duration: 0.8, delay: 0.7 },
                opacity: { duration: 0.8, delay: 0.7 },
                y: { duration: 7, repeat: Infinity, ease: "easeInOut", delay: 0.5 }
              }}
              className="relative p-8 bg-white/[0.02] backdrop-blur-3xl border border-white/[0.08] rounded-[2.5rem] shadow-2xl hover:border-purple-500/40 transition-all group overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="w-14 h-14 bg-purple-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Cpu className="text-purple-400 w-7 h-7" />
              </div>
              <h2 className="text-white text-xl font-bold mb-3">AI Coordinator</h2>
              <p className="text-gray-400 text-sm leading-relaxed opacity-90">24/7 intelligent assistant helping students manage academic life.</p>
            </motion.div>

            <motion.div
              initial={{ x: 50, opacity: 0 }}
              animate={{ 
                x: 0, 
                opacity: 1,
                y: [0, -15, 0] 
              }}
              whileHover={{ scale: 1.05, rotateY: 10 }}
              transition={{ 
                x: { duration: 0.8, delay: 0.9 },
                opacity: { duration: 0.8, delay: 0.9 },
                y: { duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }
              }}
              className="relative p-8 bg-white/[0.02] backdrop-blur-3xl border border-white/[0.08] rounded-[2.5rem] shadow-2xl hover:border-emerald-500/40 transition-all group overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Zap className="text-emerald-400 w-7 h-7" />
              </div>
              <h2 className="text-white text-xl font-bold mb-3">Instant Sync</h2>
              <p className="text-gray-400 text-sm leading-relaxed opacity-90">Real-time attendance and grade updates powered by Supabase.</p>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Decorative Floor */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
    </section>
  );
};
