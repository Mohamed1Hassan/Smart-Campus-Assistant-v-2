"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import {
  Bell,
  BellRing,
  CheckCircle,
  AlertTriangle,
  Shield,
  User,
  Settings,
  CheckCircle2,
  Trash2,
  Archive,
  Star,
  StarOff,
} from "lucide-react";

interface Notification {
  id: string;
  type: "SECURITY" | "ATTENDANCE" | "SYSTEM" | "EMERGENCY";
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  title: string;
  message: string;
  data?: Record<string, unknown>;
  timestamp: Date;
  isRead: boolean;
  isStarred: boolean;
  isArchived: boolean;
  userId?: string;
  sessionId?: string;
  courseId?: number;
}

interface SocketNotificationData {
  id?: string;
  type?: Notification["type"];
  priority?: Notification["priority"];
  title?: string;
  message?: string;
  data?: Record<string, unknown>;
  timestamp?: number | string;
  userId?: string;
  sessionId?: string;
  courseId?: number;
}

interface NotificationManagerProps {
  userId?: string;
  sessionId?: string;
  courseId?: number;
  showFilters?: boolean;
  showSettings?: boolean;
}

export const NotificationManager: React.FC<NotificationManagerProps> = ({
  userId,
  showFilters = true,
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filters, setFilters] = useState({
    type: "ALL" as string,
    priority: "ALL" as string,
    status: "ALL" as string,
    timeRange: "ALL" as string,
  });
  const [settings, setSettings] = useState({
    autoMarkAsRead: false,
    soundEnabled: true,
    vibrationEnabled: true,
    desktopNotifications: true,
    emailNotifications: false,
    pushNotifications: true,
  });
  const [isExpanded, setIsExpanded] = useState(false);
  const soundRef = useRef<HTMLAudioElement | null>(null);

  const stats = React.useMemo(() => {
    return {
      total: notifications.length,
      unread: notifications.filter((n) => !n.isRead).length,
      starred: notifications.filter((n) => n.isStarred).length,
      archived: notifications.filter((n) => n.isArchived).length,
      critical: notifications.filter((n) => n.priority === "CRITICAL").length,
      high: notifications.filter((n) => n.priority === "HIGH").length,
      medium: notifications.filter((n) => n.priority === "MEDIUM").length,
      low: notifications.filter((n) => n.priority === "LOW").length,
    };
  }, [notifications]);

  const playNotificationSound = useCallback(() => {
    if (settings.soundEnabled && soundRef.current) {
      soundRef.current.play().catch(console.error);
    }
  }, [settings.soundEnabled]);

  const showDesktopNotification = useCallback(
    (notification: Notification) => {
      if (
        settings.desktopNotifications &&
        "Notification" in window &&
        Notification.permission === "granted"
      ) {
        new Notification(notification.title, {
          body: notification.message,
          icon: "/favicon.ico",
          tag: notification.id,
        });
      }
    },
    [settings.desktopNotifications],
  );

  const handleNotification = useCallback(
    (data: SocketNotificationData, type: Notification["type"]) => {
      const notification: Notification = {
        id: data.id || `notification-${Date.now()}`,
        type: type,
        priority: data.priority || "MEDIUM",
        title: data.title || "Notification",
        message: data.message || "",
        data: data.data,
        timestamp: data.timestamp ? new Date(data.timestamp) : new Date(),
        isRead: false,
        isStarred: false,
        isArchived: false,
        userId: data.userId,
        sessionId: data.sessionId,
        courseId: data.courseId,
      };

      setNotifications((prev) => [notification, ...prev]);

      playNotificationSound();
      showDesktopNotification(notification);
    },
    [playNotificationSound, showDesktopNotification],
  );

  useEffect(() => {
    // Initialize Supabase Realtime connection
    const channel = supabase
      .channel(`user:${userId}`)
      .on(
        'broadcast',
        { event: 'notification' },
        (payload: any) => {
          const data = payload?.payload || payload;
          if (data && (data.title || data.message)) {
            handleNotification(data, data.type || "SYSTEM");
          }
        }
      )
      .on(
        'broadcast',
        { event: 'notification:security' },
        (payload: any) => {
          const data = payload?.payload || payload;
          if (data && (data.title || data.message)) {
            handleNotification(data, "SECURITY");
          }
        }
      )
      .on(
        'broadcast',
        { event: 'notification:attendance' },
        (payload: any) => {
          const data = payload?.payload || payload;
          if (data && (data.title || data.message)) {
            handleNotification(data, "ATTENDANCE");
          }
        }
      )
      .on(
        'broadcast',
        { event: 'notification:system' },
        (payload: any) => {
          const data = payload?.payload || payload;
          if (data && (data.title || data.message)) {
            handleNotification(data, "SYSTEM");
          }
        }
      )
      .on(
        'broadcast',
        { event: 'notification:emergency' },
        (payload: any) => {
          const data = payload?.payload || payload;
          if (data && (data.title || data.message)) {
            handleNotification(data, "EMERGENCY");
          }
        }
      )
      .subscribe();

    // Initialize sound
    if (typeof window !== "undefined") {
      soundRef.current = new Audio("/sounds/notification.mp3");
    }

    return () => {
      channel.unsubscribe();
    };
  }, [userId, handleNotification]);

  // playNotificationSound and showDesktopNotification are defined above useEffect

  const requestNotificationPermission = async () => {
    if ("Notification" in window && Notification.permission === "default") {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        setSettings((prev) => ({ ...prev, desktopNotifications: true }));
      }
    }
  };

  const filteredNotifications = React.useMemo(() => {
    // Apply filters
    let filtered = notifications;

    if (filters.type !== "ALL") {
      filtered = filtered.filter(
        (notification) => notification.type === filters.type,
      );
    }

    if (filters.priority !== "ALL") {
      filtered = filtered.filter(
        (notification) => notification.priority === filters.priority,
      );
    }

    if (filters.status === "UNREAD") {
      filtered = filtered.filter((notification) => !notification.isRead);
    } else if (filters.status === "READ") {
      filtered = filtered.filter((notification) => notification.isRead);
    } else if (filters.status === "STARRED") {
      filtered = filtered.filter((notification) => notification.isStarred);
    } else if (filters.status === "ARCHIVED") {
      filtered = filtered.filter((notification) => notification.isArchived);
    }

    if (filters.timeRange !== "ALL") {
      const now = new Date();
      const timeRanges = {
        "1H": 60 * 60 * 1000,
        "24H": 24 * 60 * 60 * 1000,
        "7D": 7 * 24 * 60 * 60 * 1000,
        "30D": 30 * 24 * 60 * 60 * 1000,
      };

      const timeRange =
        timeRanges[filters.timeRange as keyof typeof timeRanges];
      if (timeRange) {
        filtered = filtered.filter(
          (notification) =>
            now.getTime() - notification.timestamp.getTime() < timeRange,
        );
      }
    }

    return filtered;
  }, [notifications, filters]);

  // updateStats is defined above useEffect

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "CRITICAL":
        return "bg-red-100 text-red-800 border-red-200";
      case "HIGH":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "MEDIUM":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "LOW":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "SECURITY":
        return <Shield className="h-4 w-4 text-red-500" />;
      case "ATTENDANCE":
        return <User className="h-4 w-4 text-blue-500" />;
      case "SYSTEM":
        return <Settings className="h-4 w-4 text-gray-500" />;
      case "EMERGENCY":
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  const markAsRead = async (notificationId: string) => {
    setNotifications((prev) =>
      prev.map((notification) =>
        notification.id === notificationId
          ? { ...notification, isRead: true }
          : notification,
      ),
    );
  };

  const markAllAsRead = async () => {
    setNotifications((prev) =>
      prev.map((notification) => ({ ...notification, isRead: true })),
    );
  };

  const toggleStar = async (notificationId: string) => {
    setNotifications((prev) =>
      prev.map((notification) =>
        notification.id === notificationId
          ? { ...notification, isStarred: !notification.isStarred }
          : notification,
      ),
    );
  };

  const archiveNotification = async (notificationId: string) => {
    setNotifications((prev) =>
      prev.map((notification) =>
        notification.id === notificationId
          ? { ...notification, isArchived: true }
          : notification,
      ),
    );
  };

  const deleteNotification = async (notificationId: string) => {
    setNotifications((prev) =>
      prev.filter((notification) => notification.id !== notificationId),
    );
  };

  return (
    <div className="space-y-4">
      {/* Notification Stats */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold">
              Notifications
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="text-xs">
                {stats.unread} Unread
              </Badge>
              {stats.critical > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {stats.critical} Critical
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {stats.critical}
              </div>
              <div className="text-sm text-gray-600">Critical</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {stats.high}
              </div>
              <div className="text-sm text-gray-600">High</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {stats.medium}
              </div>
              <div className="text-sm text-gray-600">Medium</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {stats.low}
              </div>
              <div className="text-sm text-gray-600">Low</div>
            </div>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="flex flex-wrap gap-2 mb-4">
              <select
                value={filters.type}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, type: e.target.value }))
                }
                className="px-3 py-1 border rounded-md text-sm"
              >
                <option value="ALL">All Types</option>
                <option value="SECURITY">Security</option>
                <option value="ATTENDANCE">Attendance</option>
                <option value="SYSTEM">System</option>
                <option value="EMERGENCY">Emergency</option>
              </select>

              <select
                value={filters.priority}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, priority: e.target.value }))
                }
                className="px-3 py-1 border rounded-md text-sm"
              >
                <option value="ALL">All Priorities</option>
                <option value="CRITICAL">Critical</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>

              <select
                value={filters.status}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, status: e.target.value }))
                }
                className="px-3 py-1 border rounded-md text-sm"
              >
                <option value="ALL">All</option>
                <option value="UNREAD">Unread</option>
                <option value="READ">Read</option>
                <option value="STARRED">Starred</option>
                <option value="ARCHIVED">Archived</option>
              </select>

              <select
                value={filters.timeRange}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, timeRange: e.target.value }))
                }
                className="px-3 py-1 border rounded-md text-sm"
              >
                <option value="ALL">All Time</option>
                <option value="1H">Last Hour</option>
                <option value="24H">Last 24 Hours</option>
                <option value="7D">Last 7 Days</option>
                <option value="30D">Last 30 Days</option>
              </select>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2 mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={markAllAsRead}
              disabled={stats.unread === 0}
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Mark All Read
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={requestNotificationPermission}
            >
              <BellRing className="h-4 w-4 mr-2" />
              Enable Desktop
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? "Hide" : "Show"} Notifications (
              {filteredNotifications.length})
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Notifications List */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold">
                  Notification List
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {filteredNotifications.length === 0 ? (
                    <div className="text-center text-gray-500 py-4">
                      No notifications found
                    </div>
                  ) : (
                    filteredNotifications.map((notification, index) => (
                      <motion.div
                        key={notification.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        className={`p-4 rounded-lg border-l-4 ${
                          notification.priority === "CRITICAL"
                            ? "border-red-500 dark:border-red-600 bg-red-50 dark:bg-red-900/20"
                            : notification.priority === "HIGH"
                              ? "border-orange-500 dark:border-orange-600 bg-orange-50 dark:bg-orange-900/20"
                              : notification.priority === "MEDIUM"
                                ? "border-yellow-500 dark:border-yellow-600 bg-yellow-50 dark:bg-yellow-900/20"
                                : "border-green-500 dark:border-green-600 bg-green-50 dark:bg-green-900/20"
                        } ${!notification.isRead ? "ring-2 ring-blue-200 dark:ring-blue-800" : ""}`}
                      >
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0">
                            {getTypeIcon(notification.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-2">
                              <Badge
                                className={getPriorityColor(
                                  notification.priority,
                                )}
                              >
                                {notification.priority}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {notification.type}
                              </Badge>
                              {notification.isStarred && (
                                <Star className="h-4 w-4 text-yellow-500" />
                              )}
                              {!notification.isRead && (
                                <div className="w-2 h-2 bg-blue-500 rounded-full" />
                              )}
                            </div>
                            <h4 className="font-medium text-gray-900 mb-1">
                              {notification.title}
                            </h4>
                            <p className="text-sm text-gray-600 mb-2">
                              {notification.message}
                            </p>
                            <p className="text-xs text-gray-500 mb-3">
                              {new Date(
                                notification.timestamp,
                              ).toLocaleString()}
                            </p>
                            <div className="flex items-center space-x-2">
                              {!notification.isRead && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => markAsRead(notification.id)}
                                >
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Mark Read
                                </Button>
                              )}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => toggleStar(notification.id)}
                              >
                                {notification.isStarred ? (
                                  <StarOff className="h-3 w-3 mr-1" />
                                ) : (
                                  <Star className="h-3 w-3 mr-1" />
                                )}
                                {notification.isStarred ? "Unstar" : "Star"}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  archiveNotification(notification.id)
                                }
                              >
                                <Archive className="h-3 w-3 mr-1" />
                                Archive
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  deleteNotification(notification.id)
                                }
                              >
                                <Trash2 className="h-3 w-3 mr-1" />
                                Delete
                              </Button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationManager;
