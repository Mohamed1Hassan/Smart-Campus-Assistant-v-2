"use client";
import { Clock, BookOpen, Bell, Award, FileText, Settings } from "lucide-react";
import { Notification } from "../data/notificationsData";

interface NotificationItemProps {
  notification: Notification;
  onClick: (notification: Notification) => void;
}

const typeIcons = {
  exam: BookOpen,
  announcement: Bell,
  grade: Award,
  assignment: FileText,
  system: Settings,
};

const typeColors = {
  exam: "text-orange-500 bg-orange-50 dark:text-orange-400 dark:bg-orange-900/20",
  announcement:
    "text-blue-500 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/20",
  grade: "text-green-500 bg-green-50 dark:text-green-400 dark:bg-green-900/20",
  assignment:
    "text-purple-500 bg-purple-50 dark:text-purple-400 dark:bg-purple-900/20",
  system: "text-gray-500 bg-gray-50 dark:text-gray-400 dark:bg-gray-800/50",
};

export default function NotificationItem({
  notification,
  onClick,
}: NotificationItemProps) {
  const Icon = typeIcons[notification.type];

  return (
    <div
      onClick={() => onClick(notification)}
      className={`
        p-6 border-b border-gray-100 dark:border-gray-700 cursor-pointer transition-all duration-200
        hover:bg-gray-50 dark:hover:bg-gray-700 active:bg-gray-100 dark:active:bg-gray-600
        ${!notification.read ? "bg-blue-50/30 dark:bg-blue-900/20" : "bg-white dark:bg-cardDark"}
      `}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick(notification);
        }
      }}
      aria-label={`${notification.read ? "Read" : "Unread"} notification: ${notification.title}`}
    >
      <div className="flex items-start gap-4">
        <div
          className={`p-2.5 rounded-lg ${typeColors[notification.type]} flex-shrink-0`}
        >
          <Icon className="w-5 h-5" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h4
              className={`text-sm ${!notification.read ? "font-semibold text-gray-900 dark:text-textDark" : "font-medium text-gray-700 dark:text-textDark"}`}
            >
              {notification.title}
            </h4>
            {!notification.read && (
              <span
                className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full flex-shrink-0 mt-1.5"
                aria-label="Unread"
              ></span>
            )}
          </div>

          <p className="text-sm text-gray-600 dark:text-mutedDark mb-2 line-clamp-2">
            {notification.message}
          </p>

          <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-mutedDark">
            <Clock className="w-3.5 h-3.5" />
            <span>{notification.time}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
