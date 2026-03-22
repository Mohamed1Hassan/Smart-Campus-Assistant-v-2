"use client";

import React from "react";
import { motion } from "framer-motion";
import { CheckCircle, Clock, XCircle, AlertCircle } from "lucide-react";

interface AttendanceStats {
  overallAttendance: number;
  totalClasses: number;
  attendedClasses: number;
  missedClasses: number;
  lateClasses: number;
}

interface StatsOverviewProps {
  stats: AttendanceStats;
}

const StatsOverview = ({ stats }: StatsOverviewProps) => {
  const statItems = [
    {
      label: "Overall Attendance",
      value: `${stats.overallAttendance}%`,
      icon: CheckCircle,
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-50/50 dark:bg-emerald-900/20",
      border: "border-emerald-100 dark:border-emerald-900/30",
    },
    {
      label: "Total Classes",
      value: stats.totalClasses,
      icon: Clock,
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-50/50 dark:bg-blue-900/20",
      border: "border-blue-100 dark:border-blue-900/30",
    },
    {
      label: "Missed Classes",
      value: stats.missedClasses,
      icon: XCircle,
      color: "text-red-600 dark:text-red-400",
      bg: "bg-red-50/50 dark:bg-red-900/20",
      border: "border-red-100 dark:border-red-900/30",
    },
    {
      label: "Late Classes",
      value: stats.lateClasses,
      icon: AlertCircle,
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-50/50 dark:bg-amber-900/20",
      border: "border-amber-100 dark:border-amber-900/30",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 mb-8">
      {statItems.map((stat, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ y: -5, scale: 1.02 }}
          transition={{ duration: 0.3, delay: index * 0.1 }}
          className={`group relative overflow-hidden rounded-3xl p-5 md:p-6 shadow-lg hover:shadow-xl border ${stat.border} bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl transition-all duration-300`}
        >
          {/* Subtle Glow Effect */}
          <div
            className={`absolute top-0 right-0 w-32 h-32 ${stat.bg.split(' ')[0]} rounded-full blur-3xl -mr-16 -mt-16 transition-transform duration-700 group-hover:scale-125 opacity-60 dark:opacity-30`}
          />
          <div className="flex flex-col h-full justify-between relative z-10">
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-2xl ${stat.bg} shadow-sm border border-white/20 dark:border-white/5`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
            </div>
            <div>
              <p className="text-xs md:text-sm font-bold text-gray-500 dark:text-gray-400 mb-1.5 tracking-wide uppercase">
                {stat.label}
              </p>
              <h3 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                {String(stat.value)}
              </h3>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default React.memo(StatsOverview);
