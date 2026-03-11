"use client";
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Bell, CheckCheck, Trash2, RefreshCw, Search } from "lucide-react";
import DashboardLayout from "../components/common/DashboardLayout";
import FilterBar, {
  FilterType,
} from "../components/student/notifications/FilterBar";
import NotificationsList from "../components/student/notifications/NotificationsList";
import EmptyState from "../components/student/notifications/EmptyState";
import { NotificationItem } from "../components/student/notifications/NotificationCard";
import { useToast } from "../components/common/ToastProvider";
import ErrorBoundary from "../components/ErrorBoundary";
import { apiClient } from "../services/api";
import { useAuth } from "../contexts/AuthContext";

const DEV = process.env.NODE_ENV === "development";

// Mock notification data for students
const mockNotifications: NotificationItem[] = [
  {
    id: "1",
    type: "grade",
    title: "Grade Posted",
    description:
      "Your AI Project - Final FileText has been graded. Check your grade in the course.",
    timestamp: "5 minutes ago",
    read: false,
    professorName: "Dr. Sarah Johnson",
    courseName: "AI Project",
  },
  {
    id: "2",
    type: "message",
    title: "Message from Professor",
    description:
      "Dr. Ahmed Hassan sent you a message about your Machine Learning assignment.",
    timestamp: "15 minutes ago",
    read: false,
    professorName: "Dr. Ahmed Hassan",
    courseName: "Machine Learning",
  },
  {
    id: "3",
    type: "assignment",
    title: "New Assignment Posted",
    description:
      "Data Structures Project has been assigned. Due date: 2 days from now.",
    timestamp: "1 hour ago",
    read: true,
    professorName: "Dr. Omar Ali",
    courseName: "Data Structures",
  },
  {
    id: "4",
    type: "schedule",
    title: "Class Schedule Update",
    description: "Operating Systems class moved from Room 205 to Room 301.",
    timestamp: "2 hours ago",
    read: false,
    professorName: "Dr. Fatima Ahmed",
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
    type: "grade",
    title: "Quiz Grade Available",
    description: "Database Systems Quiz #3 results are now available.",
    timestamp: "4 hours ago",
    read: true,
    professorName: "Dr. Youssef Ibrahim",
    courseName: "Database Systems",
  },
  {
    id: "7",
    type: "message",
    title: "Assignment Feedback",
    description:
      "Dr. Nour Hassan provided feedback on your Software Engineering project.",
    timestamp: "6 hours ago",
    read: false,
    professorName: "Dr. Nour Hassan",
    courseName: "Software Engineering",
  },
  {
    id: "8",
    type: "assignment",
    title: "Assignment Deadline Extended",
    description: "Machine Learning Project deadline extended by 2 days.",
    timestamp: "1 day ago",
    read: true,
    professorName: "Dr. Ahmed Hassan",
    courseName: "Machine Learning",
  },
  {
    id: "9",
    type: "grade",
    title: "Midterm Grade Posted",
    description: "Linear Algebra Midterm results are now available.",
    timestamp: "2 days ago",
    read: false,
    professorName: "Dr. Youssef Ibrahim",
    courseName: "Linear Algebra",
  },
  {
    id: "10",
    type: "message",
    title: "Office Hours Reminder",
    description:
      "Dr. Nour Hassan reminded you about your office hours appointment next week.",
    timestamp: "3 days ago",
    read: true,
    professorName: "Dr. Nour Hassan",
    courseName: "Data Structures",
  },
];

// Helper to parse timestamp
const parseTimestamp = (ts: string | undefined | null): Date => {
  // Handle undefined or null timestamps
  if (!ts) {
    return new Date();
  }

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

const mapCategoryToUIType = (
  category: string | undefined,
): NotificationItem["type"] => {
  const cat = category?.toLowerCase();
  switch (cat) {
    case "exam":
    case "assignment":
      return "assignment";
    case "attendance":
      return "attendance";
    case "course":
      return "course";
    case "system":
      return "system";
    case "announcement":
    case "message":
      return "message";
    case "deadline":
    case "reminder":
    case "schedule":
      return "schedule";
    case "grade":
      return "grade";
    default:
      return "system"; // Fallback
  }
};

export default function StudentNotifications() {
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
  const [showReadNotifications, setShowReadNotifications] = useState(true); // Toggle for read notifications

  const notificationsRef = useRef(notifications);
  useEffect(() => {
    notificationsRef.current = notifications;
  }, [notifications]);

  // Load state from localStorage
  useEffect(() => {
    try {
      const savedArchived = localStorage.getItem(
        "student-notifications-archived",
      );
      if (savedArchived) {
        setArchived(new Set(JSON.parse(savedArchived)));
      }

      const savedPinned = localStorage.getItem("student-notifications-pinned");
      if (savedPinned) {
        setPinned(new Set(JSON.parse(savedPinned)));
      }

      const savedSnoozed = localStorage.getItem(
        "student-notifications-snoozed",
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

  const queryClient = useQueryClient();

  const { data: fetchedNotifications = [], refetch: refetchNotifications } =
    useQuery({
      queryKey: ["student-notifications"],
      queryFn: async () => {
        try {
          const res = await apiClient.get("/api/notifications");
          if (res.success && Array.isArray(res.data)) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return res.data.map((notif: any) => ({
              id: String(notif.id),
              type: mapCategoryToUIType(notif.category),
              title: notif.title || "Notification",
              description: notif.message || "",
              timestamp: notif.createdAt || new Date().toISOString(),
              read: notif.isRead || false,
              professorName: notif.metadata?.professorName,
              courseName:
                notif.metadata?.courseName || notif.metadata?.courseCode,
            }));
          }
          return [];
        } catch (e) {
          console.warn("Failed to load from API, using fallback:", e);
          // Try to load from local storage as fallback
          const savedNotifications = localStorage.getItem(
            "student-notifications",
          );
          if (savedNotifications) {
            try {
              return JSON.parse(savedNotifications);
            } catch (error) {
              console.error(
                "Error loading notifications from local storage:",
                error,
              );
            }
          }
          return mockNotifications;
        }
      },
      staleTime: 5 * 60 * 1000, // 5 minutes
      initialData: [],
    });

  useEffect(() => {
    if (fetchedNotifications.length > 0) {
      setNotifications(fetchedNotifications);
      setLastSync(new Date());
    }
  }, [fetchedNotifications]);

  // Save archived/pinned to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(
        "student-notifications-archived",
        JSON.stringify(Array.from(archived)),
      );
      localStorage.setItem(
        "student-notifications-pinned",
        JSON.stringify(Array.from(pinned)),
      );
      const snoozedObj: Record<string, number> = {};
      snoozed.forEach((timestamp, id) => {
        snoozedObj[id] = timestamp;
      });
      localStorage.setItem(
        "student-notifications-snoozed",
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

  // Save notifications to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(
        "student-notifications",
        JSON.stringify(notifications),
      );
    } catch (error) {
      if (DEV) console.error("Error saving notifications:", error);
    }
  }, [notifications]);

  // Toast functions
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

  const handleToggleRead = useCallback(
    async (id: string) => {
      try {
        // Find the notification to know its current read status
        const notification = notificationsRef.current.find((n) => n.id === id);
        if (!notification) return;

        const newReadStatus = !notification.read;

        // Optimistic update - update UI immediately
        setNotifications((prev) =>
          prev.map((n: NotificationItem) =>
            n.id === id ? { ...n, read: newReadStatus } : n,
          ),
        );

        // If marking as read, auto-archive after a short delay for smooth animation
        if (newReadStatus) {
          setTimeout(() => {
            setArchived((prev) => new Set(prev).add(id));
          }, 300);
        } else {
          // If marking as unread, remove from archived
          setArchived((prev) => {
            const next = new Set(prev);
            next.delete(id);
            return next;
          });
        }

        if (DEV)
          console.log(
            `[ToggleRead] Notification ${id} -> ${newReadStatus ? "READ" : "UNREAD"}`,
          );

        // Call backend API to persist the change
        const res = await apiClient.put(`/api/notifications/${id}/read`, {
          isRead: newReadStatus,
        });

        if (!res.success) {
          // Revert optimistic update on failure
          if (DEV)
            console.error(`[ToggleRead] Failed to update notification ${id}`);
          setNotifications((prev) =>
            prev.map((n) => (n.id === id ? { ...n, read: !newReadStatus } : n)),
          );
          if (newReadStatus) {
            setArchived((prev) => {
              const next = new Set(prev);
              next.delete(id);
              return next;
            });
          }
          throw new Error(res.message || "Failed to update notification");
        } else {
          queryClient.invalidateQueries({
            queryKey: ["student-notifications"],
          });
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
        if (DEV) console.error("Failed to toggle read status:", error);
        showToast("error", "Failed to update", "Please try again.");
      }
    },
    [queryClient, showToast],
  );

  const handleMarkAllAsRead = async () => {
    try {
      // Optimistic update - update UI immediately
      setNotifications((prev) =>
        prev.map((notification: NotificationItem) => ({
          ...notification,
          read: true,
        })),
      );

      // Archive all notifications after a short delay for smooth animation
      const notificationIds = notificationsRef.current.map(
        (n: NotificationItem) => n.id,
      );
      setTimeout(() => {
        setArchived((prev) => {
          const next = new Set(prev);
          notificationIds.forEach((id: string) => next.add(id));
          return next;
        });
      }, 500);

      showToast(
        "success",
        "All notifications marked as read",
        "You're all caught up!",
      );

      // Call backend API to persist the change
      const res = await apiClient.patch("/api/notifications/read-all");

      if (!res.success) {
        // Revert optimistic update on failure
        setNotifications((prev) =>
          prev.map((notification) => ({ ...notification, read: false })),
        );
        setArchived((prev) => {
          const next = new Set(prev);
          notificationIds.forEach((id: string) => next.delete(id));
          return next;
        });
        throw new Error(res.message || "Failed to mark notifications as read");
      } else {
        queryClient.invalidateQueries({ queryKey: ["student-notifications"] });
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      if (DEV) console.error("Failed to mark all as read:", error);
      showToast("error", "Failed to mark as read", "Please try again later.");
    }
  };

  const handleClearAll = async () => {
    try {
      if (DEV) console.log("[ClearAll] Starting deletion process...");

      // Store current notifications for rollback
      const currentNotifications = [...notificationsRef.current];
      const notificationIds = notificationsRef.current.map(
        (n: NotificationItem) => n.id,
      );

      if (notificationIds.length === 0) {
        showToast("info", "No notifications to clear");
        return;
      }

      // Optimistic update - clear UI immediately
      setNotifications([]);
      showToast("success", "Clearing all notifications...", "Please wait");

      if (DEV)
        console.log(
          `[ClearAll] Deleting ${notificationIds.length} notifications:`,
          notificationIds,
        );

      // Delete all notifications via backend API
      const deletePromises = notificationIds.map((id: string) =>
        apiClient.delete(`/api/notifications/${id}`).catch((error) => {
          if (DEV)
            console.error(
              `[ClearAll] Failed to delete notification ${id}:`,
              error,
            );
          return { success: false, error, id };
        }),
      );

      const results = await Promise.allSettled(deletePromises);

      // Check results
      const failed = results.filter(
        (r) =>
          r.status === "rejected" ||
          (r.status === "fulfilled" &&
            !(r.value as { success?: boolean })?.success),
      );

      if (failed.length > 0) {
        if (DEV)
          console.error(
            `[ClearAll] Failed to delete ${failed.length} notifications`,
          );

        // Partial failure - revert to current state
        setNotifications(currentNotifications);
        showToast(
          "error",
          "Failed to delete some notifications",
          "Please try again.",
        );
        return;
      }

      if (DEV) console.log("[ClearAll] All notifications deleted successfully");
      showToast(
        "success",
        "All notifications cleared permanently",
        "Your list is now empty.",
      );
      queryClient.invalidateQueries({ queryKey: ["student-notifications"] });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      if (DEV) console.error("[ClearAll] Unexpected error:", error);
      showToast(
        "error",
        "Failed to clear notifications",
        error.message || "Please try again.",
      );

      // Reload from server to ensure consistency
      await handleRefresh();
    }
  };

  const handleRefresh = useCallback(async () => {
    await refetchNotifications();
  }, [refetchNotifications]);

  const handleArchive = useCallback(
    async (id: string) => {
      try {
        if (DEV) console.log(`[Archive] Archiving notification ${id}`);

        // Optimistic update
        setArchived((prev) => new Set(prev).add(id));
        showToast("success", "Notification archived");

        // Permanently delete from backend
        const res = await apiClient.delete(`/api/notifications/${id}`);

        if (!res.success) {
          if (DEV)
            console.error(`[Archive] Failed to delete notification ${id}`);
          // Revert on failure
          setArchived((prev) => {
            const next = new Set(prev);
            next.delete(id);
            return next;
          });
          showToast("error", "Failed to archive", "Please try again.");
        } else {
          // Remove from notifications array permanently
          setNotifications((prev) => prev.filter((n) => n.id !== id));
          queryClient.invalidateQueries({
            queryKey: ["student-notifications"],
          });
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
        if (DEV) console.error("[Archive] Error:", error);
        setArchived((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
        showToast("error", "Failed to archive", "Please try again.");
      }
    },
    [showToast, queryClient],
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

  const handleLoadMore = useCallback(() => {
    setDisplayLimit((prev) => prev + 50);
  }, []);

  // Get priority for a notification
  const getPriority = useCallback(
    (n: NotificationItem): "urgent" | "normal" | "low" => {
      // Urgent: grade changes, assignments, system alerts
      if (n.type === "grade" || (n.type === "assignment" && !n.read))
        return "urgent";
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

    // Apply search
    const searchable = filtered.filter(
      (n) =>
        !searchTerm ||
        n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        n.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        n.courseName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        n.professorName?.toLowerCase().includes(searchTerm.toLowerCase()),
    );

    // Filter based on read status
    const readFiltered = showReadNotifications
      ? searchable
      : searchable.filter((n) => !n.read);

    // Sort: pinned first, then by timestamp
    const sorted = [...readFiltered].sort((a, b) => {
      const aPinned = pinned.has(a.id);
      const bPinned = pinned.has(b.id);
      if (aPinned && !bPinned) return -1;
      if (!aPinned && bPinned) return 1;

      const aDate = parseTimestamp(a.timestamp);
      const bDate = parseTimestamp(b.timestamp);
      return bDate.getTime() - aDate.getTime();
    });

    return sorted;
  }, [
    notifications,
    archived,
    snoozed,
    activeFilter,
    searchTerm,
    pinned,
    showReadNotifications,
  ]);

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
    }, 60000);

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
        case "k": {
          // Navigate to previous notification (placeholder - would need focus management)
          e.preventDefault();
          break;
        }
        case "j": {
          // Navigate to next notification (placeholder - would need focus management)
          e.preventDefault();
          break;
        }
        case "r": {
          // Mark first unread as read
          e.preventDefault();
          const firstUnread = processedNotifications.find((n) => !n.read);
          if (firstUnread) {
            handleToggleRead(firstUnread.id);
          }
          break;
        }
        case "a": {
          // Archive first notification
          e.preventDefault();
          if (processedNotifications.length > 0) {
            handleArchive(processedNotifications[0].id);
          }
          break;
        }
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
        userName={user ? `${user.firstName} ${user.lastName}` : "Student"}
        userType="student"
      >
        <div className="max-w-4xl mx-auto relative">
          {/* Background Gradients */}
          <div className="fixed inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
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
                  className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg"
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
                        className="px-2 py-0.5 rounded-full bg-orange-500 text-white text-xs font-semibold"
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
                    <p className="text-gray-600 dark:text-mutedDark text-lg lg:text-xl">
                      Stay updated with your latest alerts and course activities
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
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                  <input
                    type="search"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search notifications..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm hover:shadow-md hover:bg-white/80 dark:hover:bg-gray-800/80"
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
                      onClick={() => {
                        if (
                          window.confirm(
                            "Are you sure you want to clear all notifications? This action cannot be undone.",
                          )
                        ) {
                          void handleClearAll();
                        }
                      }}
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

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() =>
                    setShowReadNotifications(!showReadNotifications)
                  }
                  className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 ${
                    showReadNotifications
                      ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                      : "bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200"
                  }`}
                  aria-label={
                    showReadNotifications
                      ? "Hide read notifications"
                      : "Show read notifications"
                  }
                >
                  <CheckCheck className="w-4 h-4" />
                  {showReadNotifications ? "Hide Read" : "Show Read"}
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
          <section aria-live="polite" aria-label="Notifications list">
            {notifications.length === 0 ? (
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
      </DashboardLayout>
    </ErrorBoundary>
  );
}
