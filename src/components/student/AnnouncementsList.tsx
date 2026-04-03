"use client";
import { motion } from "framer-motion";
import {
  Megaphone,
  Building,
  Lightbulb,
  BookOpen,
  Calendar,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface Announcement {
  id: string;
  icon: "megaphone" | "building" | "lightbulb" | "book" | "calendar" | "alert";
  title: string;
  message: string;
  timestamp: string;
  type: "info" | "warning" | "success";
}

interface AnnouncementsListProps {
  announcements: Announcement[];
  loading?: boolean;
}

const iconMap = {
  megaphone: Megaphone,
  building: Building,
  lightbulb: Lightbulb,
  book: BookOpen,
  calendar: Calendar,
  alert: AlertTriangle,
};

const typeConfig = {
  info: {
    bgColor: "bg-blue-50/50 dark:bg-blue-900/10",
    iconColor: "text-blue-600 dark:text-blue-400",
    borderColor: "border-blue-100 dark:border-blue-800/30",
  },
  warning: {
    bgColor: "bg-amber-50/50 dark:bg-amber-900/10",
    iconColor: "text-amber-600 dark:text-amber-400",
    borderColor: "border-amber-100 dark:border-amber-800/30",
  },
  success: {
    bgColor: "bg-emerald-50/50 dark:bg-emerald-900/10",
    iconColor: "text-emerald-600 dark:text-emerald-400",
    borderColor: "border-emerald-100 dark:border-emerald-800/30",
  },
};

export default function AnnouncementsList({
  announcements,
}: AnnouncementsListProps) {
  const router = useRouter();

  const handleAnnouncementClick = (announcement: Announcement) => {
    // Navigate based on icon type which maps to category
    switch (announcement.icon) {
      case "alert": // ATTENDANCE
        router.push("/dashboard/student/attendance");
        break;
      case "calendar": // EXAM/DEADLINE
        router.push("/dashboard/student/schedule");
        break;
      case "book": // COURSE
      case "lightbulb": // ASSIGNMENT
        router.push("/dashboard/student/courses");
        break;
      default:
        router.push("/dashboard/student/notifications");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 dark:border-gray-700/30 overflow-hidden flex flex-col h-full"
    >
      {/* Header */}
      <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700/50 bg-gradient-to-r from-purple-50/50 to-pink-50/50 dark:from-purple-900/10 dark:to-pink-900/10">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/20">
            <Megaphone className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              University News
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
              Latest updates
            </p>
          </div>
        </div>
      </div>

      {/* Announcements */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
        {announcements.length > 0 ? (
          announcements.map((announcement, index) => {
            const IconComponent = iconMap[announcement.icon] || Megaphone;
            const typeInfo = typeConfig[announcement.type] || typeConfig.info;

            return (
              <motion.div
                key={announcement.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                className={`p-4 rounded-xl border ${typeInfo.borderColor} ${typeInfo.bgColor} hover:bg-white dark:hover:bg-gray-700/50 transition-all duration-200 group cursor-pointer`}
                onClick={() => handleAnnouncementClick(announcement)}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center bg-white dark:bg-gray-800 shadow-sm shrink-0 group-hover:scale-110 transition-transform duration-300`}
                  >
                    <IconComponent
                      className={`w-5 h-5 ${typeInfo.iconColor}`}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h4 className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                        {announcement.title}
                      </h4>
                      <span className="text-[10px] font-bold text-gray-600 dark:text-gray-300 whitespace-nowrap bg-white/50 dark:bg-gray-800/50 px-2 py-0.5 rounded-full">
                        {announcement.timestamp}
                      </span>
                    </div>
                    <p className="text-xs text-gray-700 dark:text-gray-200 leading-relaxed line-clamp-2">
                      {announcement.message}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center h-48 text-center">
            <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700/50 rounded-full flex items-center justify-center mb-3">
              <Megaphone className="w-6 h-6 text-gray-400" />
            </div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              No announcements
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Check back later for updates
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 py-4 bg-gray-50/50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-700/50">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
            {announcements.length} update{announcements.length !== 1 ? "s" : ""}
          </span>
          <button
            onClick={() => router.push("/dashboard/student/notifications")}
            className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 flex items-center gap-1 transition-colors group"
          >
            View All
            <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
