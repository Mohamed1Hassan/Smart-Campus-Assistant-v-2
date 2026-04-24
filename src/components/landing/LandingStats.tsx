"use client";

import React from "react";
import { motion } from "framer-motion";

const stats = [
  { label: "Active Students", value: "10,000", suffix: "+", color: "from-blue-400 to-blue-600" },
  { label: "Daily Sessions", value: "450", suffix: "+", color: "from-purple-400 to-purple-600" },
  { label: "Security Checks", value: "99.9", suffix: "%", color: "from-emerald-400 to-emerald-600" },
  { label: "Fraud Prevented", value: "1,200", suffix: "+", color: "from-orange-400 to-orange-600" },
];

export const LandingStats = () => {
  return (
    <section className="py-20 bg-[#020202] relative overflow-hidden">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
          {stats.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="text-center"
            >
              <div className={`text-4xl md:text-6xl font-black bg-clip-text text-transparent bg-gradient-to-r ${stat.color} mb-2 tracking-tighter`}>
                {stat.value}{stat.suffix}
              </div>
              <div className="text-gray-500 font-medium text-xs md:text-sm uppercase tracking-[0.2em]">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
      
      {/* Subtle line decoration */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
    </section>
  );
};
