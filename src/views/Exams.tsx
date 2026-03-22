"use client";

import { useState, useEffect, useMemo, useCallback/* eslint-disable @typescript-eslint/no-unused-vars */ } from "react";
import React from 'react';
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  Clock,
  MapPin,
  AlertTriangle,
  Bell,
  ShieldAlert,
  FileText,
  Timer,
  BookOpen,
  ShieldCheck,
  Terminal,
  LogOut,
} from "lucide-react";
import DashboardLayout from "../components/common/DashboardLayout";
import {
  getUpcomingExamsAction,
  reportViolationAction,
} from "../actions/exam.actions";
import { StatsSkeleton } from "../components/common/LoadingSkeleton";

// --- Components ---

const GlassCard = ({
  children,
  className = "",
  variant = "default",
  noBlur = false,
  style = {},
}: {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "alert" | "success";
  noBlur?: boolean;
  style?: React.CSSProperties;
}) => {
  const variants = {
    default:
      "bg-white/80 dark:bg-gray-800/70 border-white/20 dark:border-gray-700/50 shadow-xl",
    alert:
      "bg-red-50/90 dark:bg-red-900/20 border-red-200 dark:border-red-800/50 shadow-red-500/10",
    success:
      "bg-emerald-50/90 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800/50 shadow-emerald-500/10",
  };

  return (
    <div
      style={style}
      className={`${noBlur ? "" : "backdrop-blur-md"} border rounded-[2rem] transition-all duration-300 ${variants[variant]} ${className}`}
    >
      {children}
    </div>
  );
};

// --- Integrity Guard Hook ---
const useExamIntegrityGuard = (isActive: boolean, examId: number | null) => {
  const [violations, setViolations] = useState<
    { type: string; timestamp: Date }[]
  >([]);

  const reportViolation = useCallback(
    async (type: string) => {
      if (!examId) return;
      const timestamp = new Date();
      setViolations((prev) => [...prev, { type, timestamp }]);

      try {
        await reportViolationAction({
          examId,
          type,
          metadata: { clientTimestamp: timestamp.toISOString() },
        });
      } catch (error) {
        console.error("Failed to sync violation to server:", error);
      }
    },
    [examId],
  );

  useEffect(() => {
    if (!isActive || !examId) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        reportViolation("TAB_SWITCH");
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      reportViolation("UNAUTHORIZED_CLICK");
    };

    const handleCopyPaste = (e: ClipboardEvent) => {
      e.preventDefault();
      reportViolation("COPY_PASTE_ATTEMPT");
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent PrintScreen or Alt+Tab logic (best effort in browser)
      if (e.key === "PrintScreen" || (e.altKey && e.key === "Tab")) {
        e.preventDefault();
        reportViolation("KEYBOARD_SHORTCUT");
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("copy", handleCopyPaste);
    document.addEventListener("paste", handleCopyPaste);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("copy", handleCopyPaste);
      document.removeEventListener("paste", handleCopyPaste);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isActive, examId, reportViolation]);

  return violations;
};

// --- Main Page ---

export default function Exams() {
  const [activeExamMode, setActiveExamMode] = useState<number | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  const { data: examsResponse, isLoading } = useQuery({
    queryKey: ["upcoming-exams"],
    queryFn: async () => {
      const res = await getUpcomingExamsAction();
      if (res.success) return res.data;
      throw new Error(res.error);
    },
  });

  const exams = useMemo(() => examsResponse || [], [examsResponse]);

  // Sort exams to find the nearest one
  const sortedExams = useMemo(() => {
     
    return [...exams].sort(
      (a: { startTime: string }, b: { startTime: string }) =>
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
    );
  }, [exams]);

  const nextExam = sortedExams[0];
  const isGuardActive = activeExamMode !== null;
  const violations = useExamIntegrityGuard(isGuardActive, activeExamMode);

  // Live Clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getTimeRemaining = (targetDate: string) => {
    const total = Date.parse(targetDate) - Date.parse(currentTime.toString());
    if (total <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    const seconds = Math.floor((total / 1000) % 60);
    const minutes = Math.floor((total / 1000 / 60) % 60);
    const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
    const days = Math.floor(total / (1000 * 60 * 60 * 24));
    return { days, hours, minutes, seconds };
  };

  const handleEnterExam = (examId: number) => {
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    }
    setActiveExamMode(examId);
  };

  const handleExitExam = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    }
    setActiveExamMode(null);
  };

  if (isLoading) {
    return (
      <DashboardLayout userType="student">
        <StatsSkeleton />
      </DashboardLayout>
    );
  }

  // --- Active Exam State (Integrity Guard UI) ---
  if (activeExamMode) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const activeExamData = exams.find((e: any) => e.id === activeExamMode);
    return (
      <div className="min-h-screen bg-[#020617] text-white p-8 flex flex-col pointer-events-auto selection:bg-transparent relative overflow-hidden">
        {/* Animated Security Grid Background */}
        <div className="absolute inset-0 opacity-[0.05] pointer-events-none" 
             style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '40px 40px' }} />
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-transparent to-red-500/10 pointer-events-none" />

        <header className="relative z-10 flex justify-between items-center mb-12 bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-[2rem] shadow-2xl">
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="absolute inset-0 bg-red-500 blur-xl opacity-20 animate-pulse" />
              <ShieldAlert className="w-12 h-12 text-red-500 relative z-10" />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tighter flex items-center gap-2">
                SECURE <span className="text-red-500">EXAM</span> ENVIRONMENT
              </h1>
              <div className="flex items-center gap-3 mt-1">
                <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-[10px] font-black uppercase rounded border border-red-500/30">LOCKED</span>
                <p className="text-gray-400 font-bold text-sm">
                  {activeExamData?.title} • {activeExamData?.course.courseName}
                </p>
              </div>
            </div>
          </div>
          <div className="text-right hidden sm:block">
            <div className="text-xs font-black text-gray-500 uppercase tracking-widest mb-1">Current Session Time</div>
            <div className="text-4xl font-mono font-black tracking-widest text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.3)]">
              {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </div>
          </div>
        </header>

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-8 relative z-10">
          <div className="lg:col-span-3 bg-white/5 backdrop-blur-md border border-white/10 rounded-[2.5rem] p-12 flex flex-col items-center justify-center text-center relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent pointer-events-none" />
            
            <motion.div
              animate={{ scale: [1, 1.05, 1], opacity: [0.5, 1, 0.5] }}
              transition={{ repeat: Infinity, duration: 4 }}
              className="relative mb-10"
            >
              <div className="absolute inset-0 bg-indigo-500 blur-3xl opacity-20" />
              <Terminal className="w-32 h-32 text-indigo-400 relative z-10" />
            </motion.div>
            
            <h2 className="text-3xl font-black text-white max-w-2xl leading-tight mb-6">
              Awaiting payload broadcast... <br />
              <span className="text-indigo-400 text-xl font-bold">Please remain focused on this window.</span>
            </h2>
            <p className="text-gray-400 font-medium max-w-md mb-12 leading-relaxed">
              Your workstation is currently being monitored for academic integrity. 
              Do not attempt to switch tabs or applications.
            </p>

            <button
              onClick={handleExitExam}
              className="px-10 py-5 bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white border border-red-500/30 font-black rounded-2xl transition-all duration-300 uppercase tracking-widest text-xs flex items-center gap-3 active:scale-95 shadow-lg shadow-red-900/20"
            >
              <LogOut className="w-5 h-5" />
              EMERGENCY EXIT (FLAGS ATTEMPT)
            </button>
          </div>

          <div className="space-y-6">
            <GlassCard
              variant={violations.length > 0 ? "alert" : "success"}
              className="p-8 border-white/10 dark:border-white/10"
              noBlur
            >
              <div className="flex items-center justify-between mb-8">
                <h3 className="font-black text-lg flex items-center gap-3 uppercase tracking-tight">
                  {violations.length > 0 ? (
                    <div className="p-2 bg-red-500/20 rounded-xl"><AlertTriangle className="text-red-500 w-5 h-5" /></div>
                  ) : (
                    <div className="p-2 bg-emerald-500/20 rounded-xl"><ShieldCheck className="text-emerald-500 w-5 h-5" /></div>
                  )}
                  Integrity
                </h3>
                <span className={`text-[10px] font-black px-2 py-1 rounded-full border ${violations.length > 0 ? 'bg-red-500/10 border-red-500/30 text-red-500' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500'}`}>
                   {violations.length > 0 ? 'COMPROMISED' : 'SECURE'}
                </span>
              </div>

              {violations.length === 0 ? (
                <div className="p-6 bg-emerald-500/5 rounded-2xl border border-emerald-500/10 text-center">
                  <p className="text-sm font-bold text-emerald-400 leading-relaxed">
                    System active. Proactive monitoring in progress.
                  </p>
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="p-4 bg-red-500/10 rounded-2xl border border-red-500/20">
                    <p className="text-xs font-black text-red-500 uppercase tracking-widest mb-1 animate-pulse">
                      Critical Alerts Detected
                    </p>
                    <p className="text-[10px] text-red-400 font-bold">Multiple session anomalies recorded.</p>
                  </div>
                  
                  <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {violations.map((v, i) => (
                      <div
                        key={i}
                        className="text-[10px] font-mono bg-red-500/5 text-red-400 p-4 rounded-2xl border border-red-500/10 flex flex-col gap-2 group/v"
                      >
                        <div className="flex justify-between items-center opacity-70">
                           <span className="font-black tracking-widest">LOG_ENTRY_{i+1}</span>
                           <span>{v.timestamp.toLocaleTimeString()}</span>
                        </div>
                        <span className="text-xs font-black text-red-300 group-hover/v:text-red-200 transition-colors">{v.type}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </GlassCard>

            <div className="p-8 bg-white/5 border border-white/10 rounded-[2rem] space-y-6">
               <h4 className="text-xs font-black text-gray-500 uppercase tracking-[0.2em]">Session Metadata</h4>
               <div className="space-y-4">
                  <div className="flex justify-between items-center">
                     <span className="text-xs font-bold text-gray-500">IP Address</span>
                     <span className="text-xs font-mono text-indigo-400">192.168.1.*</span>
                  </div>
                  <div className="flex justify-between items-center">
                     <span className="text-xs font-bold text-gray-500">Focus Status</span>
                     <span className="text-xs font-mono text-emerald-400 uppercase tracking-widest">Active</span>
                  </div>
                  <div className="flex justify-between items-center">
                     <span className="text-xs font-bold text-gray-500">Capture</span>
                     <span className="text-xs font-mono text-emerald-400 uppercase tracking-widest">Enabled</span>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- Standard Dashboard State ---
  return (
    <DashboardLayout userType="student">
      <div className="space-y-10 pb-32">
        {/* Premium Floating Header */}
        <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 p-8 shadow-2xl">
          {/* Decorative background elements */}
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl" />
          
          <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="space-y-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/20 backdrop-blur-md border border-white/30 text-white rounded-full text-xs font-bold uppercase tracking-wider"
              >
                <Calendar className="w-3.5 h-3.5" />
                Academic Calendar
              </motion.div>
              
              <div className="space-y-1">
                <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
                  Upcoming <br />
                  <span className="text-indigo-200">Assessments</span>
                </h1>
                <p className="text-indigo-100/80 font-medium max-w-md">
                  Manage your schedule, access secure environments, and track exam deadlines.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <div className="px-8 py-6 bg-white/10 backdrop-blur-xl border border-white/20 rounded-[2rem] shadow-xl flex items-center gap-5 min-w-[220px]">
                <div className="p-4 bg-white/20 rounded-2xl text-white shadow-inner">
                  <Bell className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-indigo-100/60 uppercase tracking-widest mb-1">Total Exams</p>
                  <p className="text-3xl font-black text-white">{exams.length}</p>
                </div>
              </div>
            </div>
          </div>
        </div>        {/* Next Exam Hero Banner */}
        {nextExam && (
          <GlassCard className="overflow-hidden border-indigo-500/30 group relative" noBlur>
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/95 via-violet-600/95 to-purple-700/95 z-0" />
            
            <div className="relative z-10 p-8 sm:p-12">
              {/* Decorative background elements */}
              <div className="absolute top-0 right-0 -mt-16 -mr-16 w-80 h-80 bg-white opacity-10 rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 -mb-16 -ml-16 w-64 h-64 bg-indigo-400 opacity-10 rounded-full blur-2xl" />

              <div className="relative z-10 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-12">
                <div className="space-y-6 flex-1">
                  <div className="flex items-center gap-4">
                    <span 
                      className="px-4 py-1.5 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-[0.2em] text-white border border-white/40 shadow-lg"
                    >
                      Next Assessment
                    </span>
                    <span className="text-indigo-100 font-black text-xs uppercase tracking-widest flex items-center gap-2">
                       <Calendar className="w-4 h-4" />
                      {new Date(nextExam.startTime).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
                    </span>
                  </div>
                  
                  <div className="space-y-2">
                    <h2 className="text-4xl sm:text-6xl font-black tracking-tighter text-white leading-none">
                      {nextExam.title}
                    </h2>
                    <p className="text-xl sm:text-2xl text-indigo-100/90 font-bold flex items-center gap-3">
                      <BookOpen className="w-6 h-6 text-indigo-300" />
                      {nextExam.course.courseName}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-8 pt-6">
                    <div className="flex items-center gap-3 text-indigo-50 bg-white/10 px-5 py-3 rounded-2xl border border-white/10">
                      <Clock className="w-5 h-5 text-indigo-300" />
                      <div>
                        <p className="text-[10px] font-black text-indigo-300 uppercase leading-none mb-1">Start Time</p>
                        <p className="font-black tracking-wide text-lg">
                          {new Date(nextExam.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-indigo-50 bg-white/10 px-5 py-3 rounded-2xl border border-white/10">
                      <MapPin className="w-5 h-5 text-indigo-300" />
                      <div>
                        <p className="text-[10px] font-black text-indigo-300 uppercase leading-none mb-1">Location</p>
                        <p className="font-black tracking-wide text-lg">
                          {nextExam.room || "Location TBA"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Countdown Timer */}
                <div className="lg:w-[350px] shrink-0">
                  <GlassCard noBlur className="bg-white/10 border-white/20 p-8 shadow-2xl relative overflow-hidden group/timer">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
                    
                    <p className="text-center text-[10px] font-black text-indigo-200 uppercase tracking-[0.3em] mb-8">
                      Time Remaining
                    </p>
                    <div className="flex justify-center gap-4">
                      {Object.entries(getTimeRemaining(nextExam.startTime)).map(([unit, value]) => (
                        <div key={unit} className="flex flex-col items-center">
                          <div className="w-20 h-20 bg-black/30 rounded-2xl flex items-center justify-center backdrop-blur-xl border border-white/10 shadow-inner group-hover/timer:border-white/30 transition-colors">
                            <span className="text-3xl font-black font-mono text-white tabular-nums">
                              {value.toString().padStart(2, "0")}
                            </span>
                          </div>
                          <span className="text-[10px] font-black uppercase tracking-widest text-indigo-300 mt-3">
                            {unit}
                          </span>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={() => handleEnterExam(nextExam.id)}
                      className="w-full mt-10 py-5 bg-white text-indigo-900 font-black tracking-widest uppercase rounded-2xl hover:scale-[1.03] active:scale-95 transition-all shadow-2xl shadow-black/30 flex items-center justify-center gap-3 overflow-hidden relative group/btn"
                    >
                      <div className="absolute inset-0 bg-indigo-50 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                      <ShieldCheck className="w-6 h-6 relative z-10" /> 
                      <span className="relative z-10 font-black">Enter Secure Room</span>
                    </button>
                  </GlassCard>
                </div>
              </div>
            </div>
          </GlassCard>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Schedule List */}
          <div className="lg:col-span-2 space-y-6">
            <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest pl-2">
              Full Schedule
            </h3>

            <AnimatePresence mode="popLayout">
              {exams.length > 0 ? (
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                exams.map((exam: any, index: number) => {
                  if (nextExam && exam.id === nextExam.id) return null; // Skip if it's the hero exam

                  return (
                    <motion.div
                      key={exam.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <GlassCard className="p-8 flex flex-col sm:flex-row gap-8 hover:scale-[1.02] hover:-translate-y-1 transition-all duration-500 group cursor-pointer relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        
                        {/* Date Block */}
                        <div className="flex flex-col items-center justify-center p-6 bg-gray-50 dark:bg-gray-900/50 rounded-3xl min-w-[120px] border border-gray-100 dark:border-gray-800 shadow-inner group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/40 transition-colors">
                          <span className="text-gray-400 dark:text-gray-500 text-[10px] font-black uppercase tracking-[0.2em] mb-1">
                            {new Date(exam.startTime).toLocaleDateString("en-US", { month: "short" })}
                          </span>
                          <span className="text-4xl font-black text-gray-900 dark:text-white">
                            {new Date(exam.startTime).getDate()}
                          </span>
                        </div>

                        {/* Details Block */}
                        <div className="flex-1 space-y-6 relative z-10">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-indigo-500 dark:text-indigo-400 text-[10px] font-black uppercase tracking-widest">
                               <ShieldCheck className="w-3.5 h-3.5" /> Proctored Session
                            </div>
                            <h3 className="text-2xl font-black text-gray-900 dark:text-white group-hover:text-indigo-600 transition-colors">
                              {exam.title}
                            </h3>
                            <p className="text-gray-500 font-bold text-sm flex items-center gap-2">
                              <BookOpen className="w-4 h-4 text-gray-400" />
                              {exam.course.courseName}
                            </p>
                          </div>

                          <div className="flex flex-wrap items-center gap-6">
                            <div className="flex items-center gap-3 px-4 py-2 bg-gray-50 dark:bg-gray-900/50 rounded-xl text-xs font-bold text-gray-600 dark:text-gray-400 border border-gray-100 dark:border-gray-800">
                              <Clock className="w-4.5 h-4.5 text-indigo-500" />
                              <span className="font-black">
                                {new Date(exam.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 px-4 py-2 bg-gray-50 dark:bg-gray-900/50 rounded-xl text-xs font-bold text-gray-600 dark:text-gray-400 border border-gray-100 dark:border-gray-800">
                              <MapPin className="w-4.5 h-4.5 text-indigo-500" />
                              <span className="font-black">Room {exam.room || "TBA"}</span>
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="pt-6 sm:pt-0 sm:pl-8 sm:border-l border-gray-100 dark:border-gray-800 flex flex-col justify-center gap-4 relative z-10">
                          <button className="px-6 py-3 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 dark:shadow-none hover:scale-105 active:scale-95 flex items-center justify-center gap-2 font-black">
                            <Bell className="w-4 h-4" /> Remind Me
                          </button>
                          <button className="px-6 py-3 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-100 dark:hover:bg-gray-700 transition-all border border-gray-200 dark:border-gray-700 flex items-center justify-center gap-2 font-black">
                            <FileText className="w-4 h-4" /> Materials
                          </button>
                        </div>
                      </GlassCard>
                    </motion.div>
                  );
                })
              ) : (
                <GlassCard className="p-16 text-center">
                  <div className="w-24 h-24 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-dashed border-gray-200 dark:border-gray-700">
                    <Calendar className="w-10 h-10 text-gray-300" />
                  </div>
                  <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">
                    Schedule Clear
                  </h3>
                  <p className="text-gray-500 font-medium">
                    No upcoming assessments detected in the system.
                  </p>
                </GlassCard>
              )}
            </AnimatePresence>
          </div>

          {/* Sidebar Information */}
          <div className="space-y-8">
            <GlassCard className="p-8 border-indigo-500/20 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              <h4 className="font-black text-gray-900 dark:text-white mb-8 flex items-center gap-3 text-base uppercase tracking-tight relative z-10">
                <div className="p-2 bg-indigo-500/10 rounded-xl">
                  <ShieldCheck className="w-5 h-5 text-indigo-500" />
                </div>
                Integrity Protocol
              </h4>
              <div className="space-y-6 relative z-10">
                <div className="flex gap-5 p-5 bg-indigo-50/50 dark:bg-indigo-900/20 rounded-[1.5rem] border border-indigo-100 dark:border-indigo-800/30 group/alert">
                  <div className="shrink-0 bg-indigo-100 dark:bg-indigo-800/50 p-3 rounded-2xl h-fit shadow-inner group-hover/alert:scale-110 transition-transform">
                    <ShieldAlert className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div className="space-y-1">
                    <h5 className="text-sm font-black text-indigo-900 dark:text-white tracking-wide uppercase">
                      Environment Locked
                    </h5>
                    <p className="text-xs text-indigo-600/80 dark:text-indigo-400/80 font-bold leading-relaxed">
                      Exiting fullscreen or switching tabs during an active
                      session will trigger an automatic security audit.
                    </p>
                  </div>
                </div>
              </div>
            </GlassCard>

            <GlassCard className="p-8 border-purple-500/20 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              <h4 className="font-black text-gray-900 dark:text-white mb-8 flex items-center gap-3 text-base uppercase tracking-tight relative z-10">
                <div className="p-2 bg-purple-500/10 rounded-xl">
                  <FileText className="w-5 h-5 text-purple-500" />
                </div>
                Quick Guidelines
              </h4>
              <ul className="space-y-5 relative z-10">
                {[
                  "Secure reliable internet access",
                  "Close all non-essential applications",
                  "System logs all copy/paste attempts",
                  "Browser focus is actively monitored",
                ].map((rule, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-4 text-sm text-gray-600 dark:text-gray-400 font-bold group/item"
                  >
                    <div className="w-2 h-2 rounded-full bg-purple-500 mt-1.5 shrink-0 shadow-[0_0_10px_rgba(168,85,247,0.8)] group-hover/item:scale-150 transition-transform" />
                    <span className="group-hover/item:text-purple-600 dark:group-hover/item:text-purple-400 transition-colors">
                      {rule}
                    </span>
                  </li>
                ))}
              </ul>
            </GlassCard>

            <div className="p-8 bg-gradient-to-br from-gray-900 to-indigo-950 rounded-[2rem] text-white shadow-2xl relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300 cursor-pointer">
              <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none" />
              <div className="relative z-10 space-y-4">
                <h4 className="font-black text-xl leading-tight">Need Support?</h4>
                <p className="text-indigo-200/70 text-sm font-medium leading-relaxed">Contact the digital proctoring team if you experience technical issues during your session.</p>
                <button className="w-full py-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-white/20 transition-all">
                  Open Support Ticket
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
