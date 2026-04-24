"use client";

import React from "react";
import { motion } from "framer-motion";
import { 
  QrCode, 
  UserCheck, 
  Lock, 
  MessageSquareText, 
  ArrowRight 
} from "lucide-react";

export const Features = () => {
  return (
    <section className="py-32 bg-[#020202] relative overflow-hidden">
      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-3xl mb-24">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-widest mb-6"
          >
            Capabilities
          </motion.div>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-7xl font-black text-white leading-[0.9] tracking-tighter"
          >
            Smarter Campus. <br />
            <span className="text-gray-700">Better Learning.</span>
          </motion.h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
          {/* Large Card 1 */}
          <motion.div
            whileHover={{ y: -5 }}
            className="md:col-span-4 h-[400px] relative group overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-blue-600/20 to-transparent border border-white/10 p-10"
          >
            <div className="relative z-10 h-full flex flex-col justify-between">
              <div>
                <QrCode className="text-blue-400 w-12 h-12 mb-6" />
                <h3 className="text-3xl font-bold text-white mb-4">Dynamic QR Protocol</h3>
                <p className="text-gray-400 max-w-sm text-lg leading-relaxed">
                  Rotation-based encrypted QR codes that prevent session sharing and ensure physical presence for every student.
                </p>
              </div>
              <div className="text-blue-400 font-bold flex items-center gap-2 group-hover:gap-4 transition-all cursor-pointer">
                Learn how it works <ArrowRight className="w-5 h-5" />
              </div>
            </div>
            {/* Visual Decoration */}
            <div className="absolute top-1/2 right-[-10%] w-[300px] h-[300px] bg-blue-500/20 rounded-full blur-[80px]" />
          </motion.div>

          {/* Small Card 1 */}
          <motion.div
            whileHover={{ y: -5 }}
            className="md:col-span-2 h-[400px] bg-white/[0.03] border border-white/10 rounded-[2.5rem] p-10 flex flex-col justify-between group"
          >
            <div>
              <UserCheck className="text-purple-400 w-10 h-10 mb-6" />
              <h3 className="text-2xl font-bold text-white mb-4">Biometric ID</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Industrial-grade facial recognition to maintain the highest levels of academic integrity.
              </p>
            </div>
            <div className="w-full h-32 bg-gradient-to-t from-purple-500/10 to-transparent rounded-2xl border border-white/5 mt-4" />
          </motion.div>

          {/* Small Card 2 */}
          <motion.div
            whileHover={{ y: -5 }}
            className="md:col-span-2 h-[400px] bg-white/[0.03] border border-white/10 rounded-[2.5rem] p-10 flex flex-col justify-between"
          >
             <div>
              <Lock className="text-red-400 w-10 h-10 mb-6" />
              <h3 className="text-2xl font-bold text-white mb-4">Fraud Shield</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Geofencing and device fingerprinting to prevent any unauthorized attendance attempts.
              </p>
            </div>
          </motion.div>

          {/* Large Card 2 */}
          <motion.div
            whileHover={{ y: -5 }}
            className="md:col-span-4 h-[400px] relative group overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-emerald-600/20 to-transparent border border-white/10 p-10"
          >
            <div className="relative z-10 h-full flex flex-col justify-between">
              <div>
                <MessageSquareText className="text-emerald-400 w-12 h-12 mb-6" />
                <h3 className="text-3xl font-bold text-white mb-4">AI Campus Coordinator</h3>
                <p className="text-gray-400 max-w-sm text-lg leading-relaxed">
                  24/7 intelligent assistant that knows your schedule, grades, and campus policies better than anyone.
                </p>
              </div>
              <div className="text-emerald-400 font-bold flex items-center gap-2 group-hover:gap-4 transition-all cursor-pointer">
                Try the AI demo <ArrowRight className="w-5 h-5" />
              </div>
            </div>
            <div className="absolute bottom-[-10%] right-[10%] w-[250px] h-[250px] bg-emerald-500/10 rounded-full blur-[80px]" />
          </motion.div>
        </div>
      </div>
    </section>
  );
};
