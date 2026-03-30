"use client";
import { motion } from "framer-motion";
import { Bell, RefreshCw, SearchX, X } from "lucide-react";

interface EmptyStateProps {
  onRefresh: () => void;
  type?: "empty" | "no-matches";
  onClearFilters?: () => void;
}

export default function EmptyState({
  onRefresh,
  type = "empty",
  onClearFilters,
}: EmptyStateProps) {
  if (type === "no-matches") {
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
          className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800/30 dark:to-gray-700/30 rounded-full flex items-center justify-center mx-auto mb-6"
        >
          <SearchX className="w-12 h-12 text-gray-400 dark:text-gray-500" />
        </motion.div>

        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
          No notifications match your filters
        </h2>

        <p className="text-gray-800 dark:text-gray-200 mb-8 max-w-md mx-auto font-medium">
          Try adjusting your search or filter settings to see more
          notifications.
        </p>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="flex items-center justify-center gap-3"
        >
          {onClearFilters && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onClearFilters}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
            >
              <X className="w-4 h-4" />
              Clear Filters
            </motion.button>
          )}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onRefresh}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </motion.button>
        </motion.div>
      </motion.div>
    );
  }

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
        className="w-24 h-24 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30 rounded-full flex items-center justify-center mx-auto mb-6"
      >
        <Bell className="w-12 h-12 text-blue-600 dark:text-blue-400" />
      </motion.div>

      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
        No new notifications 🥳
      </h2>

      <p className="text-gray-800 dark:text-gray-200 mb-8 max-w-md mx-auto font-medium">
        You&apos;re all caught up! When you receive new notifications about
        student submissions, messages, or system updates, they&apos;ll appear
        here.
      </p>

      <motion.button
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onRefresh}
        className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
      >
        <RefreshCw className="w-4 h-4" />
        Refresh
      </motion.button>
    </motion.div>
  );
}
