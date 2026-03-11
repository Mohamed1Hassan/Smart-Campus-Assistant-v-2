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
} from "lucide-react";

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

  // Fetch system metrics
  const fetchSystemMetrics = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/metrics/system");
      if (response.ok) {
        const data = await response.json();
        setSystemMetrics(data);
      }
    } catch (error) {
      console.error("Failed to fetch system metrics:", error);
    }
  }, []);

  // Fetch application metrics
  const fetchAppMetrics = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/metrics/application");
      if (response.ok) {
        const data = await response.json();
        setAppMetrics(data);
      }
    } catch (error) {
      console.error("Failed to fetch application metrics:", error);
    }
  }, []);

  // Fetch recent logs
  const fetchRecentLogs = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/logs/recent");
      if (response.ok) {
        const data = await response.json();
        setRecentLogs(data);
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
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Monitoring Dashboard
              </h1>
              <p className="text-gray-600 mt-2">
                Real-time system and application monitoring
              </p>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">
                  Auto Refresh:
                </label>
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="rounded border-gray-300"
                />
              </div>

              <select
                value={refreshInterval}
                onChange={(e) => setRefreshInterval(Number(e.target.value))}
                className="rounded border-gray-300 text-sm"
              >
                <option value={5000}>5 seconds</option>
                <option value={10000}>10 seconds</option>
                <option value={30000}>30 seconds</option>
                <option value={60000}>1 minute</option>
              </select>

              <button
                onClick={fetchAllMetrics}
                disabled={isLoading}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                <RefreshCw
                  className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`}
                />
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <nav className="flex space-x-8">
            {[
              { id: "overview", Tag: "Overview", icon: BarChart3 },
              { id: "logs", Tag: "Logs", icon: Activity },
              { id: "performance", Tag: "Performance", icon: Zap },
              { id: "errors", Tag: "Errors", icon: AlertTriangle },
            ].map(({ id, Tag, icon: Icon }) => (
              <button
                key={id}
                onClick={() =>
                  setSelectedTab(
                    id as "overview" | "logs" | "performance" | "errors",
                  )
                }
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedTab === id
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{Tag}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Overview Tab */}
        {selectedTab === "overview" && (
          <div className="space-y-6">
            {/* System Metrics */}
            {systemMetrics && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                  <Server className="w-5 h-5 mr-2" />
                  System Metrics
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* CPU Usage */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <Cpu className="w-5 h-5 text-blue-600" />
                      <span className="text-sm text-gray-600">CPU Usage</span>
                    </div>
                    <div
                      className={`text-2xl font-bold ${getStatusColor(systemMetrics.cpu.usage)}`}
                    >
                      {systemMetrics.cpu.usage.toFixed(1)}%
                    </div>
                    <div className="text-sm text-gray-600">
                      {systemMetrics.cpu.cores} cores
                    </div>
                  </div>

                  {/* Memory Usage */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <MemoryStick className="w-5 h-5 text-green-600" />
                      <span className="text-sm text-gray-600">Memory</span>
                    </div>
                    <div
                      className={`text-2xl font-bold ${getStatusColor(systemMetrics.memory.percentage)}`}
                    >
                      {systemMetrics.memory.percentage.toFixed(1)}%
                    </div>
                    <div className="text-sm text-gray-600">
                      {formatBytes(systemMetrics.memory.used)} /{" "}
                      {formatBytes(systemMetrics.memory.total)}
                    </div>
                  </div>

                  {/* Disk Usage */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <HardDrive className="w-5 h-5 text-purple-600" />
                      <span className="text-sm text-gray-600">Disk</span>
                    </div>
                    <div
                      className={`text-2xl font-bold ${getStatusColor(systemMetrics.disk.percentage)}`}
                    >
                      {systemMetrics.disk.percentage.toFixed(1)}%
                    </div>
                    <div className="text-sm text-gray-600">
                      {formatBytes(systemMetrics.disk.used)} /{" "}
                      {formatBytes(systemMetrics.disk.total)}
                    </div>
                  </div>

                  {/* Uptime */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <Activity className="w-5 h-5 text-orange-600" />
                      <span className="text-sm text-gray-600">Uptime</span>
                    </div>
                    <div className="text-2xl font-bold text-gray-900">
                      {formatUptime(systemMetrics.uptime)}
                    </div>
                    <div className="text-sm text-gray-600">
                      Last updated:{" "}
                      {new Date(systemMetrics.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Application Metrics */}
            {appMetrics && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                  <BarChart3 className="w-5 h-5 mr-2" />
                  Application Metrics
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* Requests */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <Network className="w-5 h-5 text-blue-600" />
                      <span className="text-sm text-gray-600">Requests</span>
                    </div>
                    <div className="text-2xl font-bold text-gray-900">
                      {appMetrics.requests.total.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600">
                      {appMetrics.requests.successful} successful,{" "}
                      {appMetrics.requests.failed} failed
                    </div>
                  </div>

                  {/* Users */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <Users className="w-5 h-5 text-green-600" />
                      <span className="text-sm text-gray-600">Users</span>
                    </div>
                    <div className="text-2xl font-bold text-gray-900">
                      {appMetrics.users.active}
                    </div>
                    <div className="text-sm text-gray-600">
                      {appMetrics.users.total} total,{" "}
                      {appMetrics.users.newToday} new today
                    </div>
                  </div>

                  {/* Errors */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <AlertTriangle className="w-5 h-5 text-red-600" />
                      <span className="text-sm text-gray-600">Errors</span>
                    </div>
                    <div className="text-2xl font-bold text-red-600">
                      {appMetrics.errors.total}
                    </div>
                    <div className="text-sm text-gray-600">
                      {appMetrics.errors.last24h} last 24h,{" "}
                      {appMetrics.errors.critical} critical
                    </div>
                  </div>

                  {/* Performance */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <Zap className="w-5 h-5 text-yellow-600" />
                      <span className="text-sm text-gray-600">Performance</span>
                    </div>
                    <div className="text-2xl font-bold text-gray-900">
                      {appMetrics.requests.averageResponseTime.toFixed(0)}ms
                    </div>
                    <div className="text-sm text-gray-600">
                      {appMetrics.performance.slowQueries} slow queries
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Logs Tab */}
        {selectedTab === "logs" && (
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold flex items-center">
                <Activity className="w-5 h-5 mr-2" />
                Recent Logs
              </h2>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {recentLogs.map((log) => (
                <div key={log.id} className="p-4 border-b hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${getLogLevelColor(log.level)}`}
                        >
                          {log.level}
                        </span>
                        <span className="text-sm text-gray-600">
                          {log.source}
                        </span>
                        {log.userId && (
                          <span className="text-sm text-gray-500">
                            User: {log.userId}
                          </span>
                        )}
                      </div>
                      <p className="text-gray-900">{log.message}</p>
                      {log.metadata && (
                        <pre className="text-xs text-gray-600 mt-2 bg-gray-100 p-2 rounded overflow-x-auto">
                          {JSON.stringify(log.metadata, null, 2)}
                        </pre>
                      )}
                    </div>
                    <div className="text-sm text-gray-500 ml-4">
                      {new Date(log.timestamp).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Performance Tab */}
        {selectedTab === "performance" && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <Zap className="w-5 h-5 mr-2" />
              Performance Metrics
            </h2>
            <p className="text-gray-600">
              Performance monitoring charts and metrics will be displayed here.
            </p>
          </div>
        )}

        {/* Errors Tab */}
        {selectedTab === "errors" && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2" />
              Error Analysis
            </h2>
            <p className="text-gray-600">
              Error tracking and analysis will be displayed here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MonitoringDashboard;
