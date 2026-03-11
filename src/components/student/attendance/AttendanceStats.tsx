import { motion } from "framer-motion";
import {
  CheckCircle,
  XCircle,
  BookOpen,
  Clock,
  AlertCircle,
} from "lucide-react";
import { AttendanceStats as AttendanceStatsType } from "../../../data/attendanceData";
import EmptyState from "../../common/EmptyState";

interface AttendanceStatsProps {
  stats: AttendanceStatsType | null;
  loading?: boolean;
  error?: string | null;
}

// Loading skeleton component
const LoadingSkeleton = () => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
    {[1, 2, 3, 4].map((index) => (
      <motion.div
        key={index}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: index * 0.1 }}
        className="bg-gray-100 dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
          <div className="w-3 h-3 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
        </div>
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        </div>
      </motion.div>
    ))}
  </div>
);

// Error state component
const ErrorState = ({ error }: { error: string | null }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start gap-3"
  >
    <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
    <div>
      <p className="text-sm text-red-800 dark:text-red-200 font-medium">
        Failed to load attendance statistics
      </p>
      <p className="text-xs text-red-700 dark:text-red-300 mt-1">
        {error ||
          "Please try refreshing the page or contact support if the issue persists."}
      </p>
    </div>
  </motion.div>
);

export default function AttendanceStats({
  stats,
  loading = false,
  error = null,
}: AttendanceStatsProps) {
  // Empty state handled by EmptyState component

  // Show loading state
  if (loading) {
    return <LoadingSkeleton />;
  }

  // Show error state
  if (error) {
    return <ErrorState error={error} />;
  }

  // Show empty state
  if (!stats) {
    return (
      <EmptyState
        icon={BookOpen}
        title="No Attendance Data"
        description="No attendance records found. Your attendance statistics will appear here once you start attending classes."
      />
    );
  }

  const statItems = [
    {
      title: "Overall Attendance",
      value: stats.overallAttendance,
      suffix: "%",
      icon: CheckCircle,
      color: "from-green-500 to-green-600",
      bgColor: "bg-green-50 dark:bg-green-900/20",
      textColor: "text-green-700 dark:text-green-300",
      delay: 0.1,
    },
    {
      title: "Missed Classes",
      value: stats.missedClasses,
      suffix: "",
      icon: XCircle,
      color: "from-red-500 to-red-600",
      bgColor: "bg-red-50 dark:bg-red-900/20",
      textColor: "text-red-700 dark:text-red-300",
      delay: 0.2,
    },
    {
      title: "Total Classes",
      value: stats.totalClasses,
      suffix: "",
      icon: BookOpen,
      color: "from-blue-500 to-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-900/20",
      textColor: "text-blue-700 dark:text-blue-300",
      delay: 0.3,
    },
    {
      title: "Late Classes",
      value: stats.lateClasses,
      suffix: "",
      icon: Clock,
      color: "from-orange-500 to-orange-600",
      bgColor: "bg-orange-50 dark:bg-orange-900/20",
      textColor: "text-orange-700 dark:text-orange-300",
      delay: 0.4,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {statItems.map((item) => {
        const Icon = item.icon;
        return (
          <motion.div
            key={item.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: item.delay }}
            whileHover={{
              scale: 1.05,
              transition: { duration: 0.2 },
            }}
            className={`${item.bgColor} rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300 cursor-pointer`}
          >
            <div className="flex items-center justify-between mb-4">
              <div
                className={`p-3 rounded-xl bg-gradient-to-r ${item.color} shadow-lg`}
              >
                <Icon className="w-6 h-6 text-white" />
              </div>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{
                  delay: item.delay + 0.3,
                  type: "spring",
                  stiffness: 200,
                }}
                className={`w-3 h-3 rounded-full bg-gradient-to-r ${item.color}`}
              />
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-600 dark:text-mutedDark">
                {item.title}
              </h3>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: item.delay + 0.5 }}
                className="flex items-baseline gap-1"
              >
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{
                    delay: item.delay + 0.6,
                    type: "spring",
                    stiffness: 200,
                  }}
                  className={`text-3xl font-bold ${item.textColor}`}
                >
                  {item.value}
                </motion.span>
                <span className={`text-lg font-semibold ${item.textColor}`}>
                  {item.suffix}
                </span>
              </motion.div>
            </div>

            {/* Progress bar for overall attendance */}
            {item.title === "Overall Attendance" && (
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${stats.overallAttendance}%` }}
                transition={{
                  delay: item.delay + 0.8,
                  duration: 1,
                  ease: "easeOut",
                }}
                className="mt-4 h-2 bg-white dark:bg-gray-800 rounded-full overflow-hidden"
              >
                <div
                  className={`h-full bg-gradient-to-r ${item.color} rounded-full`}
                />
              </motion.div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
