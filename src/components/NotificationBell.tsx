"use client";
import { Bell } from "lucide-react";
import { useRouter } from "next/navigation";

interface NotificationBellProps {
  unreadCount: number;
  userType?: "student" | "professor" | "admin";
}

export default function NotificationBell({
  unreadCount,
  userType = "student",
}: NotificationBellProps) {
  const router = useRouter();

  const getNotificationsPath = () => {
    return userType === "student"
      ? "/dashboard/student/notifications"
      : userType === "admin"
        ? "/dashboard/admin/notifications"
        : "/dashboard/professor/notifications";
  };

  return (
    <button
      onClick={() => router.push(getNotificationsPath())}
      className="relative p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`}
    >
      <Bell className="w-5 h-5" />
      {unreadCount > 0 && (
        <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 text-white text-xs font-semibold rounded-full px-1 animate-pulse">
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}
    </button>
  );
}
