"use client";

import React, { useState, useEffect } from "react";
import { Hero } from "../components/landing/Hero";
import { Features } from "../components/landing/Features";
import { LandingStats } from "../components/landing/LandingStats";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Menu, X, Globe, Shield, Zap } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "Impact", href: "#stats" },
    { name: "Features", href: "#features" },
    { name: "Academy", href: "#about" },
  ];

  return (
    <motion.nav 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-700 px-6 ${
        isScrolled ? "py-4" : "py-10"
      }`}
    >
      <div className={`container mx-auto flex items-center justify-between px-8 py-3 transition-all duration-700 ${
        isScrolled 
          ? "bg-black/60 backdrop-blur-2xl border border-white/10 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] max-w-4xl" 
          : "bg-transparent border border-transparent max-w-7xl"
      }`}>
        {/* Logo Section */}
        <div className="flex items-center gap-3 group cursor-pointer">
          <div className="relative">
            <div className="absolute -inset-2 bg-blue-600/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg transform group-hover:rotate-[10deg] transition-transform">
               <Image src="/icon.png" alt="Logo" width={22} height={22} className="brightness-200" priority />
            </div>
          </div>
          <span className="text-white font-black tracking-tighter text-xl uppercase italic group-hover:text-blue-400 transition-colors">Smart Campus</span>
        </div>
        
        {/* Desktop Links - Clean Style */}
        <div className="hidden md:flex items-center gap-10">
          {navLinks.map((link) => (
            <a 
              key={link.name}
              href={link.href} 
              className="group relative text-[13px] font-bold text-gray-400 uppercase tracking-widest hover:text-white transition-colors"
            >
              {link.name}
              <span className="absolute -bottom-1.5 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 group-hover:w-full transition-all duration-300" />
            </a>
          ))}
        </div>

        {/* Right Action */}
        <div className="flex items-center gap-4">
          <Link href="/login" className="hidden sm:block group relative">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl blur opacity-20 group-hover:opacity-100 transition duration-500" />
            <button className="relative px-7 py-2.5 bg-white text-black text-[10px] font-black uppercase tracking-[0.15em] rounded-xl hover:bg-gray-100 transition-all">
              Portal Login
            </button>
          </Link>
          <button 
            className="md:hidden text-white p-2 bg-white/5 rounded-lg border border-white/10"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden mt-4 bg-black/90 backdrop-blur-3xl border border-white/10 rounded-3xl p-8 overflow-hidden"
          >
            <div className="flex flex-col gap-6 text-center text-lg font-bold text-white">
              <a href="#features" onClick={() => setMobileMenuOpen(false)}>Features</a>
              <a href="#stats" onClick={() => setMobileMenuOpen(false)}>Impact</a>
              <a href="#about" onClick={() => setMobileMenuOpen(false)}>Academy</a>
              <Link href="/login" className="pt-4">
                 <button className="w-full py-4 bg-blue-600 rounded-2xl">Portal Login</button>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

const PartnersTicker = () => (
  <div className="py-12 bg-[#020202] border-y border-white/5 overflow-hidden">
    <h2 className="sr-only">Our Partners and Institutions</h2>
    <div className="container mx-auto px-6 mb-8 text-center">
      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.3em]">Trusted by Leading Institutions</span>
    </div>
    <div className="flex gap-20 animate-infinite-scroll whitespace-nowrap opacity-30 grayscale hover:grayscale-0 transition-all duration-700">
      {/* Mock Partners */}
      {[1,2,3,4,5,6,1,2,3,4,5,6].map((p, i) => (
        <div key={i} className="text-white text-2xl font-black italic tracking-tighter opacity-70">
          {i % 2 === 0 ? "THEBES ACADEMY" : "TECH INSTITUTE"}
        </div>
      ))}
    </div>
  </div>
);

const CTASection = () => (
  <section className="py-32 bg-[#020202]">
    <div className="container mx-auto px-6">
      <div className="relative overflow-hidden rounded-[3.5rem] bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800 p-12 md:p-24 text-center">
        {/* Animated Background Rays */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_-20%,rgba(255,255,255,0.15),transparent)]" />
        </div>
        
        <div className="relative z-10">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-8xl font-black text-white mb-10 tracking-tighter leading-none"
          >
            Ready to evolve? <br />
            <span className="opacity-50">Start today.</span>
          </motion.h2>
          <p className="text-blue-100/70 text-lg md:text-xl max-w-2xl mx-auto mb-16 font-medium leading-relaxed">
            Join the educational revolution at Thebes Academy. Experience the smartest campus ecosystem ever built.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Link href="/login">
              <button className="group px-12 py-5 bg-white text-blue-600 rounded-2xl font-black text-lg hover:scale-105 active:scale-95 transition-all shadow-2xl flex items-center gap-2">
                Get Started Now <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  </section>
);

export default function LandingPage() {
  return (
    <main className="bg-[#020202] text-white selection:bg-blue-500 selection:text-white">
      <Navbar />
      <Hero />
      <PartnersTicker />
      <div id="stats">
        <LandingStats />
      </div>

      <div id="features">
        <Features />
      </div>

      {/* About Academy Section - Upgraded to Premium */}
      <section id="about" className="py-40 bg-[#020202] relative overflow-hidden">
        {/* Background Atmosphere */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/10 blur-[120px] rounded-full z-0" />
        
        <div className="container mx-auto px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
            {/* Left Side - Interactive Tech Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
              className="group perspective-1000"
            >
              <motion.div
                whileHover={{ rotateY: -15, rotateX: 10, scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="relative aspect-square md:aspect-video rounded-[3.5rem] bg-gradient-to-br from-white/[0.05] to-transparent border border-white/10 backdrop-blur-3xl p-1 shadow-2xl overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-transparent to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                <div className="h-full w-full rounded-[3.3rem] bg-[#050505]/80 flex flex-col items-center justify-center relative overflow-hidden">
                  {/* Animated Background Grid */}
                  <div className="absolute inset-0 opacity-[0.03] bg-blue-500/5" />
                  
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="relative"
                  >
                    <div className="absolute -inset-10 bg-blue-500/20 blur-3xl rounded-full" />
                    <Globe className="w-32 h-32 text-blue-400 relative z-10 opacity-80" />
                  </motion.div>
                  
                  <div className="mt-8 text-center relative z-10">
                    <h3 className="text-3xl font-black text-white tracking-tighter mb-2">Global Standards</h3>
                    <p className="text-blue-400/60 font-bold uppercase tracking-[0.3em] text-[10px]">Academic Excellence</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
            
            {/* Right Side - Content */}
            <div className="space-y-12">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
              >
                <h2 className="text-5xl md:text-7xl font-black text-white mb-8 tracking-tighter leading-none">
                  Innovation for <br /> 
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
                    the next generation.
                  </span>
                </h2>
                <p className="text-gray-400 text-lg md:text-xl leading-relaxed max-w-xl">
                  Thebes Academy is committed to providing a cutting-edge educational environment. 
                  Our Smart Campus system is a testament to our dedication to student success and security.
                </p>
              </motion.div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { 
                    title: "Mission", 
                    desc: "Empowering students through AI-driven tools and real-time insights.",
                    color: "blue",
                    icon: Shield
                  },
                  { 
                    title: "Vision", 
                    desc: "Leading the digital transformation of global academic ecosystems.",
                    color: "purple",
                    icon: Zap
                  }
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: i * 0.2 }}
                    className="p-8 bg-white/[0.03] border border-white/10 rounded-[2.5rem] hover:border-white/20 transition-all group"
                  >
                    <div className={`w-12 h-12 bg-${item.color}-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                      <item.icon className={`text-${item.color}-400 w-6 h-6`} />
                    </div>
                    <h3 className="text-white text-xl font-bold mb-3">{item.title}</h3>
                    <p className="text-gray-400 text-sm leading-relaxed">{item.desc}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Visual Break */}
      <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      
      <CTASection />
      
      <footer className="py-24 bg-[#020202] border-t border-white/5">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-16 mb-20">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                  <Image src="/icon.png" alt="Logo" width={22} height={22} className="brightness-200" />
                </div>
                <span className="text-white font-black tracking-tighter text-2xl uppercase italic">Smart Campus</span>
              </div>
              <p className="text-gray-400 max-w-sm leading-relaxed font-medium">
                Pioneering the future of educational technology with AI-driven attendance and real-time biometric security.
              </p>
            </div>
            
            <div>
              <h3 className="text-white font-bold mb-8 uppercase tracking-widest text-xs">Platform</h3>
              <ul className="flex flex-col gap-4 text-gray-400 font-medium">
                <li><a href="#features" className="hover:text-blue-400 transition-colors">Features</a></li>
                <li><a href="/login" className="hover:text-blue-400 transition-colors">Student Portal</a></li>
                <li><a href="/login" className="hover:text-blue-400 transition-colors">Professor Dashboard</a></li>
              </ul>
            </div>

            <div>
              <h3 className="text-white font-bold mb-8 uppercase tracking-widest text-xs">Support</h3>
              <ul className="flex flex-col gap-4 text-gray-400 font-medium">
                <li><a href="#" className="hover:text-blue-400 transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-blue-400 transition-colors">API Docs</a></li>
                <li><a href="#" className="hover:text-blue-400 transition-colors">Contact Support</a></li>
              </ul>
            </div>
          </div>

          <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
            <p className="text-gray-400 text-xs font-bold tracking-widest uppercase">
              © {new Date().getFullYear()} Thebes Academy. Industrial Design for Education.
            </p>
            <div className="flex items-center gap-8 text-gray-400 text-xs font-bold tracking-widest uppercase">
               <a href="#" className="hover:text-white transition-colors">Privacy</a>
               <a href="#" className="hover:text-white transition-colors">Terms</a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
