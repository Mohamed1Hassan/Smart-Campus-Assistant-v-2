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
  ChevronRight,
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
          color="from-blue-500/10 to-indigo-500/10 border-blue-100"
          iconBg="bg-blue-100"
        />
        <StatCard
          title="Active Courses"
          value={stats?.activeCourses?.toString() || "0"}
          trend="In current term"
          icon={<BookOpen className="w-6 h-6 text-emerald-600" />}
          color="from-emerald-500/10 to-teal-500/10 border-emerald-100"
          iconBg="bg-emerald-100"
        />
        <StatCard
          title="Avg. Attendance"
          value={`${stats?.avgAttendance ?? 0}%`}
          trend={stats?.attendanceTrend || "Steady"}
          icon={<Activity className="w-6 h-6 text-violet-600" />}
          color="from-violet-500/10 to-purple-500/10 border-violet-100"
          iconBg="bg-violet-100"
        />
        <StatCard
          title="Fraud Alerts"
          value={stats?.recentAlertsCount?.toString() || "0"}
          trend="Requires review"
          icon={<ShieldAlert className="w-6 h-6 text-rose-600" />}
          color="from-rose-500/10 to-red-500/10 border-rose-100"
          alert={stats ? stats.recentAlertsCount > 0 : false}
          iconBg="bg-rose-100"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white/80 backdrop-blur-md rounded-[2.5rem] border border-white/60 shadow-[0_20px_50px_rgba(0,0,0,0.03)] p-10">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-black text-gray-900 text-xl tracking-tight uppercase">
              Operational <span className="text-blue-600">Pulse</span>
            </h3>
            <span className="text-[10px] font-black px-4 py-1.5 bg-blue-50 text-blue-600 rounded-full uppercase tracking-[0.2em] border border-blue-100/50">
              <span className="inline-block w-2 h-2 bg-blue-500 rounded-full animate-pulse mr-2"></span>
              Live Feed
            </span>
          </div>

          <div className="space-y-4 max-h-[450px] overflow-y-auto pr-4 dashboard-scroll">
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
              <div className="h-64 flex flex-col items-center justify-center border-2 border-dashed border-gray-100 rounded-[2rem] bg-gray-50/30">
                <TrendingUp className="w-10 h-10 text-gray-200 mb-3" />
                <p className="text-gray-400 font-bold text-sm tracking-tight">
                  No telemetric activity detected.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-md rounded-[2.5rem] border border-white/60 shadow-[0_20px_50px_rgba(0,0,0,0.03)] p-10 overflow-hidden relative group">
          <div className="absolute top-0 right-0 w-48 h-48 bg-blue-600/5 rounded-bl-full -z-10 transition-transform duration-1000 group-hover:scale-110"></div>
          <h3 className="font-black text-gray-900 text-xl tracking-tight uppercase mb-8">
            Fast <span className="text-blue-600">Track</span>
          </h3>
          <div className="space-y-4">
            <QuickAction
              icon={<UserCheck className="w-6 h-6" />}
              title="Professor Registry"
              subtitle={`${stats?.recentProfessorsCount || 0} New Manifestos`}
              color="text-blue-600 bg-blue-50"
              onClick={() => onTabChange?.("users")}
            />
            <QuickAction
              icon={<AlertTriangle className="w-6 h-6" />}
              title="Security Breach"
              subtitle={`${stats?.recentAlertsCount || 0} Unresolved Cases`}
              color="text-red-600 bg-red-50"
              onClick={() => onTabChange?.("security")}
            />
            <QuickAction
              icon={<BookOpen className="w-6 h-6" />}
              title="Knowledge Graph"
              subtitle="Override Resource Allocation"
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
  iconBg,
  alert,
}: {
  title: string;
  value: string;
  trend: string;
  icon: React.ReactNode;
  color: string;
  iconBg: string;
  alert?: boolean;
}) {
  return (
    <motion.div
      whileHover={{ y: -8 }}
      className={`p-10 rounded-[2.5rem] border bg-gradient-to-br ${color} relative overflow-hidden backdrop-blur-md transition-all duration-500 shadow-[0_20px_50px_rgba(0,0,0,0.02)] hover:shadow-[0_30px_60px_rgba(0,0,0,0.06)]`}
    >
      {alert && (
        <div className="absolute top-0 right-0 w-3 h-3 rounded-full bg-rose-500 mt-5 mr-5 shadow-[0_0_12px_rgba(244,63,94,0.6)]">
          <div className="absolute inset-0 rounded-full bg-rose-500 animate-ping opacity-75"></div>
        </div>
      )}

      <div className="flex items-center justify-between mb-5">
        <div
          className={`w-12 h-12 rounded-2xl ${iconBg} flex items-center justify-center shadow-lg shadow-black/5`}
        >
          {icon}
        </div>
        <span className="text-[10px] font-black text-gray-800 px-2 py-1 bg-white/40 border border-white/20 rounded-lg uppercase tracking-wider backdrop-blur-sm">
          {trend}
        </span>
      </div>
      <div>
        <h4 className="text-gray-600 text-xs font-bold uppercase tracking-widest mb-1.5 opacity-80">
          {title}
        </h4>
        <div className="text-3xl font-black text-gray-900 tracking-tight">
          {value}
        </div>
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
      className="w-full flex items-center gap-4 p-4 rounded-2xl bg-white hover:bg-gray-50 transition-all border border-gray-100 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-500/5 group text-left"
    >
      <div
        className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${color}`}
      >
        {icon}
      </div>
      <div className="flex-1">
        <h5 className="font-bold text-sm text-gray-900 group-hover:text-blue-600 transition-colors">
          {title}
        </h5>
        <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wider mt-0.5">
          {subtitle}
        </p>
      </div>
      <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
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
        return <ShieldAlert className="w-4 h-4 text-rose-600" />;
      default:
        return <Activity className="w-4 h-4 text-violet-600" />;
    }
  };

  const getBg = () => {
    switch (type) {
      case "USER":
        return "bg-blue-50 border-blue-100";
      case "COURSE":
        return "bg-emerald-50 border-emerald-100";
      case "ALERT":
        return "bg-rose-50 border-rose-100";
      default:
        return "bg-violet-50 border-violet-100";
    }
  };

  return (
    <div className="flex items-start gap-4 p-4 rounded-2xl hover:bg-gray-50/50 transition-all group border border-transparent hover:border-gray-100/50">
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${getBg()} shadow-sm`}
      >
        {getIcon()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <h5 className="font-bold text-sm text-gray-900 truncate tracking-tight">
            {title}
          </h5>
          <span className="text-[10px] font-bold text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full whitespace-nowrap uppercase tracking-tighter">
            {time}
          </span>
        </div>
        <p className="text-xs text-gray-500 truncate leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  );
}
