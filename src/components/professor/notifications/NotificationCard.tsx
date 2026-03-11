"use client";
import { motion } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import {
  FileText,
  Calendar,
  AlertTriangle,
  MessageSquare,
  Clock,
  MoreVertical,
  Archive,
  Clock as ClockIcon,
  Pin,
  PinOff,
} from "lucide-react";

export interface NotificationItem {
  id: string;
  type: "assignment" | "submission" | "schedule" | "system" | "message";
  title: string;
  description: string;
  timestamp: string;
  read: boolean;
  studentName?: string;
  courseName?: string;
  priority?: "urgent" | "normal" | "low";
}

interface NotificationCardProps {
  notification: NotificationItem;
  onToggleRead: (id: string) => void;
  index: number;
  onArchive?: (id: string) => void;
  onSnooze?: (id: string, hours: number) => void;
  onPin?: (id: string) => void;
  onUnpin?: (id: string) => void;
  isPinned?: boolean;
  priority?: "urgent" | "normal" | "low";
}

const notificationConfig = {
  submission: {
    icon: FileText,
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-50 dark:bg-blue-900/20",
    borderColor: "border-l-blue-500",
  },
  assignment: {
    icon: FileText,
    color: "text-yellow-600 dark:text-yellow-400",
    bgColor: "bg-yellow-50 dark:bg-yellow-900/20",
    borderColor: "border-l-yellow-500",
  },
  schedule: {
    icon: Calendar,
    color: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-50 dark:bg-green-900/20",
    borderColor: "border-l-green-500",
  },
  system: {
    icon: AlertTriangle,
    color: "text-red-600 dark:text-red-400",
    bgColor: "bg-red-50 dark:bg-red-900/20",
    borderColor: "border-l-red-500",
  },
  message: {
    icon: MessageSquare,
    color: "text-purple-600 dark:text-purple-400",
    bgColor: "bg-purple-50 dark:bg-purple-900/20",
    borderColor: "border-l-purple-500",
  },
};

export default function NotificationCard({
  notification,
  onToggleRead,
  onArchive,
  onSnooze,
  onPin,
  onUnpin,
  isPinned = false,
  priority,
}: NotificationCardProps) {
  const config = notificationConfig[notification.type];
  const Icon = config.icon;
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const cardPriority = priority || notification.priority || "normal";

  // Get priority styles
  const getPriorityStyles = () => {
    if (cardPriority === "urgent") {
      return {
        border: "border-l-4 border-red-500",
        iconColor: notification.read ? "opacity-70" : "",
        opacity: notification.read ? "opacity-75" : "",
      };
    } else if (cardPriority === "low") {
      return {
        border: !notification.read ? `border-l-4 ${config.borderColor}` : "",
        iconColor: "opacity-70",
        opacity: "opacity-70",
      };
    }
    return {
      border: !notification.read ? `border-l-4 ${config.borderColor}` : "",
      iconColor: "",
      opacity: notification.read ? "opacity-75" : "",
    };
  };

  const priorityStyles = getPriorityStyles();

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showMenu]);

  const handleClick = (e: React.MouseEvent) => {
    // Don't toggle read if clicking menu
    if ((e.target as HTMLElement).closest(".action-menu")) {
      return;
    }
    onToggleRead(notification.id);
  };

  const handleArchive = () => {
    onArchive?.(notification.id);
    setShowMenu(false);
  };

  const handleSnooze = (hours: number) => {
    onSnooze?.(notification.id, hours);
    setShowMenu(false);
  };

  const handlePin = () => {
    if (isPinned) {
      onUnpin?.(notification.id);
    } else {
      onPin?.(notification.id);
    }
    setShowMenu(false);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ duration: 0.2 }}
      className={`
        group relative overflow-hidden
        bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl
        rounded-2xl shadow-sm hover:shadow-xl
        border border-white/20 dark:border-gray-700/30
        p-5 transition-all duration-300
        ${priorityStyles.border} ${priorityStyles.opacity}
        ${isPinned ? "ring-2 ring-violet-500/50 dark:ring-violet-400/50 bg-violet-50/50 dark:bg-violet-900/10" : ""}
        cursor-pointer
      `}
      onClick={handleClick}
    >
      {/* Background Gradient Effect on Hover */}
      <div
        className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none bg-gradient-to-r ${config.bgColor.replace("bg-", "from-").split(" ")[0]}/10 to-transparent`}
      />

      {isPinned && (
        <div className="absolute top-3 right-3 z-10">
          <motion.div
            initial={{ rotate: -45, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            className="p-1.5 bg-violet-100 dark:bg-violet-900/30 rounded-full text-violet-600 dark:text-violet-400"
          >
            <Pin className="w-3.5 h-3.5" fill="currentColor" />
          </motion.div>
        </div>
      )}

      <div className="flex items-start gap-5 relative z-10">
        {/* Icon */}
        <motion.div
          whileHover={{ rotate: 15, scale: 1.1 }}
          className={`
            p-3.5 rounded-2xl ${config.bgColor} ${config.color} 
            shadow-lg shadow-${config.color.split("-")[1]}-500/20
            flex-shrink-0 ${priorityStyles.iconColor}
          `}
        >
          <Icon className="w-6 h-6" />
        </motion.div>

        {/* Content */}
        <div className="flex-1 min-w-0 pt-1">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1.5">
                <h4
                  className={`font-bold text-base ${
                    notification.read
                      ? "text-gray-600 dark:text-gray-400"
                      : "text-gray-900 dark:text-white"
                  }`}
                >
                  {notification.title}
                </h4>
                {cardPriority === "urgent" && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800">
                    Urgent
                  </span>
                )}
                {!notification.read && (
                  <span className="w-2 h-2 rounded-full bg-violet-500 animate-pulse" />
                )}
              </div>

              <p
                className={`text-sm leading-relaxed mb-3 ${
                  notification.read
                    ? "text-gray-500 dark:text-gray-500"
                    : "text-gray-600 dark:text-gray-300"
                }`}
              >
                {notification.description}
              </p>

              <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                {/* Student and Course info */}
                {(notification.studentName || notification.courseName) && (
                  <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-gray-700/50">
                    {notification.studentName && (
                      <span className="font-semibold text-gray-700 dark:text-gray-300">
                        {notification.studentName}
                      </span>
                    )}
                    {notification.studentName && notification.courseName && (
                      <span className="text-gray-300 dark:text-gray-600">
                        |
                      </span>
                    )}
                    {notification.courseName && (
                      <span className="text-gray-600 dark:text-gray-400">
                        {notification.courseName}
                      </span>
                    )}
                  </div>
                )}

                {/* Timestamp */}
                <div className="flex items-center gap-1.5 ml-auto">
                  <Clock className="w-3.5 h-3.5" />
                  <span className="font-medium">{notification.timestamp}</span>
                </div>
              </div>
            </div>

            {/* Actions menu */}
            {(onArchive || onSnooze || onPin || onUnpin) && (
              <div className="relative action-menu -mr-2 -mt-2" ref={menuRef}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(!showMenu);
                  }}
                  className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700/50 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  <MoreVertical className="w-5 h-5" />
                </button>

                {showMenu && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    className="absolute right-0 top-full mt-1 z-50 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden"
                  >
                    <div className="p-1.5 space-y-0.5">
                      {onPin && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePin();
                          }}
                          className="w-full px-3 py-2.5 text-left text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg flex items-center gap-3 transition-colors"
                        >
                          {isPinned ? (
                            <>
                              <PinOff className="w-4 h-4 text-gray-400" />
                              Unpin Notification
                            </>
                          ) : (
                            <>
                              <Pin className="w-4 h-4 text-gray-400" />
                              Pin to Top
                            </>
                          )}
                        </button>
                      )}
                      {onSnooze && (
                        <>
                          <div className="px-3 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                            Snooze
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSnooze(1);
                            }}
                            className="w-full px-3 py-2 text-left text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg flex items-center gap-3 transition-colors"
                          >
                            <ClockIcon className="w-4 h-4 text-gray-400" />1
                            hour
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSnooze(24);
                            }}
                            className="w-full px-3 py-2 text-left text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg flex items-center gap-3 transition-colors"
                          >
                            <ClockIcon className="w-4 h-4 text-gray-400" />1 day
                          </button>
                        </>
                      )}
                      {onArchive && (
                        <>
                          <div className="my-1 border-t border-gray-100 dark:border-gray-700/50" />
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleArchive();
                            }}
                            className="w-full px-3 py-2.5 text-left text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg flex items-center gap-3 transition-colors"
                          >
                            <Archive className="w-4 h-4" />
                            Archive
                          </button>
                        </>
                      )}
                    </div>
                  </motion.div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
