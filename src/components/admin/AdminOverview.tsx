import React, { useEffect, useState } from "react";
import {
  Users,
  BookOpen,
  ShieldAlert,
  Activity,
  TrendingUp,
  UserCheck,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { motion } from "framer-motion";
import { apiClient } from "@/services/api";

interface AdminStats {
  totalStudents: number;
  studentTrend: string;
  activeCourses: number;
  avgAttendance: number;
  attendanceTrend: string;
  recentAlertsCount: number;
  recentProfessorsCount: number;
  activityFeed: Array<{
    id: string;
    type: string;
    title: string;
    description: string;
    time: string;
  }>;
}

export default function AdminOverview({
  onTabChange,
}: {
  onTabChange?: (tab: "users" | "courses" | "security" | "settings") => void;
}) {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const result = await apiClient.get<AdminStats>("/admin/stats");
        if (result.success && result.data) {
          setStats(result.data);
        }
      } catch (error) {
        console.error("Failed to fetch stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Students"
          value={stats?.totalStudents?.toLocaleString() || "0"}
          trend={stats?.studentTrend || "0%"}
          icon={<Users className="w-6 h-6 text-blue-600" />}
          color="bg-blue-50 border-blue-100"
        />
        <StatCard
          title="Active Courses"
          value={stats?.activeCourses?.toString() || "0"}
          trend="In current term"
          icon={<BookOpen className="w-6 h-6 text-indigo-600" />}
          color="bg-indigo-50 border-indigo-100"
        />
        <StatCard
          title="Avg. Attendance"
          value={`${stats?.avgAttendance ?? 0}%`}
          trend={stats?.attendanceTrend || "Steady"}
          icon={<Activity className="w-6 h-6 text-green-600" />}
          color="bg-green-50 border-green-100"
        />
        <StatCard
          title="Fraud Alerts"
          value={stats?.recentAlertsCount?.toString() || "0"}
          trend="Requires review"
          icon={<ShieldAlert className="w-6 h-6 text-red-600" />}
          color="bg-red-50 border-red-100"
          alert={stats ? stats.recentAlertsCount > 0 : false}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-gray-900 text-lg">
              System Activity Overview
            </h3>
            <span className="text-xs font-semibold px-2 py-1 bg-blue-50 text-blue-600 rounded-full uppercase tracking-wider">
              Live Feed
            </span>
          </div>

          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 dashboard-scroll">
            {stats?.activityFeed && stats.activityFeed.length > 0 ? (
              stats.activityFeed.map(
                (activity: {
                  id: string;
                  type: string;
                  title: string;
                  description: string;
                  time: string;
                }) => (
                  <ActivityItem
                    key={activity.id}
                    type={activity.type}
                    title={activity.title}
                    description={activity.description}
                    time={new Date(activity.time).toLocaleString()}
                  />
                ),
              )
            ) : (
              <div className="h-64 flex flex-col items-center justify-center border-2 border-dashed border-gray-100 rounded-xl bg-gray-50/50">
                <TrendingUp className="w-8 h-8 text-gray-300 mb-2" />
                <p className="text-gray-500 text-sm">
                  No recent activity found.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-bl-full -z-10 opacity-50"></div>
          <h3 className="font-bold text-gray-900 text-lg mb-4">
            Quick Actions
          </h3>
          <div className="space-y-3">
            <QuickAction
              icon={<UserCheck className="w-5 h-5" />}
              title="Review New Professors"
              subtitle={`${stats?.recentProfessorsCount || 0} joined recently`}
              color="text-indigo-600 bg-indigo-50"
              onClick={() => onTabChange?.("users")}
            />
            <QuickAction
              icon={<AlertTriangle className="w-5 h-5" />}
              title="Review Fraud Alerts"
              subtitle={`${stats?.recentAlertsCount || 0} pending review`}
              color="text-red-600 bg-red-50"
              onClick={() => onTabChange?.("security")}
            />
            <QuickAction
              icon={<BookOpen className="w-5 h-5" />}
              title="Course Overrides"
              subtitle="Manage assigned professors"
              color="text-emerald-600 bg-emerald-50"
              onClick={() => onTabChange?.("courses")}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  trend,
  icon,
  color,
  alert,
}: {
  title: string;
  value: string;
  trend: string;
  icon: React.ReactNode;
  color: string;
  alert?: boolean;
}) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      className={`p-6 rounded-2xl border ${color} relative overflow-hidden`}
    >
      {alert && (
        <div className="absolute top-0 right-0 w-2 h-2 rounded-full bg-red-500 mt-4 mr-4 animate-ping"></div>
      )}
      {alert && (
        <div className="absolute top-0 right-0 w-2 h-2 rounded-full bg-red-500 mt-4 mr-4"></div>
      )}

      <div className="flex items-center justify-between mb-4">
        <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center border border-black/5">
          {icon}
        </div>
        <span className="text-sm font-semibold text-gray-600 px-2.5 py-1 bg-white/60 rounded-full border border-black/5">
          {trend}
        </span>
      </div>
      <div>
        <h4 className="text-gray-500 text-sm font-medium mb-1">{title}</h4>
        <div className="text-3xl font-bold text-gray-900">{value}</div>
      </div>
    </motion.div>
  );
}

function QuickAction({
  icon,
  title,
  subtitle,
  color,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  color: string;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100 group text-left"
    >
      <div
        className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${color}`}
      >
        {icon}
      </div>
      <div>
        <h5 className="font-semibold text-sm text-gray-900 group-hover:text-blue-600 transition-colors">
          {title}
        </h5>
        <p className="text-xs text-gray-500">{subtitle}</p>
      </div>
    </button>
  );
}

function ActivityItem({
  type,
  title,
  description,
  time,
}: {
  type: string;
  title: string;
  description: string;
  time: string;
}) {
  const getIcon = () => {
    switch (type) {
      case "USER":
        return <UserCheck className="w-4 h-4 text-blue-600" />;
      case "COURSE":
        return <BookOpen className="w-4 h-4 text-emerald-600" />;
      case "ALERT":
        return <ShieldAlert className="w-4 h-4 text-red-600" />;
      default:
        return <Activity className="w-4 h-4 text-gray-600" />;
    }
  };

  const getBg = () => {
    switch (type) {
      case "USER":
        return "bg-blue-50";
      case "COURSE":
        return "bg-emerald-50";
      case "ALERT":
        return "bg-red-50";
      default:
        return "bg-gray-50";
    }
  };

  return (
    <div className="flex items-start gap-4 p-3 rounded-xl hover:bg-gray-50/80 transition-colors group border border-transparent hover:border-gray-100">
      <div
        className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${getBg()}`}
      >
        {getIcon()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <h5 className="font-semibold text-sm text-gray-900 truncate">
            {title}
          </h5>
          <span className="text-[10px] font-medium text-gray-400 whitespace-nowrap">
            {time}
          </span>
        </div>
        <p className="text-xs text-gray-500 truncate">{description}</p>
      </div>
    </div>
  );
}
