import { motion } from "framer-motion";
import {
  FileText,
  Upload,
  MessageSquare,
  CheckCircle,
  Clock,
} from "lucide-react";

interface ActivityItem {
  id: string;
  type: "submission" | "upload" | "message" | "completed" | "pending";
  student: string;
  action: string;
  course: string;
  timestamp: string;
}

interface ActivityFeedProps {
  activities: ActivityItem[];
  searchTerm?: string;
}

const activityConfig = {
  submission: {
    icon: FileText,
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-50 dark:bg-blue-900/20",
  },
  upload: {
    icon: Upload,
    color: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-50 dark:bg-green-900/20",
  },
  message: {
    icon: MessageSquare,
    color: "text-purple-600 dark:text-purple-400",
    bgColor: "bg-purple-50 dark:bg-purple-900/20",
  },
  completed: {
    icon: CheckCircle,
    color: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-50 dark:bg-green-900/20",
  },
  pending: {
    icon: Clock,
    color: "text-orange-600 dark:text-orange-400",
    bgColor: "bg-orange-50 dark:bg-orange-900/20",
  },
};

export default function ActivityFeed({
  activities,
  searchTerm = "",
}: ActivityFeedProps) {
  const filteredActivities = activities.filter((activity) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      activity.student.toLowerCase().includes(searchLower) ||
      activity.course.toLowerCase().includes(searchLower) ||
      activity.action.toLowerCase().includes(searchLower)
    );
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="bg-white dark:bg-cardDark rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6"
      role="region"
      aria-labelledby="activity-feed-heading"
    >
      <h3
        id="activity-feed-heading"
        className="text-lg font-semibold text-gray-900 dark:text-textDark mb-6"
      >
        Recent Activity
      </h3>

      {filteredActivities.length === 0 ? (
        <div className="text-center py-12" role="status" aria-live="polite">
          <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
          <p className="text-gray-500 dark:text-gray-400 mb-2">
            No recent activity
          </p>
          {searchTerm && (
            <p className="text-sm text-gray-400 dark:text-gray-500">
              Try adjusting your search
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-4 max-h-96 overflow-y-auto dashboard-scroll">
          {filteredActivities.map((activity, index) => {
            const activityInfo = activityConfig[activity.type];
            const ActivityIcon = activityInfo.icon;

            return (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.5 + index * 0.1 }}
                className="flex items-start gap-4 p-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors duration-200"
              >
                <div
                  className={`p-2 rounded-lg ${activityInfo.bgColor} ${activityInfo.color}`}
                >
                  <ActivityIcon className="w-4 h-4" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-gray-900 dark:text-textDark">
                      {activity.student}
                    </span>
                    <span className="text-gray-600 dark:text-mutedDark">
                      {activity.action}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-mutedDark mb-1">
                    {activity.course}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {activity.timestamp}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
