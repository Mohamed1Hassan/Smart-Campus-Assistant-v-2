"use client";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "../components/common/DashboardLayout";
import NotificationItem from "../components/NotificationItem";
import NotificationModal from "../components/NotificationModal";
import { notificationsData, Notification } from "../data/notificationsData";
import { CheckCheck, Loader2 } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

export default function Notifications() {
  const { user } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] =
    useState<Notification[]>(notificationsData);
  const [selectedNotification, setSelectedNotification] =
    useState<Notification | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !n.read).length;
  }, [notifications]);

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === notification.id ? { ...n, read: true } : n)),
      );
    }

    if (notification.link) {
      router.push(notification.link);
    } else {
      setSelectedNotification(notification);
    }
  };

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleLoadMore = () => {
    setIsLoadingMore(true);
    setTimeout(() => {
      setIsLoadingMore(false);
    }, 1000);
  };

  return (
    <DashboardLayout
      userName={user ? `${user.firstName} ${user.lastName}` : "Student"}
      userType="student"
    >
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-textDark">
              Notifications
            </h1>
            {unreadCount > 0 && (
              <p className="text-sm text-gray-600 dark:text-mutedDark mt-1">
                You have {unreadCount} unread notification
                {unreadCount !== 1 ? "s" : ""}
              </p>
            )}
          </div>

          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              aria-label="Mark all notifications as read"
            >
              <CheckCheck className="w-4 h-4" />
              Mark all as read
            </button>
          )}
        </div>

        <div className="bg-white dark:bg-cardDark rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          {notifications.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCheck className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-textDark mb-2">
                No notifications
              </h3>
              <p className="text-sm text-gray-600 dark:text-mutedDark">
                You&apos;re all caught up!
              </p>
            </div>
          ) : (
            <>
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {notifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onClick={handleNotificationClick}
                  />
                ))}
              </div>

              <div className="p-6 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                <button
                  onClick={handleLoadMore}
                  disabled={isLoadingMore}
                  className="w-full py-3 text-sm font-medium text-gray-700 dark:text-textDark hover:text-gray-900 dark:hover:text-textDark hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  {isLoadingMore ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Loading...
                    </span>
                  ) : (
                    "Load more notifications"
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <NotificationModal
        notification={selectedNotification}
        onClose={() => setSelectedNotification(null)}
      />
    </DashboardLayout>
  );
}
