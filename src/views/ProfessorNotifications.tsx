"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { Bell, CheckCheck, Trash2, RefreshCw, Search } from "lucide-react";
import DashboardLayout from "../components/common/DashboardLayout";
import { sendBulkNotificationAction } from "../actions/notification.actions";
import { getAllCoursesAction } from "../actions/course.actions";
import FilterBar, {
  FilterType,
} from "../components/professor/notifications/FilterBar";
import NotificationsList from "../components/professor/notifications/NotificationsList";
import EmptyState from "../components/professor/notifications/EmptyState";
import { NotificationItem } from "../components/professor/notifications/NotificationCard";
import { NotificationType, NotificationCategory } from "@/types/notification.types";
import { useToast } from "../components/common/ToastProvider";
import ErrorBoundary from "../components/ErrorBoundary";
import { apiClient } from "../services/api";
import { useAuth } from "../contexts/AuthContext";

const DEV = process.env.NODE_ENV === "development";

const NotificationSkeleton = () => (
  <div className="space-y-4 animate-pulse">
    {[1, 2, 3].map((i) => (
      <div
        key={i}
        className="h-32 bg-gray-100 dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700"
      />
    ))}
  </div>
);

// Mock notification data for professors
const mockNotifications: NotificationItem[] = [
  {
    id: "1",
    type: "submission",
    title: "New Assignment Submitted",
    description: "Ahmed Hassan submitted AI Project - Final FileText.",
    timestamp: "5 minutes ago",
    read: false,
    studentName: "Ahmed Hassan",
    courseName: "AI Project",
  },
  {
    id: "2",
    type: "message",
    title: "New Message Received",
    description:
      "Sara Mohamed asked a question about the Machine Learning assignment.",
    timestamp: "15 minutes ago",
    read: false,
    studentName: "Sara Mohamed",
    courseName: "Machine Learning",
  },
  {
    id: "3",
    type: "assignment",
    title: "Assignment Reminder",
    description: "Data Structures Project deadline is in 2 days.",
    timestamp: "1 hour ago",
    read: true,
    courseName: "Data Structures",
  },
  {
    id: "4",
    type: "schedule",
    title: "Class Schedule Update",
    description: "Operating Systems class moved from Room 205 to Room 301.",
    timestamp: "2 hours ago",
    read: false,
    courseName: "Operating Systems",
  },
  {
    id: "5",
    type: "system",
    title: "System Maintenance Alert",
    description: "LMS will be under maintenance tonight from 11 PM to 2 AM.",
    timestamp: "3 hours ago",
    read: true,
  },
  {
    id: "6",
    type: "submission",
    title: "Lab FileText Submitted",
    description: "Omar Ali submitted Database Systems Lab FileText #3.",
    timestamp: "4 hours ago",
    read: true,
    studentName: "Omar Ali",
    courseName: "Database Systems",
  },
  {
    id: "7",
    type: "message",
    title: "Question About Grading",
    description: "Fatima Ahmed has a question about her recent quiz grade.",
    timestamp: "6 hours ago",
    read: false,
    studentName: "Fatima Ahmed",
    courseName: "Software Engineering",
  },
  {
    id: "8",
    type: "assignment",
    title: "Assignment Deadline Extended",
    description: "Machine Learning Project deadline extended by 2 days.",
    timestamp: "1 day ago",
    read: true,
    courseName: "Machine Learning",
  },
  {
    id: "9",
    type: "submission",
    title: "Quiz Completed",
    description: "Youssef Ibrahim completed the Linear Algebra Quiz #3.",
    timestamp: "2 days ago",
    read: false,
    studentName: "Youssef Ibrahim",
    courseName: "Linear Algebra",
  },
  {
    id: "10",
    type: "message",
    title: "Office Hours Request",
    description:
      "Nour Hassan requested an office hours appointment for next week.",
    timestamp: "3 days ago",
    read: true,
    studentName: "Nour Hassan",
    courseName: "Data Structures",
  },
];

// Helper to parse timestamp
const parseTimestamp = (ts: string): Date => {
  // Try ISO format first
  const isoDate = new Date(ts);
  if (!isNaN(isoDate.getTime())) {
    return isoDate;
  }

  // Parse relative time like "5 minutes ago", "1 hour ago", "2 days ago"
  const now = new Date();
  const matches = ts.match(/(\d+)\s+(minute|hour|day|week|month)s?\s+ago/i);
  if (matches) {
    const amount = parseInt(matches[1]);
    const unit = matches[2].toLowerCase();
    const date = new Date(now);

    switch (unit) {
      case "minute":
        date.setMinutes(date.getMinutes() - amount);
        break;
      case "hour":
        date.setHours(date.getHours() - amount);
        break;
      case "day":
        date.setDate(date.getDate() - amount);
        break;
      case "week":
        date.setDate(date.getDate() - amount * 7);
        break;
      case "month":
        date.setMonth(date.getMonth() - amount);
        break;
    }
    return date;
  }

  return now;
};

const isToday = (date: Date): boolean => {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
};

const isYesterday = (date: Date): boolean => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return (
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear()
  );
};

const isThisWeek = (date: Date): boolean => {
  const now = new Date();
  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 7);
  return date > weekAgo && !isToday(date) && !isYesterday(date);
};

const formatRelativeTime = (date: Date): string => {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} minute${minutes !== 1 ? "s" : ""} ago`;
  if (hours < 24) return `${hours} hour${hours !== 1 ? "s" : ""} ago`;
  if (days < 7) return `${days} day${days !== 1 ? "s" : ""} ago`;
  return date.toLocaleDateString();
};

interface NotificationGroup {
  label: string;
  items: NotificationItem[];
}

export default function ProfessorNotifications() {
  const { user, isAuthenticated } = useAuth();
  const {
    success: showSuccess,
    error: showError,
    info: showInfo,
    warning: showWarning,
  } = useToast();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [archived, setArchived] = useState<Set<string>>(new Set());
  const [snoozed, setSnoozed] = useState<Map<string, number>>(new Map());
  const [pinned, setPinned] = useState<Set<string>>(new Set());
  const [lastSync, setLastSync] = useState<Date>(new Date());
  const [isAutoRefreshing, setIsAutoRefreshing] = useState(false);
  const [displayLimit, setDisplayLimit] = useState(50);
  const [showComposeModal, setShowComposeModal] = useState(false);
  const [courses, setCourses] = useState<
    { id: string | number; courseName: string; courseCode: string }[]
  >([]);
  const [selectedCourse, setSelectedCourse] = useState<string>("all");
  const [composeData, setComposeData] = useState<{
    title: string;
    message: string;
    type: NotificationType;
    category: NotificationCategory;
  }>({
    title: "",
    message: "",
    type: NotificationType.INFO,
    category: NotificationCategory.ANNOUNCEMENT,
  });
  const [isSending, setIsSending] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load state from localStorage
  useEffect(() => {
    try {
      const savedArchived = localStorage.getItem(
        "professor-notifications-archived",
      );
      if (savedArchived) {
        setArchived(new Set(JSON.parse(savedArchived)));
      }

      const savedPinned = localStorage.getItem(
        "professor-notifications-pinned",
      );
      if (savedPinned) {
        setPinned(new Set(JSON.parse(savedPinned)));
      }

      const savedSnoozed = localStorage.getItem(
        "professor-notifications-snoozed",
      );
      if (savedSnoozed) {
        const snoozedData = JSON.parse(savedSnoozed);
        const now = Date.now();
        const validSnoozed = new Map<string, number>();
        for (const [id, timestamp] of Object.entries(snoozedData)) {
          if (typeof timestamp === "number" && timestamp > now) {
            validSnoozed.set(id, timestamp);
          }
        }
        setSnoozed(validSnoozed);
      }
    } catch (error) {
      if (DEV) console.error("Error loading notification state:", error);
    }
  }, []);

  // Load notifications from API with fallback to localStorage/mock
  useEffect(() => {
    if (!isAuthenticated) return;
    
    const loadRawNotifications = async () => {
      setLoading(true);
      try {
        const res = await apiClient.get(
          "/api/notifications?userType=professor",
        );
        if (res.success) {
          // Standardize response: handle either { data: [...] } or { data: { notifications: [...] } }
          const notificationsData = Array.isArray(res.data)
            ? res.data
            : res.data &&
                typeof res.data === "object" &&
                "notifications" in res.data &&
                Array.isArray(
                  (res.data as { notifications: unknown[] }).notifications,
                )
              ? (res.data as { notifications: unknown[] }).notifications
              : null;

          if (notificationsData) {
            setNotifications(notificationsData as NotificationItem[]);
            setLastSync(new Date());
            return;
          }
        }
      } catch {
        if (DEV) console.warn("Failed to load from API, using fallback");
      } finally {
        setLoading(false);
      }

      const savedNotifications = localStorage.getItem(
        "professor-notifications",
      );
      if (savedNotifications) {
        try {
          setNotifications(JSON.parse(savedNotifications));
          setLastSync(new Date());
          return;
        } catch (error) {
          if (DEV) console.error("Error loading notifications:", error);
        }
      }
      setNotifications(mockNotifications);
      setLastSync(new Date());
    };
    loadRawNotifications();
  }, [isAuthenticated]);

  // Save archived/pinned to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(
        "professor-notifications-archived",
        JSON.stringify(Array.from(archived)),
      );
      localStorage.setItem(
        "professor-notifications-pinned",
        JSON.stringify(Array.from(pinned)),
      );
      const snoozedObj: Record<string, number> = {};
      snoozed.forEach((timestamp, id) => {
        snoozedObj[id] = timestamp;
      });
      localStorage.setItem(
        "professor-notifications-snoozed",
        JSON.stringify(snoozedObj),
      );
    } catch (error) {
      if (DEV) console.error("Error saving notification state:", error);
    }
  }, [archived, pinned, snoozed]);

  // Check and restore snoozed notifications
  useEffect(() => {
    const checkSnoozed = () => {
      const now = Date.now();
      const expired = Array.from(snoozed.entries()).filter(
        ([, timestamp]) => timestamp <= now,
      );
      if (expired.length > 0) {
        setSnoozed((prev) => {
          const next = new Map(prev);
          expired.forEach(([id]) => next.delete(id));
          return next;
        });
      }
    };

    const interval = setInterval(checkSnoozed, 60000); // Check every minute
    checkSnoozed(); // Initial check
    return () => clearInterval(interval);
  }, [snoozed]);

  // Fetch professor courses for composing
  useEffect(() => {
    if (showComposeModal) {
      const fetchCourses = async () => {
        const res = await getAllCoursesAction(true, true, true);
        if (res.success) setCourses(res.data);
      };
      fetchCourses();
    }
  }, [showComposeModal]);

  // Save notifications to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(
        "professor-notifications",
        JSON.stringify(notifications),
      );
    } catch (error) {
      if (DEV) console.error("Error saving notifications:", error);
    }
  }, [notifications]);

  // Toast functions - defined early to be available for handlers
  const showToast = useCallback(
    (
      type: "success" | "error" | "info" | "warning",
      title: string,
      message?: string,
    ) => {
      const fullMessage = message ? `${title}: ${message}` : title;
      switch (type) {
        case "success":
          showSuccess(fullMessage, { showProgress: true });
          break;
        case "error":
          showError(fullMessage, { showProgress: true });
          break;
        case "warning":
          showWarning(fullMessage, { showProgress: true });
          break;
        case "info":
          showInfo(fullMessage, { showProgress: true });
          break;
      }
    },
    [showSuccess, showError, showWarning, showInfo],
  );

  const handleToggleRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((notification) =>
        notification.id === id
          ? { ...notification, read: !notification.read }
          : notification,
      ),
    );
  }, []);

  const handleMarkAllAsRead = () => {
    setNotifications((prev) =>
      prev.map((notification) => ({ ...notification, read: true })),
    );
    showToast(
      "success",
      "All notifications marked as read",
      "You're all caught up!",
    );
  };

  const handleClearAll = () => {
    if (
      typeof window !== "undefined" &&
      window.confirm("Clear all notifications? This action cannot be undone.")
    ) {
      setNotifications([]);
      showToast(
        "success",
        "All notifications cleared",
        "Your notification list is now empty.",
      );
    }
  };

  const handleRefresh = useCallback(async () => {
    try {
      const res = await apiClient.get("/api/notifications?userType=professor");
      if (res.success) {
        let notificationsData: NotificationItem[] | null = null;
        
        if (Array.isArray(res.data)) {
          notificationsData = res.data;
        } else if (res.data && typeof res.data === "object" && "notifications" in res.data) {
          const data = res.data as { notifications: unknown };
          if (Array.isArray(data.notifications)) {
            notificationsData = data.notifications as NotificationItem[];
          }
        }

        if (notificationsData) {
          setNotifications(notificationsData);
          setLastSync(new Date());
          if (DEV) console.log("Notifications refreshed:", notificationsData.length);
        }
      }
    } catch (error) {
      if (DEV) console.warn("Failed to refresh notifications:", error);
    }
  }, []);

  const handleArchive = useCallback(
    (id: string) => {
      setArchived((prev) => new Set(prev).add(id));
      showToast(
        "success",
        "Notification archived",
        "You can view archived items later.",
      );
    },
    [showToast],
  );

  const handleSnooze = useCallback(
    (id: string, hours: number) => {
      const timestamp = Date.now() + hours * 60 * 60 * 1000;
      setSnoozed((prev) => new Map(prev).set(id, timestamp));
      showToast(
        "info",
        "Notification snoozed",
        `Will reappear in ${hours} hour${hours !== 1 ? "s" : ""}.`,
      );
    },
    [showToast],
  );

  const handlePin = useCallback(
    (id: string) => {
      setPinned((prev) => new Set(prev).add(id));
      showToast(
        "success",
        "Notification pinned",
        "Pinned notifications appear at the top.",
      );
    },
    [showToast],
  );

  const handleUnpin = useCallback((id: string) => {
    setPinned((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const handleSendNotification = async () => {
    if (!composeData.title || !composeData.message) {
      showError("Please fill in all fields");
      return;
    }

    setIsSending(true);
    try {
      let studentIds: number[] = [];

      if (selectedCourse === "all") {
        const allEnrollments = await Promise.all(
          courses.map((c) =>
            apiClient.get<{ studentId: number }[]>(
              `/api/courses/${c.id}/enrollments`,
            ),
          ),
        );
        studentIds = Array.from(
          new Set(
            allEnrollments.flatMap((res) =>
              res.success && res.data ? res.data.map((e) => e.studentId) : [],
            ),
          ),
        );
      } else {
        const res = await apiClient.get<{ studentId: number }[]>(
          `/api/courses/${selectedCourse}/enrollments`,
        );
        if (res.success && res.data) {
          studentIds = res.data.map((e) => e.studentId);
        }
      }

      if (studentIds.length === 0) {
        showError("No students found in selection");
        return;
      }

      const res = await sendBulkNotificationAction({
        studentIds,
        ...(composeData as {
          title: string;
          message: string;
          type: NotificationType;
          category: NotificationCategory;
        }),
      });

      if (res.success) {
        showSuccess(`Successfully sent notification to ${res.count} students`);
        setShowComposeModal(false);
        setComposeData({
          title: "",
          message: "",
          type: NotificationType.INFO,
          category: NotificationCategory.ANNOUNCEMENT,
        });
      } else {
        showError(res.error || "Failed to send notification");
      }
    } catch (err) {
      showError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsSending(false);
    }
  };

  const handleLoadMore = useCallback(() => {
    setDisplayLimit((prev) => prev + 50);
  }, []);

  // Get priority for a notification (professor-specific)
  const getPriority = useCallback(
    (n: NotificationItem): "urgent" | "normal" | "low" => {
      // Urgent: submissions (unread), messages (unread), system alerts
      if (n.type === "submission" && !n.read) return "urgent";
      if (n.type === "message" && !n.read) return "urgent";
      if (n.type === "system") return "urgent";
      // Low: read items or very old items
      if (n.read) {
        const date = parseTimestamp(n.timestamp);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        if (date < weekAgo) return "low";
      }
      return "normal";
    },
    [],
  );

  // Filter and sort notifications
  const processedNotifications = useMemo(() => {
    // Exclude archived and snoozed
    const visible = notifications.filter(
      (n) => !archived.has(n.id) && !snoozed.has(n.id),
    );

    // Apply type filter
    const filtered =
      activeFilter === "all"
        ? visible
        : visible.filter((n) => n.type === activeFilter);

    // Apply search (professor-specific: search by studentName instead of professorName)
    const searchable = filtered.filter(
      (n) =>
        !searchTerm ||
        n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        n.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        n.courseName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        n.studentName?.toLowerCase().includes(searchTerm.toLowerCase()),
    );

    // Sort: pinned first, then by timestamp
    const sorted = [...searchable].sort((a, b) => {
      const aPinned = pinned.has(a.id);
      const bPinned = pinned.has(b.id);
      if (aPinned && !bPinned) return -1;
      if (!aPinned && bPinned) return 1;

      const aDate = parseTimestamp(a.timestamp);
      const bDate = parseTimestamp(b.timestamp);
      return bDate.getTime() - aDate.getTime();
    });

    return sorted;
  }, [notifications, archived, snoozed, activeFilter, searchTerm, pinned]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(async () => {
      if (document.visibilityState === "visible") {
        setIsAutoRefreshing(true);
        try {
          await handleRefresh();
          setLastSync(new Date());
        } finally {
          setIsAutoRefreshing(false);
        }
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [isAuthenticated, handleRefresh]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if user is typing in input/textarea
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      switch (e.key.toLowerCase()) {
        case "k":
          // Navigate to previous notification (placeholder - would need focus management)
          e.preventDefault();
          break;
        case "j":
          // Navigate to next notification (placeholder - would need focus management)
          e.preventDefault();
          break;
        case "r":
          // Mark first unread as read
          e.preventDefault();
          const firstUnread = processedNotifications.find((n) => !n.read);
          if (firstUnread) {
            handleToggleRead(firstUnread.id);
          }
          break;
        case "a":
          // Archive first notification
          e.preventDefault();
          if (processedNotifications.length > 0) {
            handleArchive(processedNotifications[0].id);
          }
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [processedNotifications, handleArchive, handleToggleRead]);

  const unreadCount = notifications.filter(
    (n) => !n.read && !archived.has(n.id) && !snoozed.has(n.id),
  ).length;
  const displayedNotifications = displayLimit
    ? processedNotifications.slice(0, displayLimit)
    : processedNotifications;
  const hasMore = processedNotifications.length > displayLimit;

  // Group displayed notifications by time
  const groupedNotifications = useMemo((): NotificationGroup[] => {
    const groups: NotificationGroup[] = [];
    const today: NotificationItem[] = [];
    const yesterday: NotificationItem[] = [];
    const thisWeek: NotificationItem[] = [];
    const older: NotificationItem[] = [];

    displayedNotifications.forEach((n) => {
      const date = parseTimestamp(n.timestamp);
      if (isToday(date)) {
        today.push(n);
      } else if (isYesterday(date)) {
        yesterday.push(n);
      } else if (isThisWeek(date)) {
        thisWeek.push(n);
      } else {
        older.push(n);
      }
    });

    if (today.length > 0) groups.push({ label: "Today", items: today });
    if (yesterday.length > 0)
      groups.push({ label: "Yesterday", items: yesterday });
    if (thisWeek.length > 0)
      groups.push({ label: "This Week", items: thisWeek });
    if (older.length > 0) groups.push({ label: "Older", items: older });

    return groups;
  }, [displayedNotifications]);

  return (
    <ErrorBoundary>
      <DashboardLayout
        userName={user ? `${user.firstName} ${user.lastName}` : "Professor"}
        userType="professor"
      >
        <div className="max-w-4xl mx-auto relative">
          {/* Background Gradients */}
          <div className="fixed inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-600/5 rounded-full blur-3xl opacity-50" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-fuchsia-600/5 rounded-full blur-3xl opacity-50" />
          </div>

          {/* A11y: Screen reader announcements */}
          <div aria-live="polite" aria-atomic="true" className="sr-only">
            {unreadCount > 0
              ? `${unreadCount} unread notifications`
              : "All notifications read"}
          </div>

          {/* Page Header */}
          <section
            aria-labelledby="notifications-header"
            className="relative z-10"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-8"
            >
              <div className="flex items-center gap-6 mb-6">
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  className="w-16 h-16 bg-gradient-to-br from-violet-500 to-violet-600 rounded-2xl flex items-center justify-center shadow-lg"
                >
                  <Bell className="w-9 h-9 text-white" />
                </motion.div>
                <div className="flex-1">
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="inline-flex items-center gap-3 mb-2"
                  >
                    <h1
                      id="notifications-header"
                      className="text-4xl lg:text-5xl font-bold text-gray-900 dark:text-textDark"
                    >
                      Notifications
                    </h1>
                    {unreadCount > 0 && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.4, type: "spring" }}
                        className="px-2 py-0.5 rounded-full bg-violet-500 text-white text-xs font-semibold"
                        aria-label={`${unreadCount} unread notifications`}
                      >
                        {unreadCount}
                      </motion.span>
                    )}
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                    className="flex items-center gap-4"
                  >
                    <p className="text-gray-700 dark:text-gray-300 text-lg lg:text-xl font-medium">
                      Stay updated with your latest course and student
                      activities
                    </p>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {isAutoRefreshing ? (
                        <span className="flex items-center gap-1">
                          <RefreshCw className="w-3 h-3 animate-spin" />
                          Updating...
                        </span>
                      ) : (
                        <span>Last synced: {formatRelativeTime(lastSync)}</span>
                      )}
                    </div>
                  </motion.div>
                </div>
              </div>

              {/* Search Box */}
              <div className="mb-4">
                <div className="relative max-w-xs group">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-violet-500 transition-colors" />
                  <input
                    type="search"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search notifications..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all shadow-sm hover:shadow-md hover:bg-white/80 dark:hover:bg-gray-800/80"
                    aria-label="Search notifications"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm("")}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      aria-label="Clear search"
                    >
                      <span className="text-lg leading-none">×</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                {notifications.length > 0 && (
                  <>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleMarkAllAsRead}
                      disabled={unreadCount === 0}
                      className={`
                        flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200
                        ${
                          unreadCount > 0
                            ? "bg-blue-600 hover:bg-blue-700 text-white"
                            : "bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                        }
                      `}
                      aria-label="Mark all notifications as read"
                    >
                      <CheckCheck className="w-4 h-4" />
                      Mark All as Read
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleClearAll}
                      className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium bg-red-600 hover:bg-red-700 text-white transition-all duration-200"
                      aria-label="Clear all notifications"
                    >
                      <Trash2 className="w-4 h-4" />
                      Clear All
                    </motion.button>
                  </>
                )}

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowComposeModal(true)}
                  className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white shadow-lg shadow-violet-500/20 transition-all duration-200"
                  aria-label="Compose new notification"
                >
                  <Bell className="w-4 h-4" />
                  Compose
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={async () => {
                    setIsAutoRefreshing(true);
                    await handleRefresh();
                    setLastSync(new Date());
                    setIsAutoRefreshing(false);
                  }}
                  disabled={isAutoRefreshing}
                  className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium bg-gray-600 hover:bg-gray-700 text-white transition-all duration-200 disabled:opacity-50"
                  aria-label="Refresh notifications"
                >
                  <RefreshCw
                    className={`w-4 h-4 ${isAutoRefreshing ? "animate-spin" : ""}`}
                  />
                  Refresh
                </motion.button>
              </div>
            </motion.div>
          </section>

          {/* Filter Bar */}
          <FilterBar
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
            unreadCount={unreadCount}
          />

          {/* Notifications Content */}
          <section
            aria-live="polite"
            aria-label="Notifications list"
            className="min-h-[400px]"
          >
            {loading ? (
              <NotificationSkeleton />
            ) : notifications.length === 0 ? (
              <EmptyState onRefresh={handleRefresh} type="empty" />
            ) : processedNotifications.length === 0 ? (
              <EmptyState
                onRefresh={handleRefresh}
                type="no-matches"
                onClearFilters={() => {
                  setSearchTerm("");
                  setActiveFilter("all");
                }}
              />
            ) : (
              <NotificationsList
                notifications={displayedNotifications}
                activeFilter={activeFilter}
                onToggleRead={handleToggleRead}
                onArchive={handleArchive}
                onSnooze={handleSnooze}
                onPin={handlePin}
                onUnpin={handleUnpin}
                pinnedIds={pinned}
                getPriority={getPriority}
                grouped={groupedNotifications}
                displayLimit={displayLimit}
                onLoadMore={hasMore ? handleLoadMore : undefined}
              />
            )}
          </section>
        </div>

        {/* Keyboard shortcuts hint (optional) */}
        <div className="sr-only" aria-live="polite">
          Keyboard shortcuts: K/J to navigate, R to mark as read, A to archive
        </div>

        {/* Compose Modal */}
        {showComposeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-200 dark:border-gray-800"
            >
              <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/50">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Compose Notification
                </h3>
                <button
                  onClick={() => setShowComposeModal(false)}
                  className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"
                >
                  <Trash2 className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Target Audience
                  </label>
                  <select
                    value={selectedCourse}
                    onChange={(e) => setSelectedCourse(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-violet-500 outline-none"
                  >
                    <option value="all">All My Students</option>
                    {courses.map((course) => (
                      <option key={course.id} value={course.id}>
                        {course.courseName} ({course.courseCode})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    value={composeData.title}
                    onChange={(e) =>
                      setComposeData((prev) => ({
                        ...prev,
                        title: e.target.value,
                      }))
                    }
                    placeholder="Brief headline..."
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-violet-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Message
                  </label>
                  <textarea
                    value={composeData.message}
                    onChange={(e) =>
                      setComposeData((prev) => ({
                        ...prev,
                        message: e.target.value,
                      }))
                    }
                    placeholder="Enter notification details..."
                    rows={4}
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-violet-500 outline-none resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Priority
                    </label>
                    <select
                      value={composeData.type}
                       
                      onChange={(e) =>
                        setComposeData((prev) => ({
                          ...prev,
                          type: e.target.value as NotificationType,
                        }))
                      }
                      className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
                    >
                      <option value="INFO">Information</option>
                      <option value="WARNING">Warning</option>
                      <option value="URGENT">Urgent</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Category
                    </label>
                    <select
                      value={composeData.category}
                       
                      onChange={(e) =>
                        setComposeData((prev) => ({
                          ...prev,
                          category: e.target.value as NotificationCategory,
                        }))
                      }
                      className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
                    >
                      <option value="ANNOUNCEMENT">Announcement</option>
                      <option value="EXAM">Exam</option>
                      <option value="ASSIGNMENT">Assignment</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/30 flex justify-end gap-3">
                <button
                  onClick={() => setShowComposeModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendNotification}
                  disabled={isSending}
                  className="px-6 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-violet-500/20 transition-all disabled:opacity-50"
                >
                  {isSending ? "Sending..." : "Send Notification"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </DashboardLayout>
    </ErrorBoundary>
  );
}
