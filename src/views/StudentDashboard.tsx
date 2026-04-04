"use client";
import { useState, useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { m, LazyMotion, domAnimation, Variants } from "framer-motion";
import {
  GraduationCap,
  BookOpen,
  FileText,
  RefreshCw,
  Timer,
  Sparkles,
  LayoutDashboard,
  Zap,
  Calendar,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { AIAssistantButton } from "../components/common/AIAssistantButton";
import dynamic from "next/dynamic";
import DashboardLayout from "../components/common/DashboardLayout";
import StatCardStudent from "../components/student/StatCardStudent";
import { StatsSkeleton, CardSkeleton, ListSkeleton } from "../components/common/LoadingSkeleton";
import { useAuth } from "../contexts/AuthContext";
import { useNotifications } from "../hooks/useNotifications";
import { useToast } from "../components/common/ToastProvider";
import { apiClient } from "../services/api";

// Lazy-load non-critical components
const SchedulePreview = dynamic(() => import("../components/student/SchedulePreview"), {
  loading: () => <CardSkeleton className="lg:col-span-2" />,
});
const AnnouncementsList = dynamic(() => import("../components/student/AnnouncementsList"), {
  loading: () => <ListSkeleton className="h-full" />,
});
const ChatbotCard = dynamic(() => import("../components/ChatbotCard"), {
  loading: () => <CardSkeleton />,
});

// Types for dashboard data
interface StudentStats {
  gpa: number;
  upcomingClasses: number;
  completedCourses: number;
  pendingAssignments: number;
  attendancePercentage: number;
  totalCredits: number;
  currentSemester: string;
}

interface Announcement {
  id: string;
  icon: "megaphone" | "building" | "lightbulb" | "book" | "calendar" | "alert";
  title: string;
  message: string;
  timestamp: string;
  type: "info" | "warning" | "success";
}

interface RawScheduleItem {
  id: number;
  courseName: string;
  courseCode: string;
  startTime: string;
  endTime: string;
  room: string;
  professorName?: string;
  professorFirstName?: string;
  professorLastName?: string;
}

// Hydration-safe Date formatting
const formatDateSafe = (date: string | Date) => {
  if (typeof window === "undefined") return "";
  return new Date(date).toLocaleDateString();
};

interface RawAttendanceSession {
  id: number;
  sessionId?: number;
  courseName: string;
  startTime: string;
  endTime: string;
  location?: { name: string };
  isActive: boolean;
  status: string;
}

interface NotificationItem {
  id: number;
  category: string;
  type: string;
  title: string;
  message: string;
  createdAt: Date;
}

// Helper to format time ago
const formatTimeAgo = (date: string | Date) => {
  if (typeof window === "undefined") return "Earlier"; // Return static during SSR
  const d = new Date(date);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - d.getTime()) / 1000);

  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString();
};

// Helper to map notification type/category to announcement icon/type
const mapNotificationToAnnouncement = (
  notification: NotificationItem,
): Announcement => {
  let icon: Announcement["icon"] = "megaphone";
  let type: Announcement["type"] = "info";

  switch (notification.category) {
    case "ANNOUNCEMENT":
      icon = "megaphone";
      break;
    case "SYSTEM":
      icon = "building";
      break;
    case "COURSE":
      icon = "book";
      break;
    case "EXAM":
    case "DEADLINE":
      icon = "calendar";
      break;
    case "ASSIGNMENT":
      icon = "lightbulb";
      break;
    case "ATTENDANCE":
      icon = "alert";
      break;
    default:
      icon = "megaphone";
  }

  switch (notification.type) {
    case "INFO":
      type = "info";
      break;
    case "WARNING":
    case "URGENT":
    case "ERROR":
      type = "warning";
      break;
    case "SUCCESS":
      type = "success";
      break;
    default:
      type = "info";
  }

  return {
    id: String(notification.id),
    icon,
    title: notification.title,
    message: notification.message,
    timestamp: notification.createdAt.toISOString(), // Send ISO for client-side formatting
    type,
  };
};

interface StudentDashboardProps {
  initialStats?: StudentStats | null;
  initialScheduleRaw?: any[];
  initialSessionsRaw?: any[];
  initialUser?: any;
  initialNotifications?: any[];
}

export default function StudentDashboard({ 
  initialStats = null, 
  initialScheduleRaw = [],
  initialSessionsRaw = [],
  initialUser = null,
  initialNotifications = []
}: StudentDashboardProps) {
  const { user, isAuthenticated } = useAuth();
  const { notifications } = useNotifications();
  const { info: showInfo } = useToast();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  // 1. Fetch Student Stats
  const { data: stats = initialStats, isLoading: statsLoading } = useQuery({
    queryKey: ["student-stats", user?.id],
    queryFn: async () => {
      if (!user?.id) return initialStats;
      const res = await apiClient.get<StudentStats>("/api/users/student/stats");
      if (res.success) return res.data;
      throw new Error(res.message || "Failed to fetch stats");
    },
    initialData: initialStats || undefined,
    enabled: !!user?.id && user.role === "student",
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Helper to convert 24h time to 12h format
  const formatTime = (time: string) => {
    if (!time) return "00:00 AM";
    const parts = time.split(":").map(Number);
    if (parts.length < 2) return time;
    const [hours, minutes] = parts;
    const period = hours >= 12 ? "PM" : "AM";
    const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    return `${displayHours}:${minutes.toString().padStart(2, "0")} ${period}`;
  };

  // Helper to determine class status
  const getClassStatus = (
    startTime: string,
    endTime: string,
  ): "upcoming" | "ongoing" | "completed" => {
    if (!startTime || !endTime) return "upcoming";

    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const startParts = startTime.split(":").map(Number);
    if (startParts.length < 2) return "upcoming";
    const [startHours, startMins] = startParts;
    const startMinutes = startHours * 60 + startMins;

    const endParts = endTime.split(":").map(Number);
    if (endParts.length < 2) return "upcoming";
    const [endHours, endMins] = endParts;
    const endMinutes = endHours * 60 + endMins;

    if (currentMinutes < startMinutes) return "upcoming";
    if (currentMinutes >= startMinutes && currentMinutes <= endMinutes)
      return "ongoing";
    return "completed";
  };

  const adjustDay = (d: number) => (d + 1) % 7;

  // 2. Fetch Schedule
  const { data: todaySchedule = [] } = useQuery({
    queryKey: ["student-schedule-today", user?.id],
    queryFn: async () => {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const end = new Date();
      end.setHours(23, 59, 59, 999);
      const currentDayOfWeekAdjusted = adjustDay(new Date().getDay());

      const [scheduleRes, sessionsRes] = await Promise.all([
        // Use the same server-side action logic or endpoint that matches the Schedule page
        apiClient.get<any[]>("/api/schedule/user"), 
        apiClient.get<RawAttendanceSession[]>("/api/attendance/sessions", {
          params: {
            startDate: start.toISOString(),
            endDate: end.toISOString(),
          },
        }),
      ]);

      const allSchedules = scheduleRes?.success && Array.isArray(scheduleRes.data) ? scheduleRes.data : [];
      const scheduleData = allSchedules.filter((s: any) => s.dayOfWeek === currentDayOfWeekAdjusted);
      const activeSessions = sessionsRes?.success && Array.isArray(sessionsRes.data) ? sessionsRes.data : [];

      // Transformation logic...
      const staticSchedule = scheduleData.map((item: any) => {
        const normalizeTime = (t: string) => {
          if (!t) return "00:00";
          const parts = t.split(":");
          return `${parts[0].padStart(2, "0")}:${parts[1].padStart(2, "0")}`;
        };
        const startStr = normalizeTime(item.startTime);
        const endStr = normalizeTime(item.endTime);
        
        // Handle both nested (Server Action) and flat (API) structures
        const courseName = item.courseName || item.course?.courseName || "Course";
        const courseCode = item.courseCode || item.course?.courseCode || "N/A";
        const profName = item.professorName || 
                         (item.professor ? `${item.professor.firstName} ${item.professor.lastName}` : 
                         `${item.professorFirstName} ${item.professorLastName}`);

        return {
          id: String(item.id),
          course: `${courseName} (${courseCode})`,
          time: `${formatTime(item.startTime || "00:00")} - ${formatTime(item.endTime || "00:00")}`,
          room: item.room,
          status: getClassStatus(startStr, endStr),
          startTime: startStr,
          endTime: endStr,
          courseCode: courseCode,
          professor: profName,
          isActive: false,
          _originalCourseName: courseName,
        };
      });

      const activeSessionItems = activeSessions
        .filter((session: RawAttendanceSession) => {
          const isToday = new Date(session.startTime).toDateString() === new Date().toDateString();
          return session.isActive || session.status === "ACTIVE" || isToday;
        })
        .map((session: RawAttendanceSession) => {
          const startTime = new Date(session.startTime);
          const endTime = new Date(session.endTime);
          const toTimeStr = (date: Date) => {
            const h = date.getHours().toString().padStart(2, "0");
            const m = date.getMinutes().toString().padStart(2, "0");
            return `${h}:${m}`;
          };
          const startStr = toTimeStr(startTime);
          const endStr = toTimeStr(endTime);
          let status: "upcoming" | "ongoing" | "completed" = "upcoming";
          const now = new Date();
          const isSessionActive = session.isActive || session.status === "ACTIVE";
          if (isSessionActive && now <= endTime) {
            status = "ongoing";
          } else if (now > endTime) {
            status = "completed";
          } else {
            status = getClassStatus(startStr, endStr);
          }
          return {
            id: String(session.id || session.sessionId),
            course: `${session.courseName}`,
            time: `${startTime.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })} - ${endTime.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`,
            room: session.location?.name || "Online",
            status: status,
            startTime: startStr,
            endTime: endStr,
            courseCode: "",
            professor: "",
            isActive: isSessionActive,
            _originalCourseName: session.courseName,
          };
        });

      const mergedSchedule = [...activeSessionItems];
      staticSchedule.forEach((staticItem) => {
        const hasActiveSession = activeSessionItems.some(
          (active) => active.course.includes(staticItem._originalCourseName) || (active.courseCode && active.courseCode === staticItem.courseCode),
        );
        if (!hasActiveSession) mergedSchedule.push(staticItem);
      });

      mergedSchedule.sort((a, b) => {
        if (a.status === "ongoing" && b.status !== "ongoing") return -1;
        if (a.status !== "ongoing" && b.status === "ongoing") return 1;
        return a.startTime.localeCompare(b.startTime);
      });

      return mergedSchedule;
    },
    initialData: useMemo(() => {
      const staticFormatted = initialScheduleRaw.map((item: any) => {
        const normalizeTime = (t: string) => {
          if (!t) return "00:00";
          const parts = t.split(":");
          return `${parts[0].padStart(2, "0")}:${parts[1].padStart(2, "0")}`;
        };
        const startStr = normalizeTime(item.startTime);
        const endStr = normalizeTime(item.endTime);

        // Unified robust mapping
        const courseName = item.courseName || item.course?.courseName || "Course";
        const courseCode = item.courseCode || item.course?.courseCode || "N/A";
        const profName = item.professorName || 
                         (item.professor ? `${item.professor.firstName} ${item.professor.lastName}` : 
                         `${item.professorFirstName} ${item.professorLastName}`);

        return {
          id: String(item.id),
          course: `${courseName} (${courseCode})`,
          time: `${formatTime(item.startTime || "00:00")} - ${formatTime(item.endTime || "00:00")}`,
          room: item.room,
          status: getClassStatus(startStr, endStr),
          startTime: startStr,
          endTime: endStr,
          courseCode: courseCode,
          professor: profName,
          isActive: false,
          _originalCourseName: courseName,
        };
      });

      const sessionFormatted = initialSessionsRaw
        .filter((session: any) => {
          const isToday = new Date(session.startTime).toDateString() === new Date().toDateString();
          return session.isActive || session.status === "ACTIVE" || isToday;
        })
        .map((session: any) => {
          const startTime = new Date(session.startTime);
          const endTime = new Date(session.endTime);
          const toTimeStr = (date: Date) => {
            const h = date.getHours().toString().padStart(2, "0");
            const m = date.getMinutes().toString().padStart(2, "0");
            return `${h}:${m}`;
          };
          const startStr = toTimeStr(startTime);
          const endStr = toTimeStr(endTime);
          const isSessionActive = session.isActive || session.status === "ACTIVE";
          let status: "upcoming" | "ongoing" | "completed" = "upcoming";
          const now = new Date();
          if (isSessionActive && now <= endTime) status = "ongoing";
          else if (now > endTime) status = "completed";
          else status = getClassStatus(startStr, endStr);

          return {
            id: String(session.id || session.sessionId),
            course: `${session.course.courseName}`,
            time: `${startTime.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })} - ${endTime.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`,
            room: session.location?.name || "Online",
            status: status,
            startTime: startStr,
            endTime: endStr,
            courseCode: session.course.courseCode,
            professor: "",
            isActive: isSessionActive,
            _originalCourseName: session.course.courseName,
          };
        });

      const merged = [...sessionFormatted];
      staticFormatted.forEach((staticItem) => {
        const hasActiveSession = sessionFormatted.some(
          (active) => active.course.includes(staticItem._originalCourseName) || (active.courseCode && active.courseCode === staticItem.courseCode),
        );
        if (!hasActiveSession) merged.push(staticItem);
      });

      return merged.sort((a: any, b: any) => {
        if (a.status === "ongoing" && b.status !== "ongoing") return -1;
        if (a.status !== "ongoing" && b.status === "ongoing") return 1;
        return a.startTime.localeCompare(b.startTime);
      });
    }, [initialScheduleRaw, initialSessionsRaw]),
    enabled: !!user?.id && user.role === "student",
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 30 * 1000, // Refresh every 30 seconds
  });

  // 3. Announcements (Derived from notifications)
  const announcements = useMemo((): Announcement[] => {
    // Priority: notifications (rehydrated) -> initialNotifications (SSR)
    const currentNotifications = (notifications && notifications.length > 0) ? notifications : (initialNotifications || []);
    
    if (currentNotifications.length === 0) return [];

    const mapNotificationToAnnouncement = (n: any): Announcement => {
      let icon: Announcement["icon"] = "megaphone";
      let type: Announcement["type"] = "info";

      switch (n.category) {
        case "SYSTEM":
          icon = "building";
          type = "info";
          break;
        case "COURSE":
          icon = "book";
          type = "info";
          break;
        case "EXAM":
          icon = "calendar";
          type = "warning";
          break;
        case "ASSIGNMENT":
          icon = "lightbulb";
          type = "warning";
          break;
        case "ATTENDANCE":
          icon = "alert";
          type = "info";
          break;
        default:
          icon = "megaphone";
          type = "info";
      }

      // Ensure type matches Announcement["type"]
      const nType = String(n.type).toLowerCase();
      if (nType === "warning" || nType === "error") type = "warning";
      else if (nType === "success") type = "success";

      return {
        id: String(n.id),
        title: n.title,
        message: n.message,
        icon,
        type,
        timestamp: String(n.createdAt), // AnnouncementsList expects string timestamp
      };
    };

    return currentNotifications
      .filter(
        (n: any) =>
          n.category === "SYSTEM" ||
          n.category === "COURSE" ||
          n.category === "EXAM" ||
          n.category === "ASSIGNMENT" ||
          n.type === "INFO" ||
          n.type === "WARNING",
      )
      .slice(0, 5)
      .map(mapNotificationToAnnouncement);
  }, [notifications, initialNotifications]);

  // Handle manual refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["student-stats"] }),
      queryClient.invalidateQueries({ queryKey: ["student-schedule"] }),
      // Notifications are handled by context, but we can simulate a refresh delay
      new Promise((resolve) => setTimeout(resolve, 500)),
    ]);
    setIsRefreshing(false);
  };

  const handleHardRefresh = async () => {
    if (confirm("Update App? This will clear the cache and reload.")) {
      if ("serviceWorker" in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations)
          await registration.unregister();
      }
      if ("caches" in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((key) => caches.delete(key)));
      }
      window.location.reload();
    }
  };

  // Show welcome toast only once per session
  useEffect(() => {
    const hasSeenWelcome = sessionStorage.getItem("hasSeenWelcome");
    if (isAuthenticated && !hasSeenWelcome && !statsLoading && stats) {
      showInfo(`Welcome back, ${user?.firstName || "Student"}!`, {
        title: "Dashboard ready",
      });
      sessionStorage.setItem("hasSeenWelcome", "true");
    }
  }, [isAuthenticated, statsLoading, stats, showInfo, user?.firstName]);

  // --- Variants ---
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        ease: "easeOut",
      },
    },
  };

  return (
    <DashboardLayout userName={user?.firstName} userType="student">
      <LazyMotion features={domAnimation}>
        <div className="space-y-6 sm:space-y-8 pb-32 sm:pb-24">
        {/* Header Section - Always render for LCP (Largest Contentful Paint) */}
        <div
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 p-5 sm:p-0 bg-white/60 sm:bg-transparent dark:bg-gray-800/60 sm:dark:bg-transparent rounded-3xl sm:rounded-none border border-white/40 dark:border-gray-700/40 sm:border-transparent shadow-sm sm:shadow-none backdrop-blur-xl"
        >
          <div className="flex items-center gap-4 sm:gap-6 w-full sm:w-auto">
            <div
              className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-indigo-500 via-purple-500 to-fuchsia-500 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30 shrink-0"
            >
              <LayoutDashboard className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white sm:text-4xl">
                Welcome back,{" "}
                <span className="text-blue-600 dark:text-blue-400">
                  {user?.firstName || initialUser?.firstName || "Student"}
                </span>{" "}
                👋
              </h1>
            </div>
          </div>
          <div className="flex items-center justify-end gap-3 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-none border-gray-100 dark:border-gray-700/50">
            <div className="flex-1 sm:hidden flex items-center gap-2 px-3 py-2 bg-indigo-50/50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 rounded-xl text-xs font-bold uppercase tracking-wider">
              <Calendar className="w-3.5 h-3.5 opacity-70" />
              {stats?.currentSemester || "Current"}
            </div>
            <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 rounded-xl text-sm font-bold">
              <Calendar className="w-4 h-4" />
              {hasMounted && stats?.currentSemester ? stats.currentSemester : "Current Semester"}
            </div>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className={`p-2.5 rounded-xl bg-white/80 dark:bg-gray-800 border border-gray-200/50 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all hover:shadow-md active:scale-95 ${isRefreshing ? "animate-spin text-indigo-600" : ""}`}
              aria-label="Refresh Dashboard" title="Refresh Dashboard"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
            <button
              onClick={handleHardRefresh}
              className="p-2.5 rounded-xl bg-white/80 dark:bg-gray-800 border border-gray-200/50 dark:border-gray-700 text-amber-500 hover:text-amber-600 dark:text-amber-400 dark:hover:text-amber-300 transition-all hover:shadow-md active:scale-95 group"
              aria-label="Force Update / Fix Issues" title="Force Update / Fix Issues"
            >
              <Zap className="w-5 h-5 fill-current group-hover:animate-pulse" />
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        {statsLoading && !stats ? (
          <StatsSkeleton />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
            <StatCardStudent
              title="Predicted GPA"
              value={
                stats?.attendancePercentage
                  ? ((stats.attendancePercentage / 100) * 4).toFixed(2)
                  : "0.00"
              }
              icon={GraduationCap}
              color="bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400"
              subtitle="Based on Attendance"
            />
            <StatCardStudent
              title="Credits"
              value={stats?.totalCredits ?? 0}
              icon={BookOpen}
              color="bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400"
              subtitle="Earned"
            />
            <StatCardStudent
              title="Attendance"
              value={`${stats?.attendancePercentage ?? 0}%`}
              icon={Timer}
              color="bg-purple-500/10 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400"
              subtitle="Overall"
            />
            <StatCardStudent
              title="Assignments"
              value={stats?.pendingAssignments ?? 0}
              icon={FileText}
              color="bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400"
              subtitle="Pending"
            />
          </div>
        )}

        {/* Main Content Grid */}
        {statsLoading && !stats ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 h-96 bg-gray-200 dark:bg-gray-700 rounded-2xl animate-pulse" />
            <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded-2xl animate-pulse" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: Schedule */}
            <div className="lg:col-span-2 space-y-6">
              <SchedulePreview classes={todaySchedule} />

              {/* Quick Actions (Mobile Only) */}
              <div className="lg:hidden grid grid-cols-2 gap-3 mt-4">
                <button
                  onClick={() => router.push("/dashboard/student/ai-assistant")}
                  className="relative overflow-hidden p-4 sm:p-5 bg-gradient-to-br from-indigo-500 via-purple-500 to-fuchsia-500 rounded-3xl text-white shadow-lg shadow-indigo-500/25 flex flex-col items-center justify-center gap-2 group active:scale-95 transition-all w-full border border-white/10"
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-white/20 rounded-full blur-2xl -mr-10 -mt-10" />
                  <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm shadow-inner group-hover:scale-110 transition-transform">
                    <Sparkles className="w-6 h-6 sm:w-7 sm:h-7" />
                  </div>
                  <span className="font-bold text-sm sm:text-base tracking-wide whitespace-nowrap">Ask AI</span>
                </button>
                
                <button
                  onClick={() => router.push("/dashboard/student/schedule")}
                  className="relative overflow-hidden p-4 sm:p-5 bg-gradient-to-br from-blue-500 via-cyan-500 to-teal-400 rounded-3xl text-white shadow-lg shadow-blue-500/25 flex flex-col items-center justify-center gap-2 group active:scale-95 transition-all w-full border border-white/10"
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-white/20 rounded-full blur-2xl -mr-10 -mt-10" />
                  <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm shadow-inner group-hover:scale-110 transition-transform">
                    <Calendar className="w-6 h-6 sm:w-7 sm:h-7" />
                  </div>
                  <span className="font-bold text-sm sm:text-base tracking-wide whitespace-nowrap">Schedule</span>
                </button>
              </div>
            </div>

            {/* Right Column: Announcements */}
            <div className="space-y-6">
              <ChatbotCard href="/dashboard/student/ai-assistant" />
              <AnnouncementsList announcements={announcements} />
            </div>
          </div>
        )}
      </div>
      {/* AI Assistant Button */}
      <AIAssistantButton userType="student" />
          </LazyMotion>
    </DashboardLayout>
  );
}
