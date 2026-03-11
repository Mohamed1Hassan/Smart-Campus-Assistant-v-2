"use client";
import { motion } from "framer-motion";
import {
  Bell,
  GraduationCap,
  MessageSquare,
  AlertTriangle,
  FileText,
} from "lucide-react";

export type FilterType =
  | "all"
  | "submission"
  | "message"
  | "system"
  | "assignment";

interface FilterBarProps {
  activeFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
  unreadCount: number;
}

const filterOptions = [
  {
    key: "all" as FilterType,
    Tag: "All",
    icon: Bell,
    count: null, // Will be calculated
  },
  {
    key: "submission" as FilterType,
    Tag: "Submissions",
    icon: GraduationCap,
    count: null,
  },
  {
    key: "message" as FilterType,
    Tag: "Messages",
    icon: MessageSquare,
    count: null,
  },
  {
    key: "system" as FilterType,
    Tag: "Alerts",
    icon: AlertTriangle,
    count: null,
  },
  {
    key: "assignment" as FilterType,
    Tag: "Assignments",
    icon: FileText,
    count: null,
  },
];

export default function FilterBar({
  activeFilter,
  onFilterChange,
  unreadCount,
}: FilterBarProps) {
  const getColor = (key: FilterType, isActive: boolean) => {
    if (!isActive)
      return "text-gray-600 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-gray-200";

    switch (key) {
      case "submission":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 ring-1 ring-blue-500/20";
      case "assignment":
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300 ring-1 ring-yellow-500/20";
      case "system":
        return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 ring-1 ring-red-500/20";
      case "message":
        return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 ring-1 ring-purple-500/20";
      default:
        return "bg-violet-600 text-white shadow-lg shadow-violet-500/30";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-sm border border-white/20 dark:border-gray-700/30 p-2 mb-8"
    >
      <div className="flex flex-wrap items-center gap-2">
        {filterOptions.map((option) => {
          const Icon = option.icon;
          const isActive = activeFilter === option.key;

          return (
            <motion.button
              key={option.key}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onFilterChange(option.key)}
              className={`
                flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200
                ${getColor(option.key, isActive)}
              `}
            >
              <Icon className={`w-4 h-4 ${isActive ? "" : "opacity-70"}`} />
              <span>{option.Tag}</span>
              {option.key === "all" && unreadCount > 0 && (
                <span
                  className={`
                  text-xs px-2 py-0.5 rounded-full min-w-[20px] text-center
                  ${isActive ? "bg-white/20 text-white" : "bg-violet-100 text-violet-600 dark:bg-violet-900/50 dark:text-violet-300"}
                `}
                >
                  {unreadCount}
                </span>
              )}
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
}
