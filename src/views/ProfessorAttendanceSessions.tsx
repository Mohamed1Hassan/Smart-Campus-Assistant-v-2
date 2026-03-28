"use client";
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Plus,
  Play,
  Pause,
  Square,
  Eye,
  Edit,
  Trash2,
  QrCode,
  MapPin,
  Clock,
  Users,
  AlertTriangle,
  RefreshCw,
  Search,
  Filter,
  ArrowUpDown,
  X,
  MoreVertical,
  CheckSquare,
  Square as SquareIcon,
  Calendar,
  Copy,
  Grid,
  List,
  Smartphone,
  Camera,
  Shield,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import DashboardLayout from "../components/common/DashboardLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Progress } from "../components/ui/progress";
import { Alert, AlertDescription } from "../components/ui/alert";
import { Dialog, DialogContent } from "../components/ui/dialog";
import ConfirmModal from "../components/ConfirmModal";
import StatCard from "../components/common/StatCard";
import { QRCodeGenerator } from "../components/professor/QRCodeGenerator";
import { Switch } from "../components/ui/switch";
import ErrorBoundary from "../components/ErrorBoundary";
import { isDemo } from "@/utils/demoMode";
import { useAuth } from "../contexts/AuthContext";
import { useAttendanceSessions } from "../hooks/useAttendanceSessions";
import { useToast } from "../components/common/ToastProvider";
import { ProfessorAttendanceSessionDetails } from "./ProfessorAttendanceSessionDetails";

const DEV = process.env.NODE_ENV === "development";

interface AttendanceSession {
  id: string;
  courseId: number;
  courseName?: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  status: "DRAFT" | "SCHEDULED" | "ACTIVE" | "PAUSED" | "ENDED" | "CANCELLED";
  qrCode?: string;
  createdAt: Date;
  updatedAt: Date;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  location?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  security?: any;
  totalStudents?: number;
  presentStudents?: number;
  absentStudents?: number;
  lateStudents?: number;
  fraudAlerts?: number;
}

type StatusFilter =
  | "all"
  | "ACTIVE"
  | "SCHEDULED"
  | "PAUSED"
  | "ENDED"
  | "DRAFT"
  | "CANCELLED";
type SortOption =
  | "created-desc"
  | "created-asc"
  | "scheduled-desc"
  | "scheduled-asc"
  | "course-asc"
  | "course-desc"
  | "title-asc"
  | "title-desc"
  | "attendance-desc"
  | "attendance-asc"
  | "students-desc"
  | "students-asc";

type DateFilter = "all" | "today" | "this-week" | "this-month" | "custom";

// Skeleton Loader Components
const SkeletonCard = () => (
  <Card className="animate-pulse">
    <CardHeader>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1">
          <div className="w-16 h-6 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="flex-1">
            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          </div>
        </div>
        <div className="flex gap-2">
          <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    </CardHeader>
    <CardContent>
      <div className="space-y-3">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>
    </CardContent>
  </Card>
);

const SkeletonStat = () => (
  <div className="bg-white dark:bg-cardDark rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm animate-pulse">
    <div className="flex items-center gap-3">
      <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
      <div className="flex-1">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 mb-2"></div>
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-12"></div>
      </div>
    </div>
  </div>
);

export default function ProfessorAttendanceSessions() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const { success, error: showError, info } = useToast();

  // Use the attendance sessions hook to get real data from API - MUST be called before any early returns
  const {
    sessions: apiSessions,
    loadSessions,
    isLoading,
    error: sessionsError,
    isStarting,
    isStopping,
    isPausing,
    isDeleting,
    deleteSession: deleteSessionAPI,
    startSession: startSessionAPI,
    stopSession: stopSessionAPI,
    pauseSession: pauseSessionAPI,
    generateQRCode: generateQRCodeAPI,
  } = useAttendanceSessions();

  // State management
  const [selectedSession, setSelectedSession] =
    useState<AttendanceSession | null>(null);
  const [showQRCode, setShowQRCode] = useState(false);

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);

  // Filter and search state
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilters, setStatusFilters] = useState<Set<StatusFilter>>(
    new Set(["all"]),
  );
  const [courseFilter, setCourseFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [customDateRange, setCustomDateRange] = useState<{
    start: string;
    end: string;
  }>({ start: "", end: "" });

  // Sort state
  const [sortOption, setSortOption] = useState<SortOption>("created-desc");

  // Selection and bulk actions
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Action menus
  const [openActionMenu, setOpenActionMenu] = useState<string | null>(null);
  // actionMenuRef removed

  // Delete confirmation modals
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);

  // View mode (grid/list)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Get unique courses for filter
  const uniqueCourses = useMemo(() => {
    const courses = new Set(
      apiSessions.map((s) => s.courseName).filter(Boolean),
    );
    return Array.from(courses).sort();
  }, [apiSessions]);

  // Load sessions on mount - HANDLED BY REACT QUERY IN HOOK
  // No need for manual useEffect here

  // Filter and sort sessions
  const filteredAndSortedSessions = useMemo(() => {
    let filtered = [...apiSessions];

    // Apply search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (session) =>
          session.title.toLowerCase().includes(term) ||
          session.courseName?.toLowerCase().includes(term) ||
          (session.location?.name &&
            session.location.name.toLowerCase().includes(term)) ||
          (session.description &&
            session.description.toLowerCase().includes(term)),
      );
    }

    // Apply status filters
    if (!statusFilters.has("all")) {
      filtered = filtered.filter((session) =>
        statusFilters.has(session.status),
      );
    }

    // Apply course filter
    if (courseFilter !== "all") {
      filtered = filtered.filter(
        (session) => session.courseName === courseFilter,
      );
    }

    // Apply date filter
    if (dateFilter !== "all") {
      const now = new Date();
      filtered = filtered.filter((session) => {
        const sessionDate = new Date(session.startTime);
        switch (dateFilter) {
          case "today":
            return sessionDate.toDateString() === now.toDateString();
          case "this-week":
            const weekStart = new Date(now);
            weekStart.setDate(now.getDate() - now.getDay());
            weekStart.setHours(0, 0, 0, 0);
            return sessionDate >= weekStart;
          case "this-month":
            return (
              sessionDate.getMonth() === now.getMonth() &&
              sessionDate.getFullYear() === now.getFullYear()
            );
          case "custom":
            if (customDateRange.start) {
              const start = new Date(customDateRange.start);
              if (sessionDate < start) return false;
            }
            if (customDateRange.end) {
              const end = new Date(customDateRange.end);
              end.setHours(23, 59, 59, 999);
              if (sessionDate > end) return false;
            }
            return true;
          default:
            return true;
        }
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const getDate = (d: any) => (d instanceof Date ? d : new Date(d));

      switch (sortOption) {
        case "created-desc":
          return (
            getDate(b.createdAt).getTime() - getDate(a.createdAt).getTime()
          );
        case "created-asc":
          return (
            getDate(a.createdAt).getTime() - getDate(b.createdAt).getTime()
          );
        case "scheduled-desc":
          return (
            getDate(b.startTime).getTime() - getDate(a.startTime).getTime()
          );
        case "scheduled-asc":
          return (
            getDate(a.startTime).getTime() - getDate(b.startTime).getTime()
          );
        case "course-asc":
          return (a.courseName || "").localeCompare(b.courseName || "");
        case "course-desc":
          return (b.courseName || "").localeCompare(a.courseName || "");
        case "title-asc":
          return a.title.localeCompare(b.title);
        case "title-desc":
          return b.title.localeCompare(a.title);
        case "attendance-desc":
          const aRate =
            (a.totalStudents || 0) > 0
              ? ((a.presentStudents || 0) / (a.totalStudents || 1)) * 100
              : 0;
          const bRate =
            (b.totalStudents || 0) > 0
              ? ((b.presentStudents || 0) / (b.totalStudents || 1)) * 100
              : 0;
          return bRate - aRate;
        case "attendance-asc":
          const aRate2 =
            (a.totalStudents || 0) > 0
              ? ((a.presentStudents || 0) / (a.totalStudents || 1)) * 100
              : 0;
          const bRate2 =
            (b.totalStudents || 0) > 0
              ? ((b.presentStudents || 0) / (b.totalStudents || 1)) * 100
              : 0;
          return aRate2 - bRate2;
        case "students-desc":
          return (b.totalStudents || 0) - (a.totalStudents || 0);
        case "students-asc":
          return (a.totalStudents || 0) - (b.totalStudents || 0);
        default:
          return 0;
      }
    });

    return filtered;
  }, [
    apiSessions,
    searchTerm,
    statusFilters,
    courseFilter,
    dateFilter,
    customDateRange,
    sortOption,
  ]);

  // Calculate statistics
  const sessionStats = useMemo(() => {
    return {
      total: apiSessions.length,
      active: apiSessions.filter((s) => s.status === "ACTIVE").length,
      scheduled: apiSessions.filter((s) => s.status === "SCHEDULED").length,
      completed: apiSessions.filter((s) => s.status === "ENDED").length,
      paused: apiSessions.filter((s) => s.status === "PAUSED").length,
      draft: apiSessions.filter((s) => s.status === "DRAFT").length,
      cancelled: apiSessions.filter((s) => s.status === "CANCELLED").length,
    };
  }, [apiSessions]);

  // Format relative time
  const formatRelativeTime = useCallback((date: Date | null): string => {
    if (!date) return "Never";
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60)
      return `${diffMins} minute${diffMins !== 1 ? "s" : ""} ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24)
      return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;
  }, []);

  // Handlers
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadSessions();
    setIsRefreshing(false);
    setLastRefreshTime(new Date());
    success("Sessions refreshed");
  }, [loadSessions, success]);

  const handleToggleStatusFilter = useCallback((status: StatusFilter) => {
    setStatusFilters((prev) => {
      const next = new Set(prev);
      if (status === "all") {
        next.clear();
        next.add("all");
      } else {
        next.delete("all");
        if (next.has(status)) {
          next.delete(status);
        } else {
          next.add(status);
        }
        if (next.size === 0) {
          next.add("all");
        }
      }
      return next;
    });
  }, []);

  const handleClearFilters = useCallback(() => {
    setSearchTerm("");
    setStatusFilters(new Set(["all"]));
    setCourseFilter("all");
    setDateFilter("all");
    setCustomDateRange({ start: "", end: "" });
  }, []);

  const handleStartSession = async (sessionId: string) => {
    try {
      await startSessionAPI(sessionId);
      success("Session started successfully");
      await loadSessions();
    } catch (error) {
      showError("Failed to start session");
      if (DEV) {
        console.error("Error starting session:", error);
      }
    }
  };

  const handlePauseSession = async (sessionId: string) => {
    try {
      await pauseSessionAPI(sessionId);
      success("Session paused successfully");
      await loadSessions();
    } catch (error) {
      showError("Failed to pause session");
      if (DEV) {
        console.error("Error pausing session:", error);
      }
    }
  };

  const handleSquareSession = async (sessionId: string) => {
    try {
      await stopSessionAPI(sessionId);
      success("Session stopped successfully");
      await loadSessions();
    } catch (error) {
      showError("Failed to stop session");
      if (DEV) {
        console.error("Error stopping session:", error);
      }
    }
  };

  const handleDeleteSession = (sessionId: string) => {
    setSessionToDelete(sessionId);
    setShowDeleteModal(true);
  };

  const confirmDeleteSession = useCallback(async () => {
    if (!sessionToDelete) return;

    try {
      await deleteSessionAPI(sessionToDelete);
      success("Session deleted successfully");
      setShowDeleteModal(false);
      setSessionToDelete(null);
      await loadSessions();
    } catch (error) {
      showError("Failed to delete session");
      if (DEV) {
        console.error("Error deleting session:", error);
      }
    }
  }, [sessionToDelete, deleteSessionAPI, success, showError, loadSessions]);

  const handleBulkDelete = useCallback(() => {
    if (selectedIds.size === 0) return;
    setShowBulkDeleteModal(true);
  }, [selectedIds.size]);

  const confirmBulkDelete = useCallback(async () => {
    if (selectedIds.size === 0) return;

    try {
      const deletePromises = Array.from(selectedIds).map((id) =>
        deleteSessionAPI(id),
      );
      await Promise.all(deletePromises);
      success(
        `Successfully deleted ${selectedIds.size} session${selectedIds.size !== 1 ? "s" : ""}`,
      );
      setSelectedIds(new Set());
      setSelectionMode(false);
      setShowBulkDeleteModal(false);
      await loadSessions();
    } catch (error) {
      showError("Failed to delete some sessions");
      if (DEV) {
        console.error("Error bulk deleting sessions:", error);
      }
    }
  }, [selectedIds, deleteSessionAPI, success, showError, loadSessions]);

  const handleToggleSelection = useCallback((sessionId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(sessionId)) {
        next.delete(sessionId);
      } else {
        next.add(sessionId);
      }
      return next;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    if (selectedIds.size === filteredAndSortedSessions.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredAndSortedSessions.map((s) => s.id)));
    }
  }, [filteredAndSortedSessions, selectedIds.size]);

  const handleViewQRCode = async (session: AttendanceSession) => {
    setSelectedSession(session);
    // Generate QR code if not already available
    if (!session.qrCode && session.status === "ACTIVE") {
      try {
        const qrCode = await generateQRCodeAPI(session.id);
        if (qrCode) {
          // Session QR code will be updated via hook
          await loadSessions();
        }
      } catch (error) {
        if (DEV) {
          console.error("Error generating QR code:", error);
        }
      }
    }
    setShowQRCode(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-500 dark:bg-green-600";
      case "SCHEDULED":
        return "bg-blue-500 dark:bg-blue-600";
      case "PAUSED":
        return "bg-yellow-500 dark:bg-yellow-600";
      case "ENDED":
        return "bg-gray-500 dark:bg-gray-600";
      case "CANCELLED":
        return "bg-red-500 dark:bg-red-600";
      case "DRAFT":
        return "bg-gray-400 dark:bg-gray-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "Active";
      case "SCHEDULED":
        return "Scheduled";
      case "PAUSED":
        return "Paused";
      case "ENDED":
        return "Ended";
      case "CANCELLED":
        return "Cancelled";
      case "DRAFT":
        return "Draft";
      default:
        return "Unknown";
    }
  };

  const getAttendanceProgress = (present?: number, total?: number) => {
    const p = present || 0;
    const t = total || 0;
    return t > 0 ? (p / t) * 100 : 0;
  };

  const getTimeRemaining = (endTime: Date) => {
    const now = new Date();
    const end = new Date(endTime);
    const diff = end.getTime() - now.getTime();

    if (diff <= 0) return "Ended";

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return `${hours}h ${minutes}m remaining`;
    } else {
      return `${minutes}m remaining`;
    }
  };

  const isSessionEndingSoon = (endTime: Date) => {
    const now = new Date();
    const end = new Date(endTime);
    const diff = end.getTime() - now.getTime();
    return diff > 0 && diff < 15 * 60 * 1000; // Less than 15 minutes
  };

  // Auto-refresh every 30 seconds for active sessions
  useEffect(() => {
    if (!autoRefreshEnabled) return;

    const interval = setInterval(() => {
      // Only refresh if page is visible and has active sessions
      if (
        document.visibilityState === "visible" &&
        apiSessions.some((s) => s.status === "ACTIVE")
      ) {
        console.log(
          "[ProfessorAttendanceSessions] Auto-refreshing sessions...",
        );
        setIsRefreshing(true);
        loadSessions()
          .then(() => {
            console.log(
              "[ProfessorAttendanceSessions] Auto-refresh successful",
            );
          })
          .catch((err) => {
            console.error(
              "[ProfessorAttendanceSessions] Auto-refresh failed:",
              err,
            );
          })
          .finally(() => {
            setIsRefreshing(false);
            setLastRefreshTime(new Date());
          });
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [autoRefreshEnabled, apiSessions, loadSessions]);

  // Close action menu on outside click
  useEffect(() => {
    const handleDocumentClick = () => {
      setOpenActionMenu(null);
    };

    document.addEventListener("click", handleDocumentClick);
    return () => document.removeEventListener("click", handleDocumentClick);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey) {
        switch (e.key.toLowerCase()) {
          case "f":
            e.preventDefault();
            document.getElementById("search-input")?.focus();
            break;
          case "n":
            e.preventDefault();
            router.push("/dashboard/professor/attendance/create");
            break;
        }
      }

      if (e.key === "Delete" && selectionMode && selectedIds.size > 0) {
        e.preventDefault();
        handleBulkDelete();
      }

      if (e.key === "Escape") {
        if (selectionMode) {
          setSelectionMode(false);
          setSelectedIds(new Set());
        }
        if (openActionMenu) {
          setOpenActionMenu(null);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectionMode, selectedIds, openActionMenu, router, handleBulkDelete]);

  // Active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (searchTerm) count++;
    if (!statusFilters.has("all") && statusFilters.size > 0) count++;
    if (courseFilter !== "all") count++;
    if (dateFilter !== "all") count++;
    return count;
  }, [searchTerm, statusFilters, courseFilter, dateFilter]);

  // Demo mode check - after all hooks
  if (isDemo) {
    const demoSessions = [
      {
        id: "1",
        title: "Data Structures Lecture",
        courseName: "CS101",
        status: "ACTIVE",
        endTime: new Date(),
      },
      {
        id: "2",
        title: "Machine Learning Lab",
        courseName: "CS201",
        status: "SCHEDULED",
        endTime: new Date(),
      },
    ];

    return (
      <ErrorBoundary>
        <DashboardLayout
          userName={user ? `${user.firstName} ${user.lastName}` : "Professor"}
          userType="professor"
        >
          <div className="max-w-7xl mx-auto">
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 text-yellow-800 dark:text-yellow-200 rounded-lg p-4 mb-6">
              Demo mode is ON. Session actions are disabled.
            </div>
            <div className="space-y-3">
              {demoSessions.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between bg-white dark:bg-cardDark border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                >
                  <div className="text-gray-900 dark:text-white font-medium">
                    {s.title} �?{s.courseName}
                  </div>
                  <span
                    className={`px-2 py-1 rounded-full border ${s.status === "ACTIVE" ? "text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-700" : "text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700"}`}
                  >
                    {s.status}
                  </span>
                  <div className="text-sm text-gray-600">
                    Ends: {new Date(s.endTime).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-6">
              <Button
                disabled
                className="px-4 py-2 rounded-lg bg-gray-200 text-gray-600 cursor-not-allowed"
              >
                Start (Disabled)
              </Button>
              <Button
                disabled
                className="px-4 py-2 rounded-lg bg-gray-200 text-gray-600 cursor-not-allowed"
              >
                Pause (Disabled)
              </Button>
              <Button
                disabled
                className="px-4 py-2 rounded-lg bg-gray-200 text-gray-600 cursor-not-allowed"
              >
                End (Disabled)
              </Button>
            </div>
          </div>
        </DashboardLayout>
      </ErrorBoundary>
    );
  }

  // If session ID is present, show details view
  if (id) {
    return <ProfessorAttendanceSessionDetails />;
  }

  return (
    <ErrorBoundary>
      <DashboardLayout
        userName={user ? `${user.firstName} ${user.lastName}` : "Professor"}
        userType="professor"
      >
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <div className="flex flex-col gap-4 mb-6">
              <Button
                variant="outline"
                onClick={() => router.push("/dashboard/professor/attendance")}
                className="self-start flex items-center gap-2"
                aria-label="Go back to attendance page"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
              <div className="flex-1">
                <h1
                  className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-textDark"
                  id="page-title"
                >
                  Attendance Sessions
                </h1>
                <p className="text-sm md:text-base text-gray-600 dark:text-mutedDark">
                  Manage your attendance sessions and monitor student
                  participation
                </p>
              </div>
            </div>

            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
                <Button
                  onClick={() =>
                    router.push("/dashboard/professor/attendance/create")
                  }
                  className="flex items-center justify-center gap-2 w-full sm:w-auto"
                  aria-label="Create new attendance session"
                >
                  <Plus className="w-4 h-4" />
                  Create New Session
                </Button>
                <div className="flex gap-3 w-full sm:w-auto">
                  <Button
                    variant="outline"
                    onClick={handleRefresh}
                    disabled={isRefreshing || isLoading}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2"
                    aria-label="Refresh sessions"
                  >
                    <RefreshCw
                      className={`w-4 h-4 ${isRefreshing || isLoading ? "animate-spin" : ""}`}
                    />
                    {isRefreshing || isLoading ? "Refreshing..." : "Refresh"}
                  </Button>
                  <div className="flex items-center gap-2 border border-gray-300 dark:border-gray-600 rounded-lg p-1">
                    <Button
                      variant={viewMode === "grid" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setViewMode("grid")}
                      aria-label="Grid view"
                    >
                      <Grid className="w-4 h-4" />
                    </Button>
                    <Button
                      variant={viewMode === "list" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setViewMode("list")}
                      aria-label="List view"
                    >
                      <List className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {lastRefreshTime && (
                  <span className="text-sm text-gray-600 dark:text-mutedDark hidden sm:inline">
                    Updated {formatRelativeTime(lastRefreshTime)}
                  </span>
                )}
                <div className="flex items-center gap-2">
                  <Switch
                    checked={autoRefreshEnabled}
                    onCheckedChange={setAutoRefreshEnabled}
                    id="auto-refresh"
                  />
                  <label
                    htmlFor="auto-refresh"
                    className="text-sm text-gray-600 dark:text-gray-400"
                  >
                    Auto-refresh
                  </label>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Error State */}
          {sessionsError && (
            <Alert
              className="mb-6 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700"
              role="alert"
            >
              <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
              <AlertDescription className="text-red-800 dark:text-red-200">
                <div className="flex items-center justify-between">
                  <span>{sessionsError}</span>
                  <Button size="sm" variant="outline" onClick={handleRefresh}>
                    Retry
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Stats Cards */}
          <section
            role="region"
            aria-labelledby="stats-heading"
            className="mb-8"
          >
            <h2 id="stats-heading" className="sr-only">
              Session Statistics
            </h2>
            {isLoading && apiSessions.length === 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                {[...Array(4)].map((_, i) => (
                  <SkeletonStat key={i} />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                <StatCard
                  title="Total Sessions"
                  value={sessionStats.total}
                  icon={Users}
                  color="bg-gradient-to-br from-blue-500 to-blue-600"
                  delay={0.1}
                  onClick={() => {
                    setStatusFilters(new Set(["all"]));
                    document
                      .getElementById("sessions-list")
                      ?.scrollIntoView({ behavior: "smooth" });
                  }}
                  tooltip="Click to view all sessions"
                />
                <StatCard
                  title="Active Sessions"
                  value={sessionStats.active}
                  icon={Play}
                  color="bg-gradient-to-br from-green-500 to-green-600"
                  delay={0.2}
                  onClick={() => {
                    setStatusFilters(new Set(["ACTIVE"]));
                    document
                      .getElementById("sessions-list")
                      ?.scrollIntoView({ behavior: "smooth" });
                  }}
                  tooltip="Click to filter active sessions"
                />
                <StatCard
                  title="Scheduled"
                  value={sessionStats.scheduled}
                  icon={Clock}
                  color="bg-gradient-to-br from-blue-500 to-blue-600"
                  delay={0.3}
                  onClick={() => {
                    setStatusFilters(new Set(["SCHEDULED"]));
                    document
                      .getElementById("sessions-list")
                      ?.scrollIntoView({ behavior: "smooth" });
                  }}
                  tooltip="Click to filter scheduled sessions"
                />
                <StatCard
                  title="Completed"
                  value={sessionStats.completed}
                  icon={Users}
                  color="bg-gradient-to-br from-gray-500 to-gray-600"
                  delay={0.4}
                  onClick={() => {
                    setStatusFilters(new Set(["ENDED"]));
                    document
                      .getElementById("sessions-list")
                      ?.scrollIntoView({ behavior: "smooth" });
                  }}
                  tooltip="Click to filter completed sessions"
                />
              </div>
            )}
          </section>

          {/* Search, Filter, and Sort Toolbar */}
          <section
            role="region"
            aria-labelledby="filter-heading"
            className="mb-6"
          >
            <h2 id="filter-heading" className="sr-only">
              Search and Filter Options
            </h2>
            <div className="bg-white dark:bg-cardDark rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
              {/* Main Filter Row */}
              <div className="p-4 space-y-4">
                {/* First Row: Search and Quick Actions */}
                <div className="flex flex-col sm:flex-row gap-3">
                  {/* Search */}
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-600" />
                    <input
                      id="search-input"
                      type="text"
                      placeholder="Search sessions by title, course, location..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-10 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-cardDark text-gray-900 dark:text-textDark placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      aria-label="Search sessions"
                    />
                    {searchTerm && (
                      <button
                        onClick={() => setSearchTerm("")}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                        aria-label="Clear search"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Selection Mode Toggle */}
                  <button
                    onClick={() => {
                      setSelectionMode(!selectionMode);
                      if (selectionMode) {
                        setSelectedIds(new Set());
                      }
                    }}
                    className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                      selectionMode
                        ? "bg-blue-600 text-white dark:bg-blue-500 shadow-sm"
                        : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600"
                    }`}
                    aria-pressed={selectionMode}
                  >
                    {selectionMode ? (
                      <>
                        <CheckSquare className="w-4 h-4" />
                        Selection Mode
                      </>
                    ) : (
                      <>
                        <SquareIcon className="w-4 h-4" />
                        Select Multiple
                      </>
                    )}
                  </button>
                </div>

                {/* Second Row: Filters */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* Status Filters */}
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                      <Filter className="w-3.5 h-3.5" />
                      Status
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {(
                        ["all", "ACTIVE", "PAUSED", "ENDED"] as StatusFilter[]
                      ).map((status) => (
                        <button
                          key={status}
                          onClick={() => handleToggleStatusFilter(status)}
                          className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${
                            statusFilters.has(status)
                              ? "bg-blue-600 text-white dark:bg-blue-500 shadow-sm"
                              : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600"
                          }`}
                          aria-pressed={statusFilters.has(status)}
                        >
                          {status === "all"
                            ? "All"
                            : status.charAt(0) + status.slice(1).toLowerCase()}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Course Filter */}
                  <div className="space-y-2">
                    <label
                      htmlFor="course-filter-select"
                      className="text-xs font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1.5"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      Course
                    </label>
                    <select
                      id="course-filter-select"
                      value={courseFilter}
                      onChange={(e) => setCourseFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-cardDark text-gray-900 dark:text-textDark text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-medium"
                      aria-label="Filter by course"
                    >
                      <option value="all">All Courses</option>
                      {uniqueCourses.map((course) => (
                        <option key={course} value={course}>
                          {course}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Sort */}
                  <div className="space-y-2">
                    <label
                      htmlFor="sort-option-select"
                      className="text-xs font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1.5"
                    >
                      <ArrowUpDown className="w-3.5 h-3.5" />
                      Sort By
                    </label>
                    <select
                      id="sort-option-select"
                      value={sortOption}
                      onChange={(e) =>
                        setSortOption(e.target.value as SortOption)
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-cardDark text-gray-900 dark:text-textDark text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-medium"
                      aria-label="Sort sessions"
                    >
                      <option value="created-desc">Created (Newest)</option>
                      <option value="created-asc">Created (Oldest)</option>
                      <option value="scheduled-desc">
                        Scheduled (Soonest)
                      </option>
                      <option value="scheduled-asc">Scheduled (Latest)</option>
                      <option value="course-asc">Course (A-Z)</option>
                      <option value="course-desc">Course (Z-A)</option>
                      <option value="title-asc">Title (A-Z)</option>
                      <option value="title-desc">Title (Z-A)</option>
                      <option value="attendance-desc">
                        Attendance (High to Low)
                      </option>
                      <option value="attendance-asc">
                        Attendance (Low to High)
                      </option>
                      <option value="students-desc">
                        Students (High to Low)
                      </option>
                      <option value="students-asc">
                        Students (Low to High)
                      </option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Active Filters Display */}
              {activeFilterCount > 0 && (
                <div className="px-4 pb-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2 flex-wrap pt-4">
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400 flex items-center gap-1.5">
                      <Filter className="w-3.5 h-3.5" />
                      Active filters ({activeFilterCount}):
                    </span>
                    {searchTerm && (
                      <Badge
                        variant="secondary"
                        className="flex items-center gap-1.5 px-2 py-1 text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700"
                      >
                        <Search className="w-3 h-3" />
                        &quot;{searchTerm}&quot;
                        <button
                          onClick={() => setSearchTerm("")}
                          className="ml-0.5 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                          aria-label="Remove search filter"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    )}
                    {!statusFilters.has("all") && statusFilters.size > 0 && (
                      <Badge
                        variant="secondary"
                        className="flex items-center gap-1.5 px-2 py-1 text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700"
                      >
                        <Filter className="w-3 h-3" />
                        {Array.from(statusFilters)
                          .map((s) => s.charAt(0) + s.slice(1).toLowerCase())
                          .join(", ")}
                        <button
                          onClick={() => setStatusFilters(new Set(["all"]))}
                          className="ml-0.5 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                          aria-label="Remove status filter"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    )}
                    {courseFilter !== "all" && (
                      <Badge
                        variant="secondary"
                        className="flex items-center gap-1.5 px-2 py-1 text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700"
                      >
                        <Calendar className="w-3 h-3" />
                        {courseFilter}
                        <button
                          onClick={() => setCourseFilter("all")}
                          className="ml-0.5 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                          aria-label="Remove course filter"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    )}
                    {dateFilter !== "all" && (
                      <Badge
                        variant="secondary"
                        className="flex items-center gap-1.5 px-2 py-1 text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700"
                      >
                        <Calendar className="w-3 h-3" />
                        {dateFilter}
                        <button
                          onClick={() => setDateFilter("all")}
                          className="ml-0.5 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                          aria-label="Remove date filter"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleClearFilters}
                      className="text-xs h-6 px-2 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400"
                    >
                      <X className="w-3 h-3 mr-1" />
                      Clear All
                    </Button>
                  </div>
                </div>
              )}

              {/* Date Range Filter (when custom selected) */}
              {dateFilter === "custom" && (
                <div className="px-4 pb-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="pt-4 space-y-2">
                    <label className="text-xs font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      Custom Date Range
                    </label>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                      <div className="flex-1">
                        <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                          Start Date
                        </label>
                        <input
                          type="date"
                          value={customDateRange.start}
                          onChange={(e) =>
                            setCustomDateRange((prev) => ({
                              ...prev,
                              start: e.target.value,
                            }))
                          }
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-cardDark text-gray-900 dark:text-textDark text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                          aria-label="Start date"
                        />
                      </div>
                      <div className="flex items-center justify-center pt-6 sm:pt-0">
                        <span className="text-gray-400 dark:text-gray-600 text-sm">
                          to
                        </span>
                      </div>
                      <div className="flex-1">
                        <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                          End Date
                        </label>
                        <input
                          type="date"
                          value={customDateRange.end}
                          onChange={(e) =>
                            setCustomDateRange((prev) => ({
                              ...prev,
                              end: e.target.value,
                            }))
                          }
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-cardDark text-gray-900 dark:text-textDark text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                          aria-label="End date"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Bulk Actions Bar */}
          {selectionMode && selectedIds.size > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4 flex items-center justify-between"
            >
              <span className="text-sm font-medium text-blue-800 dark:text-blue-300">
                {selectedIds.size} session{selectedIds.size !== 1 ? "s" : ""}{" "}
                selected
              </span>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={handleSelectAll}>
                  {selectedIds.size === filteredAndSortedSessions.length
                    ? "Deselect All"
                    : "Select All"}
                </Button>
                <Button
                  size="sm"
                  onClick={handleBulkDelete}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Delete Selected
                </Button>
              </div>
            </motion.div>
          )}

          {/* Sessions List */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="space-y-6"
            id="sessions-list"
            role="region"
            aria-labelledby="sessions-heading"
          >
            <h2 id="sessions-heading" className="sr-only">
              Attendance Sessions List
            </h2>

            {/* Loading State */}
            {isLoading && apiSessions.length === 0 && (
              <div className="space-y-6">
                {[...Array(3)].map((_, i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            )}

            {/* Empty State */}
            {!isLoading &&
              !sessionsError &&
              filteredAndSortedSessions.length === 0 && (
                <div className="text-center py-16 bg-white dark:bg-cardDark rounded-xl border border-gray-200 dark:border-gray-700">
                  <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
                    {searchTerm || activeFilterCount > 0 ? (
                      <Search className="w-12 h-12 text-gray-400 dark:text-gray-600" />
                    ) : (
                      <Users className="w-12 h-12 text-gray-400 dark:text-gray-600" />
                    )}
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-textDark mb-2">
                    {searchTerm || activeFilterCount > 0
                      ? "No sessions match your filters"
                      : "No sessions found"}
                  </h3>
                  <p className="text-gray-600 dark:text-mutedDark mb-6">
                    {searchTerm || activeFilterCount > 0
                      ? "Try adjusting your search or filters to see more results."
                      : "Create your first attendance session to get started."}
                  </p>
                  <div className="flex items-center justify-center gap-3">
                    {(searchTerm || activeFilterCount > 0) && (
                      <Button onClick={handleClearFilters} variant="outline">
                        Clear Filters
                      </Button>
                    )}
                    {!searchTerm && activeFilterCount === 0 && (
                      <Button
                        onClick={() =>
                          router.push("/professor-attendance/create")
                        }
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Create New Session
                      </Button>
                    )}
                  </div>
                </div>
              )}

            {/* Sessions Grid/List */}
            {!isLoading && filteredAndSortedSessions.length > 0 && (
              <div
                className={
                  viewMode === "grid"
                    ? "grid grid-cols-1 lg:grid-cols-2 gap-6"
                    : "space-y-6"
                }
              >
                {filteredAndSortedSessions.map((session) => {
                  const isSelected = selectedIds.has(session.id);
                  const attendanceRate = getAttendanceProgress(
                    session.presentStudents,
                    session.totalStudents,
                  );
                  const endingSoon =
                    session.status === "ACTIVE" &&
                    isSessionEndingSoon(session.endTime);

                  return (
                    <Card
                      key={session.id}
                      className={`hover:shadow-lg transition-all duration-200 overflow-visible ${
                        selectionMode ? "cursor-pointer" : ""
                      } ${
                        isSelected
                          ? "ring-2 ring-blue-500 dark:ring-blue-400"
                          : ""
                      } ${
                        endingSoon
                          ? "border-yellow-400 dark:border-yellow-500"
                          : ""
                      } ${
                        openActionMenu === session.id
                          ? "relative z-20"
                          : "relative z-0"
                      }`}
                      onClick={
                        selectionMode
                          ? () => handleToggleSelection(session.id)
                          : undefined
                      }
                    >
                      <CardHeader>
                        <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                          <div className="flex items-start gap-3 flex-1 w-full">
                            {selectionMode && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleSelection(session.id);
                                }}
                                className={`mt-1 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 flex-shrink-0 ${
                                  isSelected
                                    ? "bg-blue-600 border-blue-600 text-white"
                                    : "bg-white dark:bg-cardDark border-gray-300 dark:border-gray-600"
                                }`}
                                aria-label={
                                  isSelected
                                    ? `Deselect ${session.title}`
                                    : `Select ${session.title}`
                                }
                              >
                                {isSelected && (
                                  <CheckSquare className="w-4 h-4" />
                                )}
                              </button>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2 mb-2">
                                <Badge
                                  className={`${getStatusColor(session.status)} text-white text-xs px-2 py-0.5`}
                                >
                                  {getStatusText(session.status)}
                                </Badge>
                                {session.status === "ACTIVE" && (
                                  <div
                                    className="w-2 h-2 bg-green-500 rounded-full animate-pulse"
                                    aria-label="Active session"
                                  />
                                )}
                                {endingSoon && (
                                  <Badge
                                    variant="outline"
                                    className="border-yellow-400 text-yellow-700 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20"
                                  >
                                    Ending Soon
                                  </Badge>
                                )}
                                {(session.fraudAlerts || 0) > 0 && (
                                  <Badge
                                    variant="outline"
                                    className="border-red-400 text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20"
                                  >
                                    <AlertTriangle className="w-3 h-3 mr-1" />
                                    {session.fraudAlerts} Alert
                                    {session.fraudAlerts !== 1 ? "s" : ""}
                                  </Badge>
                                )}
                              </div>
                              <CardTitle className="text-lg mb-1 truncate pr-2">
                                {session.title}
                              </CardTitle>
                              <CardDescription className="truncate">
                                {session.courseName}
                              </CardDescription>
                            </div>
                          </div>

                          {!selectionMode && (
                            <div className="relative">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenActionMenu(
                                    openActionMenu === session.id
                                      ? null
                                      : session.id,
                                  );
                                }}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                aria-label="Session actions"
                                aria-expanded={openActionMenu === session.id}
                              >
                                <MoreVertical className="w-5 h-5" />
                              </button>

                              <AnimatePresence>
                                {openActionMenu === session.id && (
                                  <motion.div
                                    initial={{
                                      opacity: 0,
                                      y: -10,
                                      scale: 0.95,
                                    }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                    className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-cardDark border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-50"
                                    role="menu"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        router.push(
                                          `/dashboard/professor/attendance/sessions/${session.id}`,
                                        );
                                        setOpenActionMenu(null);
                                      }}
                                      className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 transition-colors"
                                      role="menuitem"
                                    >
                                      <Eye className="w-4 h-4" />
                                      View Details
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        // Edit functionality
                                        setOpenActionMenu(null);
                                      }}
                                      className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 transition-colors"
                                      role="menuitem"
                                    >
                                      <Edit className="w-4 h-4" />
                                      Edit Session
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        // Duplicate functionality
                                        setOpenActionMenu(null);
                                      }}
                                      className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 transition-colors"
                                      role="menuitem"
                                    >
                                      <Copy className="w-4 h-4" />
                                      Duplicate Session
                                    </button>
                                    <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleViewQRCode(session);
                                        setOpenActionMenu(null);
                                      }}
                                      className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 transition-colors"
                                      role="menuitem"
                                    >
                                      <QrCode className="w-4 h-4" />
                                      View QR Code
                                    </button>
                                    <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteSession(session.id);
                                        setOpenActionMenu(null);
                                      }}
                                      className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 transition-colors"
                                      role="menuitem"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                      Delete Session
                                    </button>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          )}
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-4">
                        {/* Quick Stats */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm">
                              <MapPin className="h-4 w-4 text-muted-foreground" />
                              <span className="text-xs text-gray-600 dark:text-gray-400 truncate">
                                {session.location?.name || "N/A"}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <span className="text-xs text-gray-600 dark:text-gray-400">
                                {session.status === "ACTIVE"
                                  ? getTimeRemaining(session.endTime)
                                  : new Date(
                                      session.startTime,
                                    ).toLocaleDateString()}
                              </span>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">
                                Attendance
                              </span>
                              <span className="text-sm text-muted-foreground">
                                {attendanceRate.toFixed(1)}%
                              </span>
                            </div>
                            <Progress value={attendanceRate} className="h-2" />
                            <p className="text-xs text-gray-600 dark:text-mutedDark">
                              {session.presentStudents}/{session.totalStudents}{" "}
                              students
                            </p>
                          </div>

                          <div className="space-y-1 text-sm">
                            <div className="font-medium">
                              Security Features:
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {session.security?.isLocationRequired && (
                                <Badge variant="outline" className="text-xs">
                                  <MapPin className="w-3 h-3 mr-1" />
                                  Location
                                </Badge>
                              )}
                              {session.security?.isPhotoRequired && (
                                <Badge variant="outline" className="text-xs">
                                  <Camera className="w-3 h-3 mr-1" />
                                  Photo
                                </Badge>
                              )}
                              {session.security?.isDeviceCheckRequired && (
                                <Badge variant="outline" className="text-xs">
                                  <Smartphone className="w-3 h-3 mr-1" />
                                  Device
                                </Badge>
                              )}
                              {session.security?.fraudDetectionEnabled && (
                                <Badge variant="outline" className="text-xs">
                                  <Shield className="w-3 h-3 mr-1" />
                                  Fraud Det.
                                </Badge>
                              )}
                            </div>
                          </div>

                          <div className="space-y-1">
                            <div className="text-sm">
                              <strong>Present:</strong>{" "}
                              {session.presentStudents}
                            </div>
                            <div className="text-sm">
                              <strong>Absent:</strong>{" "}
                              {session.absentStudents || 0}
                            </div>
                            <div className="text-sm">
                              <strong>Late:</strong> {session.lateStudents || 0}
                            </div>
                          </div>
                        </div>

                        {/* Session Actions */}
                        {!selectionMode && (
                          <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                            <div className="text-xs text-muted-foreground">
                              Created:{" "}
                              {new Date(session.createdAt).toLocaleString()}
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                              {session.status === "DRAFT" ||
                              session.status === "SCHEDULED" ? (
                                <Button
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleStartSession(session.id);
                                  }}
                                  disabled={isStarting}
                                  aria-label="Start session"
                                >
                                  <Play className="h-4 w-4 mr-1" />
                                  Start
                                </Button>
                              ) : session.status === "ACTIVE" ? (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handlePauseSession(session.id);
                                    }}
                                    disabled={isPausing}
                                    aria-label="Pause session"
                                  >
                                    <Pause className="h-4 w-4 mr-1" />
                                    Pause
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleSquareSession(session.id);
                                    }}
                                    disabled={isStopping}
                                    aria-label="Stop session"
                                  >
                                    <Square className="h-4 w-4 mr-1" />
                                    End
                                  </Button>
                                </>
                              ) : session.status === "PAUSED" ? (
                                <Button
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleStartSession(session.id);
                                  }}
                                  disabled={isStarting}
                                  aria-label="Resume session"
                                >
                                  <Play className="h-4 w-4 mr-1" />
                                  Resume
                                </Button>
                              ) : null}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleViewQRCode(session);
                                }}
                                aria-label="View QR code"
                              >
                                <QrCode className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(
                                    `/dashboard/professor/attendance/sessions/${session.id}`,
                                  );
                                }}
                                aria-label="View session details"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

            {/* Results Count */}
            {!isLoading && filteredAndSortedSessions.length > 0 && (
              <div className="text-center text-sm text-gray-600 dark:text-mutedDark">
                Showing {filteredAndSortedSessions.length} of{" "}
                {apiSessions.length} session
                {apiSessions.length !== 1 ? "s" : ""}
              </div>
            )}
          </motion.div>

          {/* QR Code Modal */}
          <Dialog open={showQRCode} onOpenChange={setShowQRCode}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0 bg-transparent border-0 shadow-none sm:max-w-4xl">
              {selectedSession && (
                <QRCodeGenerator
                  session={selectedSession}
                  onRefresh={async () => {
                    if (selectedSession) {
                      await generateQRCodeAPI(selectedSession.id);
                      await loadSessions();
                    }
                  }}
                  onExport={(format) => {
                    info(`QR code exported as ${format}`);
                  }}
                  onShare={(method) => {
                    info(`Session shared via ${method}`);
                  }}
                />
              )}
            </DialogContent>
          </Dialog>

          {/* Delete Confirmation Modal */}
          <ConfirmModal
            isOpen={showDeleteModal}
            title="Delete Session"
            message={
              sessionToDelete
                ? `Are you sure you want to delete "${apiSessions.find((s) => s.id === sessionToDelete)?.title}"? This action cannot be undone.`
                : "Are you sure you want to delete this session?"
            }
            confirmText="Delete"
            cancelText="Cancel"
            onConfirm={confirmDeleteSession}
            onCancel={() => {
              setShowDeleteModal(false);
              setSessionToDelete(null);
            }}
            isLoading={isDeleting}
          />

          {/* Bulk Delete Confirmation Modal */}
          <ConfirmModal
            isOpen={showBulkDeleteModal}
            title="Delete Selected Sessions"
            message={`Are you sure you want to delete ${selectedIds.size} session${selectedIds.size !== 1 ? "s" : ""}? This action cannot be undone.`}
            confirmText="Delete All"
            cancelText="Cancel"
            onConfirm={confirmBulkDelete}
            onCancel={() => setShowBulkDeleteModal(false)}
            isLoading={isDeleting}
          />
        </div>
      </DashboardLayout>
    </ErrorBoundary>
  );
}
