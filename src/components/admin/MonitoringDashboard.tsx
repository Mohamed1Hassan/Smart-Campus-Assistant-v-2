"use client";
/**
 * Monitoring Dashboard Component
 * Real-time monitoring of system performance, logs, and metrics
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Cpu,
  HardDrive,
  MemoryStick,
  Network,
  RefreshCw,
  Server,
  Users,
  Zap,
  ChevronRight,
  Monitor,
  Database,
  Globe,
  Loader2,
  Clock,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { apiClient } from "@/services/api";

interface SystemMetrics {
  cpu: {
    usage: number;
    cores: number;
    loadAverage: number[];
  };
  memory: {
    used: number;
    total: number;
    free: number;
    percentage: number;
  };
  disk: {
    used: number;
    total: number;
    free: number;
    percentage: number;
  };
  network: {
    bytesIn: number;
    bytesOut: number;
    packetsIn: number;
    packetsOut: number;
  };
  uptime: number;
  timestamp: string;
}

interface ApplicationMetrics {
  requests: {
    total: number;
    successful: number;
    failed: number;
    averageResponseTime: number;
  };
  users: {
    active: number;
    total: number;
    newToday: number;
  };
  errors: {
    total: number;
    last24h: number;
    critical: number;
  };
  performance: {
    slowQueries: number;
    cacheHitRate: number;
    memoryLeaks: number;
  };
}

interface LogEntry {
  id: string;
  timestamp: string;
  level: "ERROR" | "WARN" | "INFO" | "DEBUG";
  message: string;
  source: string;
  userId?: string;
  metadata?: Record<string, unknown>;
}

const MonitoringDashboard: React.FC = () => {
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics | null>(
    null,
  );
  const [appMetrics, setAppMetrics] = useState<ApplicationMetrics | null>(null);
  const [recentLogs, setRecentLogs] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false); // Start as false, set to true in fetchAllMetrics
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(5000);
  const [selectedTab, setSelectedTab] = useState<
    "overview" | "logs" | "performance" | "errors"
  >("overview");

  // Fetch metrics using apiClient
  const fetchSystemMetrics = useCallback(async () => {
    try {
      const result = await apiClient.get<SystemMetrics>("/admin/metrics/system");
      if (result.success && result.data) {
        setSystemMetrics(result.data);
      }
    } catch (error) {
      console.error("Failed to fetch system metrics:", error);
    }
  }, []);

  const fetchAppMetrics = useCallback(async () => {
    try {
      const result = await apiClient.get<ApplicationMetrics>("/admin/metrics/application");
      if (result.success && result.data) {
        setAppMetrics(result.data);
      }
    } catch (error) {
      console.error("Failed to fetch application metrics:", error);
    }
  }, []);

  const fetchRecentLogs = useCallback(async () => {
    try {
      const result = await apiClient.get<LogEntry[]>("/admin/logs/recent");
      if (result.success && result.data) {
        setRecentLogs(result.data);
      }
    } catch (error) {
      console.error("Failed to fetch recent logs:", error);
    }
  }, []);

  // Fetch all metrics
  const fetchAllMetrics = useCallback(async () => {
    setIsLoading(true);
    await Promise.all([
      fetchSystemMetrics(),
      fetchAppMetrics(),
      fetchRecentLogs(),
    ]);
    setIsLoading(false);
  }, [fetchSystemMetrics, fetchAppMetrics, fetchRecentLogs]);

  // Auto-refresh effect
  useEffect(() => {
    const initialFetch = async () => {
      await fetchAllMetrics();
    };
    initialFetch();

    if (autoRefresh) {
      const interval = setInterval(fetchAllMetrics, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchAllMetrics, autoRefresh, refreshInterval]);

  // Format bytes
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // Format uptime
  const formatUptime = (seconds: number): string => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  // Get log level color
  const getLogLevelColor = (level: string): string => {
    switch (level) {
      case "ERROR":
        return "text-red-600 bg-red-100";
      case "WARN":
        return "text-yellow-600 bg-yellow-100";
      case "INFO":
        return "text-blue-600 bg-blue-100";
      case "DEBUG":
        return "text-gray-600 bg-gray-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  // Get status color based on percenTage
  const getStatusColor = (percenTage: number): string => {
    if (percenTage >= 90) return "text-red-600";
    if (percenTage >= 75) return "text-yellow-600";
    return "text-green-600";
  };

  return (
    <div className="min-h-full bg-transparent p-0 lg:p-4">
      <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* Header Section */}
        <div className="bg-white/40 backdrop-blur-xl border border-white/40 rounded-[2.5rem] p-8 shadow-sm">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-3xl bg-blue-600 flex items-center justify-center text-white shadow-xl shadow-blue-500/20">
                <Monitor className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-3xl font-black text-gray-900 tracking-tight">
                  System Guard
                </h1>
                <p className="text-gray-500 font-medium text-sm">
                  Real-time infrastructure and application health monitoring
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4 bg-white/50 p-2 rounded-[2rem] border border-white/60">
              <div className="flex items-center gap-3 px-4 py-2 bg-white rounded-2xl shadow-sm border border-gray-100">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">
                  Live Feed
                </span>
                <div className={`w-2 h-2 rounded-full ${autoRefresh ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </div>

              <select
                value={refreshInterval}
                onChange={(e) => setRefreshInterval(Number(e.target.value))}
                className="bg-white px-4 py-2 rounded-2xl border border-gray-100 text-[10px] font-black uppercase tracking-widest outline-none focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer"
              >
                <option value={5000}>5s REFRESH</option>
                <option value={10000}>10s REFRESH</option>
                <option value={30000}>30s REFRESH</option>
              </select>

              <button
                onClick={fetchAllMetrics}
                disabled={isLoading}
                className="flex items-center gap-2 px-6 py-2.5 bg-gray-900 hover:bg-black text-white font-black rounded-2xl shadow-xl shadow-gray-900/10 transition-all active:scale-95 disabled:opacity-50 text-[10px] uppercase tracking-widest"
              >
                {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                Refresh Now
              </button>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 p-1.5 bg-gray-100/50 rounded-[2rem] w-fit border border-gray-200/50 backdrop-blur-md">
          {[
            { id: "overview", label: "Overview", icon: BarChart3, color: "blue" },
            { id: "logs", label: "Event Logs", icon: Activity, color: "violet" },
            { id: "performance", label: "Speed", icon: Zap, color: "amber" },
            { id: "errors", label: "Incidents", icon: AlertTriangle, color: "rose" },
          ].map(({ id, label, icon: Icon, color }) => (
            <button
              key={id}
              onClick={() => setSelectedTab(id as any)}
              className={`flex items-center gap-2.5 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all duration-300 ${
                selectedTab === id
                  ? `bg-white text-${color}-600 shadow-lg shadow-black/5 scale-100 ring-1 ring-black/5`
                  : "text-gray-400 hover:text-gray-600 hover:bg-white/50"
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${selectedTab === id ? `text-${color}-600` : ""}`} />
              {label}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {selectedTab === "overview" && (
          <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
            {/* System Metrics */}
            {systemMetrics && (
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gray-900 flex items-center justify-center text-white">
                    <Server className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-gray-900 tracking-tight">Infrastructure</h2>
                    <p className="text-gray-500 text-xs font-medium uppercase tracking-wider">Node Server & HW Utilization</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <MetricCard
                    title="CPU Usage"
                    value={`${systemMetrics.cpu.usage.toFixed(1)}%`}
                    subtitle={`${systemMetrics.cpu.cores} Physical Cores`}
                    icon={<Cpu className="w-5 h-5" />}
                    color="blue"
                    percentage={systemMetrics.cpu.usage}
                  />
                  <MetricCard
                    title="Memory"
                    value={`${systemMetrics.memory.percentage.toFixed(1)}%`}
                    subtitle={`${formatBytes(systemMetrics.memory.used)} / ${formatBytes(systemMetrics.memory.total)}`}
                    icon={<MemoryStick className="w-5 h-5" />}
                    color="green"
                    percentage={systemMetrics.memory.percentage}
                  />
                  <MetricCard
                    title="Disk Space"
                    value={`${systemMetrics.disk.percentage.toFixed(1)}%`}
                    subtitle={`${formatBytes(systemMetrics.disk.used)} Used`}
                    icon={<HardDrive className="w-5 h-5" />}
                    color="purple"
                    percentage={systemMetrics.disk.percentage}
                  />
                  <MetricCard
                    title="System Uptime"
                    value={formatUptime(systemMetrics.uptime)}
                    subtitle={`Last boot: ${new Date(systemMetrics.timestamp).toLocaleDateString()}`}
                    icon={<Activity className="w-5 h-5" />}
                    color="amber"
                  />
                </div>
              </div>
            )}

            {/* Application Metrics */}
            {appMetrics && (
              <div className="space-y-6 pt-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white">
                    <Database className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-gray-900 tracking-tight">Application Logic</h2>
                    <p className="text-gray-500 text-xs font-medium uppercase tracking-wider">API Traffic & User Activity</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <MetricCard
                    title="API Requests"
                    value={appMetrics.requests.total.toLocaleString()}
                    subtitle={`${appMetrics.requests.successful} OK • ${appMetrics.requests.failed} ERR`}
                    icon={<Globe className="w-5 h-5" />}
                    color="blue"
                  />
                  <MetricCard
                    title="Active Users"
                    value={appMetrics.users.active.toString()}
                    subtitle={`${appMetrics.users.total} Registered Total`}
                    icon={<Users className="w-5 h-5" />}
                    color="indigo"
                  />
                  <MetricCard
                    title="Critical Errors"
                    value={appMetrics.errors.critical.toString()}
                    subtitle={`${appMetrics.errors.total} Total Incidents`}
                    icon={<AlertTriangle className="w-5 h-5" />}
                    color="rose"
                    alert={appMetrics.errors.critical > 0}
                  />
                  <MetricCard
                    title="Response Time"
                    value={`${appMetrics.requests.averageResponseTime.toFixed(0)}ms`}
                    subtitle={`${appMetrics.performance.slowQueries} Slow Queries`}
                    icon={<Zap className="w-5 h-5" />}
                    color="amber"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Logs Tab */}
        {selectedTab === "logs" && (
          <div className="bg-gray-950 rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/5 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
                <div className="w-3 h-3 rounded-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
                <div className="w-3 h-3 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                <span className="ml-4 text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">system.journal.v1</span>
              </div>
              <Activity className="w-4 h-4 text-white/20" />
            </div>

            <div className="max-h-[500px] overflow-y-auto custom-scrollbar p-6 space-y-2 font-mono text-[11px] leading-relaxed">
              {recentLogs && recentLogs.length > 0 ? (
                recentLogs.map((log) => (
                  <div key={log.id} className="group flex items-start gap-4 p-2 rounded-lg hover:bg-white/[0.03] transition-colors text-left uppercase">
                    <span className="text-white/20 shrink-0 select-none">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-tighter shrink-0 ${
                      log.level === 'ERROR' ? 'bg-red-500/10 text-red-500 border border-red-500/20' :
                      log.level === 'WARN' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
                      'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                    }`}>
                      {log.level}
                    </span>
                    <div className="flex-1">
                      <span className="text-blue-400 font-bold mr-2">@{log.source.replace('/api/admin/', '')}</span>
                      <span className="text-gray-300">{log.message}</span>
                      {log.userId && <span className="text-indigo-400 ml-2 font-bold opacity-50 underline decoration-indigo-400/30">u:{log.userId}</span>}
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-20 text-center space-y-4">
                  <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto border border-white/10">
                    <Clock className="w-8 h-8 text-white/20 animate-pulse" />
                  </div>
                  <p className="text-white/40 font-black text-[10px] uppercase tracking-widest leading-none mt-4">
                    Waiting for log stream...
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Performance & Error Placeholders */}
        {(selectedTab === "performance" || selectedTab === "errors") && (
          <div className="h-96 flex flex-col items-center justify-center text-center bg-white/40 backdrop-blur-md rounded-[3rem] border border-white/40 shadow-sm animate-in zoom-in-95 duration-500">
            <div className="w-24 h-24 bg-white/80 rounded-[2rem] flex items-center justify-center shadow-xl shadow-black/5 mb-8 border border-white/60">
              {selectedTab === "performance" ? <Zap className="w-10 h-10 text-amber-500" /> : <AlertTriangle className="w-10 h-10 text-rose-500" />}
            </div>
            <h3 className="text-2xl font-black text-gray-900 tracking-tight mb-2">
              Advanced Analytics Pending
            </h3>
            <p className="text-gray-500 max-w-sm font-medium text-sm leading-relaxed">
              We are currently finalizing the high-frequency data pipeline for {selectedTab === "performance" ? "real-time profiling" : "incident forensic"} modules.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

function MetricCard({ 
  title, 
  value, 
  subtitle, 
  icon, 
  color, 
  percentage, 
  alert 
}: { 
  title: string; 
  value: string; 
  subtitle: string; 
  icon: React.ReactNode; 
  color: string;
  percentage?: number;
  alert?: boolean;
}) {
  const colorMap: Record<string, string> = {
    blue: "from-blue-500/10 to-indigo-500/10 text-blue-600 border-blue-100 bg-blue-100",
    green: "from-emerald-500/10 to-teal-500/10 text-emerald-600 border-emerald-100 bg-emerald-100",
    purple: "from-purple-500/10 to-violet-500/10 text-purple-600 border-purple-100 bg-purple-100",
    amber: "from-amber-500/10 to-orange-500/10 text-amber-600 border-amber-100 bg-amber-100",
    rose: "from-rose-500/10 to-red-500/10 text-rose-600 border-rose-100 bg-rose-100",
    indigo: "from-indigo-500/10 to-blue-500/10 text-indigo-600 border-indigo-100 bg-indigo-100",
  };

  const currentStyles = colorMap[color] || colorMap.blue;
  const stylesArr = currentStyles.split(" ");

  return (
    <motion.div
      whileHover={{ y: -8, scale: 1.02 }}
      className={`p-6 rounded-[2rem] border bg-gradient-to-br ${stylesArr[0]} ${stylesArr[1]} ${stylesArr[3]} relative overflow-hidden backdrop-blur-sm transition-all duration-300`}
    >
      {alert && (
        <div className="absolute top-0 right-0 w-3 h-3 rounded-full bg-rose-500 mt-5 mr-5 shadow-[0_0_12px_rgba(244,63,94,0.6)]">
          <div className="absolute inset-0 rounded-full bg-rose-500 animate-ping opacity-75"></div>
        </div>
      )}

      <div className="flex items-center justify-between mb-5">
        <div className={`w-12 h-12 rounded-2xl ${stylesArr[4]} flex items-center justify-center shadow-lg shadow-black/5 ${stylesArr[2]}`}>
          {icon}
        </div>
        {percentage !== undefined && (
          <div className="text-[10px] font-black text-gray-800 px-2 py-1 bg-white/40 border border-white/20 rounded-lg uppercase tracking-wider backdrop-blur-sm">
            LEVEL: {percentage.toFixed(0)}%
          </div>
        )}
      </div>

      <div>
        <h4 className="text-gray-600 text-[10px] font-black uppercase tracking-[0.2em] mb-1 opacity-60">
          {title}
        </h4>
        <div className="text-3xl font-black text-gray-900 tracking-tighter">
          {value}
        </div>
        <p className="text-[10px] font-bold text-gray-400 mt-2 truncate">
          {subtitle}
        </p>
      </div>

      {percentage !== undefined && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-100/30">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className={`h-full ${color === 'rose' ? 'bg-rose-500' : 'bg-blue-600'}`} 
          />
        </div>
      )}
    </motion.div>
  );
}

export default MonitoringDashboard;
