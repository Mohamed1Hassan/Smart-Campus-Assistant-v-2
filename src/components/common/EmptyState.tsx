"use client";
import { motion } from "framer-motion";
import { LucideIcon, RefreshCw, SearchX, Inbox } from "lucide-react";
import React from "react";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: "primary" | "secondary";
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  type?: "empty" | "no-matches" | "error";
}

const getIconColor = (type: string) => {
  if (type === "no-matches") {
    return "text-gray-400 dark:text-gray-500";
  }
  if (type === "error") {
    return "text-red-600 dark:text-red-400";
  }
  return "text-blue-600 dark:text-blue-400";
};

const getBackgroundColor = (type: string) => {
  if (type === "no-matches") {
    return "from-gray-100 to-gray-200 dark:from-gray-800/30 dark:to-gray-700/30";
  }
  if (type === "error") {
    return "from-red-100 to-red-200 dark:from-red-900/30 dark:to-red-800/30";
  }
  return "from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30";
};

export default function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  secondaryAction,
  type = "empty",
}: EmptyStateProps) {
  const IconToDisplay = type === "no-matches" ? SearchX : Icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="text-center py-16"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{
          duration: 0.5,
          delay: 0.2,
          type: "spring",
          stiffness: 200,
        }}
        className={`w-24 h-24 bg-gradient-to-br ${getBackgroundColor(type)} rounded-full flex items-center justify-center mx-auto mb-6`}
      >
        <IconToDisplay className={`w-12 h-12 ${getIconColor(type)}`} />
      </motion.div>

      <motion.h3
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="text-2xl font-semibold text-gray-700 dark:text-gray-300 mb-3"
      >
        {title}
      </motion.h3>

      {description && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="text-gray-500 dark:text-gray-400 mb-8 max-w-md mx-auto"
        >
          {description}
        </motion.p>
      )}

      {(action || secondaryAction) && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="flex items-center justify-center gap-3"
        >
          {secondaryAction && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={secondaryAction.onClick}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
            >
              {secondaryAction.label}
            </motion.button>
          )}
          {action && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={action.onClick}
              className={`inline-flex items-center gap-2 px-6 py-3 font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 ${
                action.variant === "secondary"
                  ? "bg-gray-600 hover:bg-gray-700 text-white focus:ring-gray-500"
                  : "bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500"
              }`}
            >
              {action.label === "Refresh" && <RefreshCw className="w-4 h-4" />}
              {action.label}
            </motion.button>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}
