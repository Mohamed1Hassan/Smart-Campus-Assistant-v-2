"use client";
import { useState, useEffect, useMemo, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { CreateSessionData } from "../services/attendance.service";
import {
  BookOpen,
  Users,
  Clock,
  MapPin,
  Shield,
  Plus,
  Eye,
  BarChart3,
  RefreshCw,
  Calendar,
  MoreVertical,
  Bell,
  CheckCircle2,
  Activity,
  PauseCircle,
  StopCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { AIAssistantButton } from "../components/common/AIAssistantButton";
import DashboardLayout from "../components/common/DashboardLayout";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Label } from "../components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { useToast } from "../components/common/ToastProvider";
import { apiClient } from "../services/api";
import { useAttendanceSessions } from "../hooks/useAttendanceSessions";
import ChatbotCard from "../components/ChatbotCard";
import { useAuth } from "../contexts/AuthContext";

interface CourseSummary {
  id: number;
  courseName: string;
  courseCode: string;
}

interface RawScheduleItem {
  id: number;
  professorId: number;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  courseName: string;
  room?: string;
}

interface ActivityItem {
  id: number;
  type: string;
  title: string;
  message: string;
  createdAt: string;
}

export default function ProfessorDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const { success: successToast, error: showError } = useToast();

  // Real data hooks
  const {
    sessions: attendanceSessions,
    isLoading: isLoadingSessions,
    createSession,
    stopSession,
    pauseSession,
    startSession,
    loadSessions: loadAttendanceSessions,
  } = useAttendanceSessions();

  // suppress unused loading state
  void isLoadingSessions;

  const queryClient = useQueryClient();
  const professorId = user?.id
    ? typeof user.id === "string"
      ? parseInt(user.id)
      : user.id
    : undefined;

  // 1. Load Courses
  const { data: courses = [] } = useQuery<CourseSummary[]>({
    queryKey: ["professor-courses", professorId, "summary"],
    queryFn: async () => {
      if (!professorId) return [];
      try {
        const coursesRes = await apiClient.get<CourseSummary[]>(
          "/api/courses",
          { params: { professorId, summary: true } },
        );
        if (coursesRes.success && Array.isArray(coursesRes.data)) {
          return coursesRes.data;
        }
        return [];
      } catch {
        return [];
      }
    },
    enabled: !!professorId,
    staleTime: 5 * 60 * 1000,
  });

  // 2. Load Static Schedule
  const { data: staticSchedule = [] } = useQuery({
    queryKey: ["professor-schedule", professorId],
    queryFn: async () => {
      if (!professorId) return [];
      try {
        const scheduleRes = await apiClient.get("/api/schedule", {
          params: { isActive: true },
        });
        if (scheduleRes.success && Array.isArray(scheduleRes.data)) {
          const today = new Date();
          const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.

          return (scheduleRes.data as RawScheduleItem[])
            .filter(
              (s) => s.professorId === professorId && s.dayOfWeek === dayOfWeek,
            )
            .map((s) => {
              const [startH, startM] = s.startTime.split(":").map(Number);
              const [endH, endM] = s.endTime.split(":").map(Number);
              const now = new Date();
              const start = new Date();
              start.setHours(startH, startM, 0);
              const end = new Date();
              end.setHours(endH, endM, 0);

              let status = "upcoming";
              if (now > end) status = "completed";
              else if (now >= start && now <= end) status = "in-progress";

              return {
                id: `static-${s.id}`,
                course: s.courseName,
                time: `${s.startTime} - ${s.endTime}`,
                room: s.room || "TBA",
                status,
                rawStartTime: start,
              };
            });
        }
        return [];
      } catch {
        console.error("Error loading schedule:");
        return [];
      }
    },
    enabled: !!professorId,
    staleTime: 5 * 60 * 1000,
  });

  // Merge Schedule with Active Sessions
  const upcomingClasses = useMemo(() => {
    const today = new Date();
    const todaySessions = attendanceSessions
      .filter((s) => {
        const sessionDate = new Date(s.startTime);
        return sessionDate.toDateString() === today.toDateString();
      })
      .map((s) => {
        const start = new Date(s.startTime);
        const end = new Date(s.endTime);
        const now = new Date();

        let status = "upcoming";
        if (s.status === "ENDED" || now > end) status = "completed";
        else if (s.status === "ACTIVE" || (now >= start && now <= end))
          status = "in-progress";

        return {
          id: s.id,
          course: s.courseName,
          time: `${start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false })} - ${end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false })}`,
          room: s.location?.name || "Online",
          status,
          rawStartTime: start,
          isRealSession: true,
        };
      });

    return [...staticSchedule, ...todaySessions].sort(
      (a, b) => a.rawStartTime.getTime() - b.rawStartTime.getTime(),
    );
  }, [staticSchedule, attendanceSessions]);

  // 3. Load Activity
  const { data: recentActivity = [] } = useQuery({
    queryKey: ["professor-notifications", professorId],
    queryFn: async () => {
      if (!professorId) return [];
      const activityRes = await apiClient.get("/api/notifications", {
        params: { limit: 5 },
      });
      if (activityRes.success) {
        return (activityRes.data as ActivityItem[]).map((n) => ({
          id: n.id,
          type: n.type,
          title: n.title,
          message: n.message,
          time: new Date(n.createdAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        }));
      }
      return [];
    },
    enabled: !!professorId,
    staleTime: 5 * 60 * 1000,
  });

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentTime, setCurrentTime] = useState<Date | null>(null);

  // Dialog states
  const [showQuickCreate, setShowQuickCreate] = useState(false);
  const [isCreatingSession, setIsCreatingSession] = useState(false);

  // Quick Create Form State
  const [quickCreateForm, setQuickCreateForm] = useState({
    course: "",
    title: "",
    startTime: "",
    duration: "",
    locationRequired: true,
    photoRequired: false,
  });

  // Update time every minute
  useEffect(() => {
    setCurrentTime(new Date());
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);


  const fetchDashboardData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        loadAttendanceSessions(),
        queryClient.invalidateQueries({ queryKey: ["professor-courses"] }),
        queryClient.invalidateQueries({ queryKey: ["professor-schedule"] }),
        queryClient.invalidateQueries({
          queryKey: ["professor-notifications"],
        }),
      ]);
    } catch (e) {
      console.error("Error refreshing dashboard:", e);
    } finally {
      setIsRefreshing(false);
    }
  }, [loadAttendanceSessions, queryClient]);

  const handleRefresh = async () => {
    await fetchDashboardData();
  };

  // Derived Stats
  const stats = useMemo(() => {
    const active = attendanceSessions.filter(
      (s) => s.status === "ACTIVE",
    ).length;

    // Calculate real stats from sessions
    const totalStudents = attendanceSessions.reduce(
      (sum, s) => sum + (s.totalStudents || 0),
      0,
    );
    const presentStudents = attendanceSessions.reduce(
      (sum, s) => sum + (s.presentStudents || 0),
      0,
    );
    const avgAttendance =
      totalStudents > 0
        ? Math.round((presentStudents / totalStudents) * 100)
        : 0;

    return { active, totalStudents, avgAttendance };
  }, [attendanceSessions]);

  // Greeting
  const greeting = useMemo(() => {
    if (!currentTime) return "Welcome";
    const hour = currentTime.getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  }, [currentTime]);


  // Quick Create Handlers
  const handleQuickCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingSession(true);

    try {
      const selectedCourse = courses.find(
        (c) => c.id == Number(quickCreateForm.course),
      );
      if (!selectedCourse) {
        showError("Please select a course");
        setIsCreatingSession(false);
        return;
      }

      const now = new Date();
      // Ensure duration is a number, default to 60 minutes if empty or invalid
      const durationMinutes = parseInt(quickCreateForm.duration) || 60;
      const endTime = new Date(now.getTime() + durationMinutes * 60 * 1000);

      const sessionData: CreateSessionData = {
        professorId: user?.id?.toString() || "",
        courseId: parseInt(quickCreateForm.course),
        courseName: selectedCourse.courseName,
        title:
          quickCreateForm.title ||
          `Quick Session - ${selectedCourse.courseCode}`,
        description: "Quick session created from dashboard",
        startTime: now,
        endTime: endTime,
        location: {
          latitude: 0,
          longitude: 0,
          radius: 50,
          name: "Main Hall",
        },
        security: {
          isLocationRequired: false,
          isPhotoRequired: false,
          isDeviceCheckRequired: true,
          fraudDetectionEnabled: true,
          gracePeriod: 15,
          maxAttempts: 3,
          riskThreshold: 70,
        },
      };

      const session = await createSession(sessionData);
      if (session) {
        // Auto-start the session for "Quick Create"
        await startSession(session.id);

        successToast("Session created and started successfully");
        setShowQuickCreate(false);
        fetchDashboardData();
        // Reset form
        setQuickCreateForm({
          course: "",
          title: "",
          startTime: "",
          duration: "",
          locationRequired: true,
          photoRequired: false,
        });
      }
    } catch (error) {
      console.error("Error creating session:", error);
      showError("Failed to create session");
    } finally {
      setIsCreatingSession(false);
    }
  };

  const handleEndSession = async () => {
    const activeSession = attendanceSessions.find((s) => s.status === "ACTIVE");
    if (!activeSession) return;

    if (confirm("Are you sure you want to end this session?")) {
      const success = await stopSession(activeSession.id);
      if (success) {
        successToast("Session ended successfully");
        fetchDashboardData();
      } else {
        showError("Failed to end session");
      }
    }
  };

  const handlePauseSession = async () => {
    const activeSession = attendanceSessions.find((s) => s.status === "ACTIVE");
    if (!activeSession) return;

    // Toggle logic: if active, pause. If paused (not implemented in UI yet but good to have), resume.
    // For now, just pause.
    const success = await pauseSession(activeSession.id);
    if (success) {
      successToast("Session paused");
      fetchDashboardData();
    } else {
      showError("Failed to pause session");
    }
  };

  return (
    <DashboardLayout
      userName={user ? `${user.firstName} ${user.lastName}` : "Professor"}
      userType="professor"
    >
      <div className="max-w-7xl mx-auto space-y-6 md:space-y-8 pb-12">
        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-600 text-white shadow-xl">
          {/* Background Image & Overlay */}
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1524178232363-1fb2b075b655?ixlib=rb-1.2.1&auto=format&fit=crop&w=1920&q=80')] bg-cover bg-center opacity-20 mix-blend-overlay"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>

          {/* Decorative Blobs */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

          <div className="relative z-10 p-6 md:p-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-3 mb-2 text-indigo-100"
              >
                <Calendar className="w-5 h-5" />
                <span>
                  {currentTime 
                    ? currentTime.toLocaleDateString("en-US", {
                        weekday: "long",
                        month: "long",
                        day: "numeric",
                      })
                    : "Loading..."}
                </span>

              </motion.div>
              <motion.h1
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-3xl md:text-5xl font-bold mb-4"
              >
                {greeting}, Dr. {user?.firstName}
              </motion.h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-indigo-100 text-lg max-w-xl"
              >
                You have{" "}
                <span className="font-bold text-white">
                  {stats.active} active sessions
                </span>{" "}
                and{" "}
                <span className="font-bold text-white">
                  {
                    upcomingClasses.filter((c) => c.status === "upcoming")
                      .length
                  }{" "}
                  upcoming classes
                </span>{" "}
                today.
              </motion.p>
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="flex gap-3"
            >
              <button
                onClick={() => setShowQuickCreate(true)}
                className="px-6 py-3 bg-white text-indigo-600 rounded-xl font-bold shadow-lg hover:shadow-xl hover:bg-indigo-50 transition-all flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Quick Create
              </button>
              <button
                onClick={handleRefresh}
                className={`p-3 bg-white/20 backdrop-blur-md text-white rounded-xl hover:bg-white/30 transition-all ${isRefreshing ? "animate-spin" : ""}`}
              >
                <RefreshCw className="w-5 h-5" />
              </button>
            </motion.div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
          {[
            {
              label: "Total Students",
              value: stats.totalStudents,
              icon: Users,
              color: "text-blue-500",
              bg: "bg-blue-500/10",
            },
            {
              label: "Avg. Attendance",
              value: `${stats.avgAttendance}%`,
              icon: BarChart3,
              color: "text-green-500",
              bg: "bg-green-500/10",
            },
            {
              label: "Active Courses",
              value: courses.length,
              icon: BookOpen,
              color: "text-purple-500",
              bg: "bg-purple-500/10",
            },
            {
              label: "Total Sessions",
              value: attendanceSessions.length,
              icon: Activity,
              color: "text-orange-500",
              bg: "bg-orange-500/10",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-white dark:bg-cardDark p-4 md:p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-all"
            >
              <div className="flex justify-between items-start mb-3 md:mb-4">
                <div
                  className={`p-2 md:p-3 rounded-xl ${stat.bg} ${stat.color}`}
                >
                  <stat.icon className="w-5 h-5 md:w-6 md:h-6" />
                </div>
              </div>
              <h3 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-1">
                {stat.value}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 text-xs md:text-sm">
                {stat.label}
              </p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          {/* Left Column: Live & Schedule */}
          <div className="lg:col-span-2 space-y-6 md:space-y-8">
            {/* Live Now Section */}
            {attendanceSessions.some((s) => s.status === "ACTIVE") && (
              <div
                className="bg-white dark:bg-cardDark rounded-3xl border border-gray-100 dark:border-gray-700 shadow-lg overflow-hidden relative"
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-400 to-emerald-500" />
                <div className="p-5 md:p-8">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className="relative flex h-3 w-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                        </span>
                        <span className="text-green-600 font-bold tracking-wide text-sm uppercase">
                          Live Now
                        </span>
                      </div>
                      <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
                        {
                          attendanceSessions.find((s) => s.status === "ACTIVE")
                            ?.courseName
                        }
                      </h2>
                      <p className="text-gray-500 dark:text-gray-400 flex items-center gap-2 mt-1 text-sm md:text-base">
                        <MapPin className="w-4 h-4" />
                        {attendanceSessions.find((s) => s.status === "ACTIVE")
                          ?.location?.name || "Main Hall"}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                        <MoreVertical className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {/* Live Stats */}
                  <div className="grid grid-cols-3 gap-3 md:gap-4 mb-6 md:mb-8">
                    <div className="bg-gray-50 dark:bg-gray-800/50 p-3 md:p-4 rounded-2xl text-center">
                      <div className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
                        {
                          attendanceSessions.find((s) => s.status === "ACTIVE")
                            ?.presentStudents
                        }
                      </div>
                      <div className="text-[10px] md:text-xs text-gray-500 uppercase tracking-wider font-medium mt-1">
                        Present
                      </div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800/50 p-3 md:p-4 rounded-2xl text-center">
                      <div className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
                        {
                          attendanceSessions.find((s) => s.status === "ACTIVE")
                            ?.totalStudents
                        }
                      </div>
                      <div className="text-[10px] md:text-xs text-gray-500 uppercase tracking-wider font-medium mt-1">
                        Total
                      </div>
                    </div>
                    <div className="bg-red-50 dark:bg-red-900/10 p-3 md:p-4 rounded-2xl text-center">
                      <div className="text-xl md:text-2xl font-bold text-red-600 dark:text-red-400">
                        {attendanceSessions.find((s) => s.status === "ACTIVE")
                          ?.fraudAlerts || 0}
                      </div>
                      <div className="text-[10px] md:text-xs text-red-500 uppercase tracking-wider font-medium mt-1">
                        Alerts
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-6 md:mb-8">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-600 dark:text-gray-400">
                        Attendance Rate
                      </span>
                      <span className="font-bold text-gray-900 dark:text-white">
                        {Math.round(
                          ((attendanceSessions.find(
                            (s) => s.status === "ACTIVE",
                          )?.presentStudents || 0) /
                            (attendanceSessions.find(
                              (s) => s.status === "ACTIVE",
                            )?.totalStudents || 1)) *
                            100,
                        )}
                        %
                      </span>
                    </div>
                    <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{
                          width: `${((attendanceSessions.find((s) => s.status === "ACTIVE")?.presentStudents || 0) / (attendanceSessions.find((s) => s.status === "ACTIVE")?.totalStudents || 1)) * 100}%`,
                        }}
                        className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"
                      />
                    </div>
                  </div>

                  {/* Controls */}
                  <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
                    <button
                      onClick={handleEndSession}
                      className="flex-1 py-3 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      <StopCircle className="w-5 h-5" />
                      End Session
                    </button>
                    <button
                      onClick={handlePauseSession}
                      className="flex-1 py-3 bg-gray-50 text-gray-700 hover:bg-gray-100 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      <PauseCircle className="w-5 h-5" />
                      Pause
                    </button>
                    <button
                      onClick={() =>
                        router.push(
                          `/dashboard/professor/attendance/sessions/${attendanceSessions.find((s) => s.status === "ACTIVE")?.id}`,
                        )
                      }
                      className="flex-1 py-3 bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      <Eye className="w-5 h-5" />
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Today's Schedule */}
            <div className="bg-white dark:bg-cardDark rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm p-5 md:p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Today&apos;s Schedule
                </h2>
                <button className="text-sm text-indigo-600 font-medium hover:underline">
                  View Calendar
                </button>
              </div>

              <div className="space-y-6">
                {upcomingClasses.length > 0 ? (
                  upcomingClasses.map((cls, index) => (
                    <div key={index} className="flex gap-4 relative">
                      {/* Timeline Line */}
                      {index !== upcomingClasses.length - 1 && (
                        <div className="absolute left-[19px] top-10 bottom-[-24px] w-0.5 bg-gray-100 dark:bg-gray-800" />
                      )}

                      {/* Status Dot */}
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 z-10 ${
                          cls.status === "completed"
                            ? "bg-green-100 text-green-600"
                            : cls.status === "in-progress"
                              ? "bg-indigo-100 text-indigo-600"
                              : "bg-gray-100 text-gray-400"
                        }`}
                      >
                        {cls.status === "completed" ? (
                          <CheckCircle2 className="w-5 h-5" />
                        ) : cls.status === "in-progress" ? (
                          <Activity className="w-5 h-5" />
                        ) : (
                          <Clock className="w-5 h-5" />
                        )}
                      </div>

                      <div className="flex-1 pb-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-bold text-gray-900 dark:text-white text-lg">
                              {cls.course}
                            </h3>
                            <p className="text-gray-500 text-sm flex items-center gap-2 mt-1">
                              <Clock className="w-3 h-3" /> {cls.time}
                              <span className="w-1 h-1 bg-gray-300 rounded-full" />
                              <MapPin className="w-3 h-3" /> {cls.room}
                            </p>
                          </div>
                          <Badge
                            variant={
                              cls.status === "in-progress"
                                ? "default"
                                : "secondary"
                            }
                            className="capitalize"
                          >
                            {cls.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Calendar className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                      No classes today
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">
                      You don&apos;t have any classes scheduled for today.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Activity & Quick Actions */}
          <div className="space-y-8">
            {/* Chatbot Entry */}
            <ChatbotCard href="/dashboard/professor/chatbot" />

            {/* Quick Actions */}
            <div className="bg-white dark:bg-cardDark rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                Quick Actions
              </h2>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() =>
                    router.push("/dashboard/professor/attendance/create")
                  }
                  className="p-4 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-colors text-left group"
                >
                  <Plus className="w-6 h-6 mb-2 group-hover:scale-110 transition-transform" />
                  <div className="font-bold text-sm">New Session</div>
                </button>
                <button
                  onClick={() =>
                    router.push("/dashboard/professor/attendance/reports")
                  }
                  className="p-4 bg-purple-50 text-purple-600 rounded-xl hover:bg-purple-100 transition-colors text-left group"
                >
                  <BarChart3 className="w-6 h-6 mb-2 group-hover:scale-110 transition-transform" />
                  <div className="font-bold text-sm">Reports</div>
                </button>
                <button
                  onClick={() => router.push("/dashboard/professor/courses")}
                  className="p-4 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors text-left group"
                >
                  <BookOpen className="w-6 h-6 mb-2 group-hover:scale-110 transition-transform" />
                  <div className="font-bold text-sm">Courses</div>
                </button>
                <button
                  onClick={() => router.push("/dashboard/professor/profile")}
                  className="p-4 bg-gray-50 text-gray-600 rounded-xl hover:bg-gray-100 transition-colors text-left group"
                >
                  <Shield className="w-6 h-6 mb-2 group-hover:scale-110 transition-transform" />
                  <div className="font-bold text-sm">Profile</div>
                </button>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white dark:bg-cardDark rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  Recent Activity
                </h2>
                <Bell className="w-5 h-5 text-gray-400" />
              </div>

              <div className="space-y-4">
                {recentActivity.length > 0 ? (
                  recentActivity.map((activity, i: number) => (
                    <div
                      key={i}
                      className="flex gap-3 items-start p-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-xl transition-colors cursor-pointer"
                    >
                      <div
                        className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                          activity.type === "alert"
                            ? "bg-red-500"
                            : "bg-blue-500"
                        }`}
                      />
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2">
                          {activity.message || activity.title}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {activity.time}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500 text-sm">
                    No recent activity
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Create Dialog */}
      <Dialog open={showQuickCreate} onOpenChange={setShowQuickCreate}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Quick Create Session</DialogTitle>
            <DialogDescription>
              Start a new attendance session immediately.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleQuickCreateSubmit} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Course</Label>
              <select
                className="w-full p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent dark:text-white"
                value={quickCreateForm.course}
                onChange={(e) =>
                  setQuickCreateForm({
                    ...quickCreateForm,
                    course: e.target.value,
                  })
                }
              >
                <option value="" className="dark:bg-gray-900">
                  Select Course
                </option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id} className="dark:bg-gray-900">
                    {c.courseName}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Title (Optional)</Label>
              <input
                type="text"
                className="w-full p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent dark:text-white"
                placeholder="e.g. Lecture 5"
                value={quickCreateForm.title}
                onChange={(e) =>
                  setQuickCreateForm({
                    ...quickCreateForm,
                    title: e.target.value,
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Duration (minutes)</Label>
              <input
                type="number"
                className="w-full p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent dark:text-white"
                placeholder="60"
                value={quickCreateForm.duration}
                onChange={(e) =>
                  setQuickCreateForm({
                    ...quickCreateForm,
                    duration: e.target.value,
                  })
                }
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
              disabled={isCreatingSession}
            >
              {isCreatingSession ? "Creating..." : "Start Session"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* AI Assistant Button */}
      <AIAssistantButton userType="professor" />
    </DashboardLayout>
  );
}
