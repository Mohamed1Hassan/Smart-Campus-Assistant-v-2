"use client";

import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  Plus,
  Clock,
  MapPin,
  X,
  Save,
  FileText,
  ShieldAlert,
  MonitorPlay,
  AlertTriangle,
  UserX,
  CheckCircle2,
} from "lucide-react";
import DashboardLayout from "../components/common/DashboardLayout";
import {
  getCourseExamsAction,
  scheduleExamAction,
} from "../actions/exam.actions";
import { useToast } from "../components/common/ToastProvider";
import { apiClient } from "../services/api";

interface Exam {
  id: number;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  room: string;
}

interface CourseSummary {
  id: number;
  courseName: string;
  courseCode: string;
}

interface SecurityAlert {
  id: string;
  studentName: string;
  type: string;
  timestamp: Date;
  status: "OPEN" | "PENALIZED" | "DISMISSED";
}

const EMPTY_ARRAY: any[] = [];

// --- Components ---

const GlassCard = ({
  children,
  className = "",
  variant = "default",
  noBlur = false,
}: {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "danger" | "warning";
  noBlur?: boolean;
}) => {
  const variants = {
    default:
      "bg-white/95 dark:bg-gray-800/95 border border-gray-100 dark:border-gray-700/50",
    danger:
      "bg-red-50/95 dark:bg-red-900/40 border border-red-100 dark:border-red-800/50",
    warning:
      "bg-amber-50/95 dark:bg-amber-900/40 border border-amber-100 dark:border-amber-800/50",
  };
  return (
    <div
      className={`${noBlur ? "" : "backdrop-blur-xl"} rounded-3xl shadow-sm hover:shadow-xl transition-all ${variants[variant]} ${className}`}
      style={{ willChange: "transform, opacity" }}
    >
      {children}
    </div>
  );
};

// Alert types matching schema
const ALERT_TYPES: Record<string, string> = {
  TAB_SWITCH: "Tab Switched",
  COPY_PASTE_ATTEMPT: "Copy/Paste Attempt",
  UNAUTHORIZED_CLICK: "Unauthorized Click",
  KEYBOARD_SHORTCUT: "Keyboard Shortcut",
};

export default function ProfessorExams() {
  const [selectedCourse, setSelectedCourse] = useState<number | null>(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [activeProctorExam, setActiveProctorExam] = useState<number | null>(
    null,
  );

  const { success, error, warning } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    startTime: "",
    endTime: "",
    room: "",
  });

  // Load courses
  const { data: courses = EMPTY_ARRAY } = useQuery({
    queryKey: ["professor-courses-summary"],
    queryFn: async () => {
      const res = await apiClient.get("/api/courses", {
        params: { summary: true },
      });
      return res.success ? (res.data as CourseSummary[]) : [];
    },
  });

  const { data: exams = EMPTY_ARRAY, isLoading } = useQuery<Exam[]>({
    queryKey: ["course-exams", selectedCourse],
    queryFn: async () => {
      if (!selectedCourse) return [];
      const res = await getCourseExamsAction(selectedCourse);
      // Sort by upcoming first
      return res.success
        ? [...res.data].sort(
            (a, b) =>
              new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
          )
        : [];
    },
    enabled: !!selectedCourse,
  });

  const scheduleMutation = useMutation({
    mutationFn: (data: Partial<Exam>) =>
      scheduleExamAction({ ...data, courseId: selectedCourse! } as {
        title: string;
        startTime: string;
        endTime: string;
        room: string;
        courseId: number;
        description?: string;
      }),
    onSuccess: (res) => {
      if (res.success) {
        success("Assessment scheduled and secure environment created.");
        queryClient.invalidateQueries({
          queryKey: ["course-exams", selectedCourse],
        });
        setShowScheduleModal(false);
      } else {
        error(res.error ?? "Unknown error");
      }
    },
  });

  // Load real security alerts for the active exam
  const { data: realAlerts = EMPTY_ARRAY } = useQuery<SecurityAlert[]>({
    queryKey: ["exam-alerts", activeProctorExam],
    queryFn: async () => {
      if (!activeProctorExam) return [];
      const res = await apiClient.get(`/api/exams/${activeProctorExam}/alerts`);
      return res.success && res.data
        ? (res.data as Record<string, unknown>[]).map((a) => ({
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            id: (a as any).id.toString(),
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            studentName: `${(a as any).student.firstName} ${(a as any).student.lastName}`,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            type: (a as any).alertType,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            timestamp: new Date((a as any).createdAt),
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            status: (a as any).isResolved ? "DISMISSED" : "OPEN",
          }))
        : [];
    },
    enabled: !!activeProctorExam,
    refetchInterval: 5000, // Fallback polling
  });

  // Instead of copying realAlerts to securityAlerts via useEffect, calculate it directly
  // If the server polling/socket adds real alerts, we merge them into the local state
  // We initialize local state with realAlerts
  const [localAlerts, setLocalAlerts] = useState<SecurityAlert[]>([]);

  useEffect(() => {
    if (!activeProctorExam) {
      setLocalAlerts(EMPTY_ARRAY);
      return;
    }

    if (realAlerts && realAlerts.length > 0) {
      setLocalAlerts((prev: SecurityAlert[]) => {
        // Only if we haven't loaded yet or if we have new ones
        if (prev.length === 0) return realAlerts;

        // Otherwise, we merge uniquely by ID to avoid refreshing local state (Dismiss/Penalize)
        const prevIds = new Set(prev.map((a: SecurityAlert) => a.id));
        const newAlerts = realAlerts.filter((a: SecurityAlert) => !prevIds.has(a.id));
        if (newAlerts.length === 0) return prev;
        return [...newAlerts, ...prev];
      });
    }
  }, [activeProctorExam, realAlerts]);

  // Socket listener for real-time alerts
  useEffect(() => {
    if (!activeProctorExam) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleNewAlert = (payload: any) => {
      if (
        payload.category === "EXAM" &&
        payload.metadata?.examId === activeProctorExam
      ) {
        const newAlert: SecurityAlert = {
          id: payload.id.toString(),
          studentName: payload.metadata.studentName,
          type: payload.metadata.violationType,
          timestamp: new Date(payload.createdAt),
          status: "OPEN",
        };
        setLocalAlerts((prev) => [newAlert, ...prev].slice(0, 50));
        warning(`New Security Alert: ${newAlert.studentName}`);
      }
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const socket = (window as unknown as { socket: any }).socket; // Access global socket if available
    if (socket) {
      socket.on("notification", handleNewAlert);
      return () => socket.off("notification", handleNewAlert);
    }
  }, [activeProctorExam, warning]);

  const handlePenalize = (alertId: string) => {
    setLocalAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, status: "PENALIZED" } : a)),
    );
    success("Student attempt has been flagged and penalized.");
  };

  const handleDismiss = (alertId: string) => {
    setLocalAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, status: "DISMISSED" } : a)),
    );
  };

  return (
    <DashboardLayout userType="professor">
      <div className="space-y-8 pb-32">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full text-xs font-bold uppercase tracking-wider">
              <MonitorPlay className="w-3.5 h-3.5" />
              Active Monitoring
            </div>
            <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">
              Assessment{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
                Command Control
              </span>
            </h1>
            <p className="text-gray-500 dark:text-gray-400 font-medium">
              Schedule secure exams and monitor live sessions for academic
              integrity.
            </p>
          </div>

          {selectedCourse && !activeProctorExam && (
            <button
              onClick={() => setShowScheduleModal(true)}
              className="px-6 py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-2xl font-black uppercase tracking-widest text-xs hover:scale-105 transition-all shadow-xl flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Create / Schedule Exam
            </button>
          )}
        </header>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          {/* Sidebar Overview */}
          <div className="xl:col-span-1 space-y-6">
            <GlassCard className="p-6">
              <h3 className="font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest text-xs mb-4">
                Command Target
              </h3>
              <div className="space-y-3">
                {courses.map((course) => (
                  <button
                    key={course.id}
                    onClick={() => {
                      setSelectedCourse(course.id);
                      setActiveProctorExam(null);
                    }}
                    className={`w-full p-4 rounded-2xl text-left transition-all border ${
                      selectedCourse === course.id
                        ? "bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/20"
                        : "bg-gray-50 dark:bg-gray-800/50 border-transparent hover:border-gray-200 dark:hover:border-gray-700 text-gray-700 dark:text-gray-300"
                    }`}
                  >
                    <p className="font-bold truncate text-sm">
                      {course.courseName}
                    </p>
                    <p
                      className={`text-[10px] uppercase tracking-widest mt-1 ${selectedCourse === course.id ? "text-indigo-200" : "text-gray-400"}`}
                    >
                      {course.courseCode}
                    </p>
                  </button>
                ))}
              </div>
            </GlassCard>

            {/* Security Summary Panel */}
            {activeProctorExam && (
              <GlassCard
                variant="danger"
                className="p-6 relative overflow-hidden group"
              >
                <div className="absolute top-0 right-0 p-4 opacity-10 text-red-500 group-hover:scale-110 transition-transform">
                  <ShieldAlert className="w-24 h-24" />
                </div>
                <h3 className="font-black text-red-600 dark:text-red-400 flex items-center gap-2 mb-2 text-sm relative z-10">
                  <AlertTriangle className="w-4 h-4" /> Live Session Threat
                  Level
                </h3>
                <div className="mt-4 space-y-4 relative z-10">
                  <div>
                    <p className="text-3xl font-black text-gray-900 dark:text-white">
                      {localAlerts.filter((a) => a.status === "OPEN").length}
                    </p>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Active Threats
                    </p>
                  </div>
                  <div className="pt-4 border-t border-red-200/50 dark:border-red-900/50">
                    <button
                      onClick={() => setActiveProctorExam(null)}
                      className="w-full py-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-xl font-black uppercase text-xs tracking-widest hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                    >
                      End Proctoring Session
                    </button>
                  </div>
                </div>
              </GlassCard>
            )}
          </div>

          {/* Main Area */}
          <div className="xl:col-span-3 space-y-6">
            {!selectedCourse ? (
              <GlassCard className="flex flex-col items-center justify-center py-32 text-center border-dashed border-2">
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 p-6 rounded-3xl mb-6">
                  <Calendar className="w-16 h-16 text-indigo-400" />
                </div>
                <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2">
                  Select a Course to Manage Exams
                </h3>
                <p className="text-gray-500 max-w-sm">
                  Select a course from the sidebar to schedule new assessments
                  or monitor live exam proctoring.
                </p>
              </GlassCard>
            ) : activeProctorExam ? (
              /* Live Proctoring View */
              <div className="space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-gray-700">
                  <div>
                    <h2 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                      Live Integrity Feed
                    </h2>
                    <p className="text-sm font-bold text-gray-500 mt-1">
                      Monitoring active examination for suspicious behavior.
                    </p>
                  </div>
                  <div className="px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-xs font-black uppercase tracking-widest shadow-sm border border-red-100 dark:border-red-900/50 flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4" /> Monitoring Active
                  </div>
                </div>

                <div className="grid gap-4">
                  <AnimatePresence mode="popLayout">
                    {localAlerts.length === 0 ? (
                      <GlassCard className="p-12 text-center">
                        <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
                        <p className="font-bold text-gray-900 dark:text-white text-lg">
                          All Systems Secure
                        </p>
                        <p className="text-gray-500 text-sm mt-1">
                          No integrity violations detected in the current
                          session.
                        </p>
                      </GlassCard>
                    ) : (
                      localAlerts.map((alert) => (
                        <motion.div
                          key={alert.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className={`p-5 sm:p-6 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm transition-colors ${
                            alert.status === "OPEN"
                              ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800/50"
                              : alert.status === "PENALIZED"
                                ? "bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 opacity-70"
                                : "bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700/50 opacity-50"
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            <div
                              className={`p-3 rounded-xl ${
                                alert.status === "OPEN"
                                  ? "bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400"
                                  : "bg-gray-200 dark:bg-gray-700 text-gray-500"
                              }`}
                            >
                              {alert.status === "OPEN" ? (
                                <AlertTriangle className="w-6 h-6" />
                              ) : (
                                <CheckCircle2 className="w-6 h-6" />
                              )}
                            </div>
                            <div>
                              <div className="flex items-center gap-3 mb-1">
                                <h4
                                  className={`font-black tracking-tight ${alert.status === "OPEN" ? "text-gray-900 dark:text-white" : "text-gray-500 line-through"}`}
                                >
                                  {alert.studentName}
                                </h4>
                                <span className="text-[10px] font-mono text-gray-500 bg-black/5 dark:bg-white/5 px-2 py-0.5 rounded">
                                  {alert.timestamp.toLocaleTimeString()}
                                </span>
                              </div>
                              <p
                                className={`text-sm font-bold uppercase tracking-wider ${
                                  alert.status === "OPEN"
                                    ? "text-red-600 dark:text-red-400"
                                    : "text-gray-500"
                                }`}
                              >
                                Violation:{" "}
                                {ALERT_TYPES[alert.type] ||
                                  alert.type.replace(/_/g, " ")}
                              </p>
                            </div>
                          </div>

                          {alert.status === "OPEN" && (
                            <div className="flex w-full sm:w-auto gap-3">
                              <button
                                onClick={() => handleDismiss(alert.id)}
                                className="flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                              >
                                Dismiss
                              </button>
                              <button
                                onClick={() => handlePenalize(alert.id)}
                                className="flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-600/20 transition-all flex items-center justify-center gap-2"
                              >
                                <UserX className="w-4 h-4" /> Penalize
                              </button>
                            </div>
                          )}
                          {alert.status !== "OPEN" && (
                            <span className="text-xs font-bold uppercase tracking-widest text-gray-400 border border-gray-200 dark:border-gray-700 px-3 py-1 rounded-full">
                              {alert.status}
                            </span>
                          )}
                        </motion.div>
                      ))
                    )}
                  </AnimatePresence>
                </div>
              </div>
            ) : (
              /* Scheduled Exams List Area */
              <div className="grid grid-cols-1 gap-6">
                {exams.map((exam: Exam) => {
                  const isUpcoming = new Date(exam.startTime) > new Date();

                  return (
                    <motion.div
                      key={exam.id}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 p-6 sm:p-8 shadow-sm hover:shadow-xl transition-all group"
                    >
                      <div className="flex flex-col sm:flex-row justify-between items-start gap-6">
                        {/* Details */}
                        <div className="space-y-4">
                          <div className="flex items-center gap-3">
                            <div
                              className={`p-2.5 rounded-xl ${isUpcoming ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400" : "bg-gray-50 dark:bg-gray-800 text-gray-500"}`}
                            >
                              <FileText className="w-5 h-5" />
                            </div>
                            <Badge
                              className={
                                isUpcoming
                                  ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800"
                                  : "bg-gray-100 dark:bg-gray-800 text-gray-500"
                              }
                            >
                              {isUpcoming
                                ? "Upcoming Deployment"
                                : "Archived Record"}
                            </Badge>
                          </div>

                          <div>
                            <h3 className="text-2xl font-black text-gray-900 dark:text-white group-hover:text-indigo-600 transition-colors">
                              {exam.title}
                            </h3>
                            {exam.description && (
                              <p className="text-sm font-medium text-gray-500 mt-1">
                                {exam.description}
                              </p>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-4 text-sm font-bold text-gray-600 dark:text-gray-400 pt-2">
                            <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800/50 px-3 py-1.5 rounded-lg border border-gray-100 dark:border-gray-700">
                              <Calendar className="w-4 h-4 text-indigo-500" />
                              {new Date(exam.startTime).toLocaleDateString(
                                undefined,
                                {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                },
                              )}
                            </div>
                            <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800/50 px-3 py-1.5 rounded-lg border border-gray-100 dark:border-gray-700">
                              <Clock className="w-4 h-4 text-indigo-500" />
                              {new Date(exam.startTime).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </div>
                            <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800/50 px-3 py-1.5 rounded-lg border border-gray-100 dark:border-gray-700">
                              <MapPin className="w-4 h-4 text-indigo-500" />
                              {exam.room || "Location TBA"}
                            </div>
                          </div>
                        </div>

                        {/* Action Tools */}
                        <div className="flex sm:flex-col items-center gap-3 w-full sm:w-auto pt-4 sm:pt-0 border-t sm:border-t-0 sm:border-l border-gray-100 dark:border-gray-700 sm:pl-6">
                          <button
                            onClick={() => setActiveProctorExam(exam.id)}
                            className={`w-full sm:w-auto px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-lg ${
                              isUpcoming
                                ? "bg-indigo-600 text-white hover:bg-indigo-700 hover:-translate-y-0.5 shadow-indigo-600/20"
                                : "bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:scale-[1.02]"
                            }`}
                          >
                            {isUpcoming ? (
                              <>
                                <MonitorPlay className="w-4 h-4" /> Start
                                Proctoring
                              </>
                            ) : (
                              <>
                                <FileText className="w-4 h-4" /> View Report
                              </>
                            )}
                          </button>
                          {!isUpcoming && (
                            <button className="w-full sm:w-auto px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors border border-red-100 dark:border-red-900/50">
                              Security Audit
                            </button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
                {exams.length === 0 && !isLoading && (
                  <GlassCard className="col-span-full py-24 text-center border-dashed border-2">
                    <div className="inline-flex bg-gray-50 dark:bg-gray-800 p-4 rounded-full mb-4">
                      <ShieldAlert className="w-10 h-10 text-gray-300" />
                    </div>
                    <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">
                      No Active Exams
                    </h3>
                    <p className="text-gray-500 font-medium">
                      Use the &quot;Create / Schedule Exam&quot; button to set
                      up a new secure exam session.
                    </p>
                  </GlassCard>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Schedule Modal UI */}
      <AnimatePresence>
        {showScheduleModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white dark:bg-gray-900 w-full max-w-lg rounded-[2rem] overflow-hidden shadow-2xl border border-white/20 dark:border-gray-700/50"
            >
              <div className="p-8 sm:p-10">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                    Deploy Assessment
                  </h3>
                  <button
                    onClick={() => setShowScheduleModal(false)}
                    className="text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors bg-gray-50 dark:bg-gray-800 p-2 rounded-full"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="space-y-6">
                  <div>
                    <label className="text-[10px] font-black tracking-widest text-gray-400 uppercase mb-2 block">
                      Assessment Title
                    </label>
                    <input
                      type="text"
                      className="w-full px-5 py-4 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all font-bold dark:text-white"
                      placeholder="Midterm Examination (Secure)"
                      value={formData.title}
                      onChange={(e) =>
                        setFormData({ ...formData, title: e.target.value })
                      }
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-black tracking-widest text-gray-400 uppercase mb-2 block">
                        Initialization Time
                      </label>
                      <input
                        type="datetime-local"
                        className="w-full px-5 py-4 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all font-bold text-sm dark:text-white"
                        value={formData.startTime}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            startTime: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black tracking-widest text-gray-400 uppercase mb-2 block">
                        Termination Time
                      </label>
                      <input
                        type="datetime-local"
                        className="w-full px-5 py-4 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all font-bold text-sm dark:text-white"
                        value={formData.endTime}
                        onChange={(e) =>
                          setFormData({ ...formData, endTime: e.target.value })
                        }
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-black tracking-widest text-gray-400 uppercase mb-2 block">
                      Room Designation
                    </label>
                    <input
                      type="text"
                      className="w-full px-5 py-4 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all font-bold dark:text-white"
                      placeholder="Virtual Room A"
                      value={formData.room}
                      onChange={(e) =>
                        setFormData({ ...formData, room: e.target.value })
                      }
                    />
                  </div>
                  <button
                    onClick={() => scheduleMutation.mutate(formData)}
                    disabled={scheduleMutation.isPending}
                    className="w-full mt-4 py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest hover:scale-[1.02] hover:bg-indigo-700 shadow-xl shadow-indigo-600/20 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                  >
                    {scheduleMutation.isPending ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/20 border-b-white"></div>
                    ) : (
                      <>
                        <Save className="w-5 h-5" /> Execute Deployment
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
// Helper
function Badge({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${className}`}
    >
      {children}
    </span>
  );
}
