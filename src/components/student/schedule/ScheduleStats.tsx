import { motion } from "framer-motion";
import { Calendar, Clock, BookOpen, CheckCircle } from "lucide-react";
import { ScheduleClass } from "../../../data/scheduleData";

interface ScheduleStatsProps {
  classes: ScheduleClass[];
  currentDay: string;
}

export default function ScheduleStats({
  classes,
  currentDay,
}: ScheduleStatsProps) {
  const stats = {
    totalClasses: classes.length,
    todayClasses: classes.filter((c) => c.day === currentDay).length,
    upcomingClasses: classes.filter((c) => c.status === "upcoming").length,
    completedClasses: classes.filter((c) => c.status === "completed").length,
  };

  const statItems = [
    {
      label: "Total Classes",
      value: stats.totalClasses,
      icon: BookOpen,
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-500/10",
      border: "border-blue-200/50 dark:border-blue-700/30",
      delay: 0.1,
    },
    {
      label: "Today's Classes",
      value: stats.todayClasses,
      icon: Calendar,
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-500/10",
      border: "border-emerald-200/50 dark:border-emerald-700/30",
      delay: 0.2,
    },
    {
      label: "Upcoming",
      value: stats.upcomingClasses,
      icon: Clock,
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-500/10",
      border: "border-amber-200/50 dark:border-amber-700/30",
      delay: 0.3,
    },
    {
      label: "Completed",
      value: stats.completedClasses,
      icon: CheckCircle,
      color: "text-violet-600 dark:text-violet-400",
      bg: "bg-violet-500/10",
      border: "border-violet-200/50 dark:border-violet-700/30",
      delay: 0.4,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {statItems.map((item) => {
        const Icon = item.icon;
        return (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: item.delay }}
            className="group relative overflow-hidden bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/20 dark:border-gray-700/30 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
          >
            <div
              className={`absolute top-0 right-0 w-32 h-32 ${item.bg} rounded-full blur-3xl -mr-16 -mt-16 transition-transform duration-500 group-hover:scale-110`}
            />

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div
                  className={`p-3 rounded-xl ${item.bg} backdrop-blur-sm border ${item.border}`}
                >
                  <Icon className={`w-6 h-6 ${item.color}`} />
                </div>
              </div>
              <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-1 tracking-tight">
                {item.value}
              </h3>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                {item.label}
              </p>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
