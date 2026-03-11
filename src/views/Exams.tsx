"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
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
}: {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "alert" | "success";
}) => {
  const variants = {
    default:
      "bg-white/70 dark:bg-gray-800/60 border-white/20 dark:border-gray-700/50",
    alert:
      "bg-red-50/90 dark:bg-red-900/20 border-red-200 dark:border-red-800/50",
    success:
      "bg-emerald-50/90 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800/50",
  };

  return (
    <div
      className={`backdrop-blur-md border rounded-3xl shadow-xl transition-all ${variants[variant]} ${className}`}
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return [...exams].sort(
      (a: any, b: any) =>
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
      <div className="min-h-screen bg-gray-900 text-white p-8 flex flex-col pointer-events-auto selection:bg-transparent">
        <header className="flex justify-between items-center mb-12 border-b border-gray-800 pb-6">
          <div>
            <h1 className="text-3xl font-black text-red-500 flex items-center gap-3">
              <ShieldAlert className="w-8 h-8 animate-pulse" />
              SECURE EXAM ENVIRONMENT
            </h1>
            <p className="text-gray-400 font-bold mt-2">
              {activeExamData?.title} • {activeExamData?.course.courseName}
            </p>
          </div>
          <div className="text-right">
            <div className="text-4xl font-mono font-black tracking-widest text-emerald-400">
              {currentTime.toLocaleTimeString()}
            </div>
          </div>
        </header>

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3 bg-gray-800/50 border border-gray-700 rounded-3xl p-12 flex flex-col items-center justify-center text-center">
            <Timer className="w-24 h-24 text-gray-600 mb-6" />
            <h2 className="text-2xl font-bold text-gray-300 max-w-lg leading-relaxed">
              Awaiting Professor to broadcast the exam payload. Please remain on
              this screen.
            </h2>
            <button
              onClick={handleExitExam}
              className="mt-12 px-8 py-4 bg-red-600 hover:bg-red-700 text-white font-black rounded-2xl transition-all"
            >
              EMERGENCY EXIT (WILL FLAG ATTEMPT)
            </button>
          </div>

          <div className="space-y-6">
            <GlassCard
              variant={violations.length > 0 ? "alert" : "success"}
              className="p-6"
            >
              <h3 className="font-black text-lg mb-4 flex items-center gap-2">
                {violations.length > 0 ? (
                  <AlertTriangle className="text-red-500" />
                ) : (
                  <ShieldCheck className="text-emerald-500" />
                )}
                Integrity Status
              </h3>
              {violations.length === 0 ? (
                <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                  System secure. No anomalies detected.
                </p>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm font-bold text-red-600 dark:text-red-400 mb-4 animate-pulse">
                    WARNING: Anomalies Detected
                  </p>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                    {violations.map((v, i) => (
                      <div
                        key={i}
                        className="text-[10px] font-mono bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200 p-2 rounded border border-red-200 dark:border-red-800"
                      >
                        [{v.timestamp.toLocaleTimeString()}] {v.type}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </GlassCard>
          </div>
        </div>
      </div>
    );
  }

  // --- Standard Dashboard State ---
  return (
    <DashboardLayout userType="student">
      <div className="space-y-8 pb-32">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full text-xs font-bold uppercase tracking-wider">
              <Calendar className="w-3.5 h-3.5" />
              Academic Calendar
            </div>
            <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">
              Upcoming{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
                Assessments
              </span>
            </h1>
            <p className="text-gray-500 dark:text-gray-400 font-medium">
              Manage your schedule and access secure environments.
            </p>
          </div>
        </header>

        {/* Next Exam Hero Banner */}
        {nextExam && (
          <GlassCard className="overflow-hidden border-2 border-indigo-500/30">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-700 p-8 sm:p-12 text-white relative overflow-hidden">
              {/* Decorative background elements */}
              <div className="absolute top-0 right-0 -mt-16 -mr-16 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl"></div>
              <div className="absolute bottom-0 left-0 -mb-16 -ml-16 w-48 h-48 bg-black opacity-10 rounded-full blur-2xl"></div>

              <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-black uppercase tracking-widest text-white border border-white/30">
                      Next Exam
                    </span>
                    <span className="text-indigo-200 font-bold text-sm">
                      {new Date(nextExam.startTime).toLocaleDateString(
                        undefined,
                        { weekday: "long", month: "long", day: "numeric" },
                      )}
                    </span>
                  </div>
                  <h2 className="text-3xl sm:text-5xl font-black tracking-tight">
                    {nextExam.title}
                  </h2>
                  <p className="text-xl text-indigo-100 font-medium">
                    {nextExam.course.courseName}
                  </p>

                  <div className="flex flex-wrap items-center gap-6 pt-4">
                    <div className="flex items-center gap-2 text-indigo-50">
                      <Clock className="w-5 h-5 text-indigo-300" />
                      <span className="font-bold tracking-wide">
                        {new Date(nextExam.startTime).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-indigo-50">
                      <MapPin className="w-5 h-5 text-indigo-300" />
                      <span className="font-bold tracking-wide">
                        {nextExam.room || "Location TBA"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Countdown Timer */}
                <div className="bg-black/20 backdrop-blur-xl p-6 rounded-3xl border border-white/10 shrink-0 w-full lg:w-auto">
                  <p className="text-center text-xs font-black text-indigo-200 uppercase tracking-widest mb-4">
                    Time Remaining
                  </p>
                  <div className="flex justify-center gap-4">
                    {Object.entries(getTimeRemaining(nextExam.startTime)).map(
                      ([unit, value]) => (
                        <div key={unit} className="flex flex-col items-center">
                          <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/5">
                            <span className="text-2xl font-black font-mono">
                              {value.toString().padStart(2, "0")}
                            </span>
                          </div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-200 mt-2">
                            {unit}
                          </span>
                        </div>
                      ),
                    )}
                  </div>

                  {/* Exam Entry Logic (Simplified for demo: active if within 15 mins) */}
                  <button
                    onClick={() => handleEnterExam(nextExam.id)}
                    className="w-full mt-6 py-4 bg-white text-indigo-900 font-black tracking-widest uppercase rounded-xl hover:scale-105 transition-all shadow-xl shadow-black/20 flex items-center justify-center gap-2"
                  >
                    <ShieldCheck className="w-5 h-5" /> Enter Secure Room
                  </button>
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
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <GlassCard className="p-6 sm:p-8 flex flex-col sm:flex-row gap-6 hover:-translate-y-1 transition-transform group cursor-pointer border hover:border-indigo-500/50">
                        {/* Date Block */}
                        <div className="flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl min-w-[100px] border border-gray-100 dark:border-gray-700">
                          <span className="text-gray-500 dark:text-gray-400 text-sm font-bold uppercase tracking-wider">
                            {new Date(exam.startTime).toLocaleDateString(
                              "en-US",
                              { month: "short" },
                            )}
                          </span>
                          <span className="text-3xl font-black text-gray-900 dark:text-white">
                            {new Date(exam.startTime).getDate()}
                          </span>
                        </div>

                        {/* Details Block */}
                        <div className="flex-1 space-y-4">
                          <div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-indigo-600 transition-colors">
                              {exam.title}
                            </h3>
                            <p className="text-gray-500 font-bold text-sm tracking-tight">
                              {exam.course.courseName}
                            </p>
                          </div>

                          <div className="flex flex-wrap items-center gap-4">
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 dark:bg-gray-800 rounded-lg text-xs font-bold text-gray-600 dark:text-gray-400 border border-gray-100 dark:border-gray-700">
                              <Clock className="w-4 h-4 text-indigo-500" />
                              {new Date(exam.startTime).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 dark:bg-gray-800 rounded-lg text-xs font-bold text-gray-600 dark:text-gray-400 border border-gray-100 dark:border-gray-700">
                              <MapPin className="w-4 h-4 text-indigo-500" />
                              {exam.room || "TBA"}
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="pt-4 sm:pt-0 sm:pl-6 sm:border-l border-gray-100 dark:border-gray-700/50 flex flex-col justify-center gap-3">
                          <button className="px-4 py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors flex items-center justify-center gap-2">
                            <Bell className="w-4 h-4" /> Remind
                          </button>
                          <button className="px-4 py-2 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center justify-center gap-2">
                            <BookOpen className="w-4 h-4" /> Materials
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
          <div className="space-y-6">
            <GlassCard className="p-8">
              <h4 className="font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-500" /> Integrity
                Protocol
              </h4>
              <div className="space-y-4">
                <div className="flex gap-4 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl border border-indigo-100 dark:border-indigo-800/30">
                  <div className="shrink-0 bg-indigo-100 dark:bg-indigo-800/50 p-2 rounded-lg h-fit">
                    <ShieldAlert className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <h5 className="text-sm font-black text-indigo-900 dark:text-white tracking-wide">
                      Environment Locked
                    </h5>
                    <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1 font-medium leading-relaxed">
                      Exiting fullscreen or switching tabs during an active
                      session will trigger an automatic security audit.
                    </p>
                  </div>
                </div>
              </div>
            </GlassCard>

            <GlassCard className="p-8">
              <h4 className="font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <FileText className="w-5 h-5 text-purple-500" /> Quick
                Guidelines
              </h4>
              <ul className="space-y-4">
                {[
                  "Secure reliable internet access",
                  "Close all non-essential applications",
                  "System logs all copy/paste attempts",
                  "Browser focus is actively monitored",
                ].map((rule, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-3 text-sm text-gray-600 dark:text-gray-400 font-medium"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-1.5 shrink-0 shadow-[0_0_8px_rgba(168,85,247,0.8)]" />
                    {rule}
                  </li>
                ))}
              </ul>
            </GlassCard>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
