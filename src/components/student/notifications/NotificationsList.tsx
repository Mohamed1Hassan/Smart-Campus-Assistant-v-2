"use client";
import { motion, AnimatePresence } from "framer-motion";
import NotificationCard, { NotificationItem } from "./NotificationCard";
import { FilterType } from "./FilterBar";

interface NotificationGroup {
  label: string;
  items: NotificationItem[];
}

interface NotificationsListProps {
  notifications: NotificationItem[];
  activeFilter: FilterType;
  onToggleRead: (id: string) => void;
  onArchive?: (id: string) => void;
  onSnooze?: (id: string, hours: number) => void;
  onPin?: (id: string) => void;
  onUnpin?: (id: string) => void;
  pinnedIds?: Set<string>;
  getPriority?: (notification: NotificationItem) => "urgent" | "normal" | "low";
  grouped?: NotificationGroup[];
  displayLimit?: number;
  onLoadMore?: () => void;
}

export default function NotificationsList({
  notifications,
  onToggleRead,
  onArchive,
  onSnooze,
  onPin,
  onUnpin,
  pinnedIds = new Set(),
  getPriority,
  grouped,
  displayLimit,
  onLoadMore,
}: NotificationsListProps) {
  // If grouped data is provided, use it; otherwise render flat list
  const hasMore = displayLimit ? notifications.length > displayLimit : false;
  const displayedNotifications = displayLimit
    ? notifications.slice(0, displayLimit)
    : notifications;
  const groupsToRender =
    grouped ||
    (displayedNotifications.length > 0
      ? [{ label: "", items: displayedNotifications }]
      : []);

  if (notifications.length === 0) {
    return null; // Empty state is handled by parent
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="space-y-6"
    >
      <AnimatePresence mode="popLayout">
        {groupsToRender.map((group, groupIndex) => (
          <motion.div
            key={group.label || `group-${groupIndex}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {group.label && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="mb-4"
              >
                <h2 className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                  {group.label}
                </h2>
                <div className="mt-2 border-b border-gray-200 dark:border-gray-700"></div>
              </motion.div>
            )}

            <div className="space-y-4">
              {group.items.map((notification, index) => (
                <motion.div
                  key={notification.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20, scale: 0.95 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <NotificationCard
                    notification={notification}
                    onToggleRead={onToggleRead}
                    onArchive={onArchive}
                    onSnooze={onSnooze}
                    onPin={onPin}
                    onUnpin={onUnpin}
                    isPinned={pinnedIds.has(notification.id)}
                    priority={
                      getPriority
                        ? getPriority(notification)
                        : notification.priority
                    }
                  />
                </motion.div>
              ))}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {hasMore && onLoadMore && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex justify-center mt-6"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onLoadMore}
            className="px-6 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors"
          >
            Load More
          </motion.button>
        </motion.div>
      )}
    </motion.div>
  );
}
