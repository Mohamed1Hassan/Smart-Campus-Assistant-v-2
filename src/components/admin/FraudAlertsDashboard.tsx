"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  ShieldAlert,
  AlertTriangle,
  User,
  MapPin,
  Clock,
  Search,
  Filter,
  CheckCircle,
  ExternalLink,
  ShieldCheck,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { apiClient } from "@/services/api";

interface FraudAlert {
  id: string;
  studentName: string;
  studentId: string;
  courseCode: string;
  courseName: string;
  type: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  description: string;
  isResolved: boolean;
  createdAt: string;
}

interface PaginationData {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface SecuritySummary {
  highRiskCount: number;
  pendingReviewCount: number;
}

export default function FraudAlertsDashboard() {
  const [alerts, setAlerts] = useState<FraudAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [pagination, setPagination] = useState<PaginationData>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  });
  const [summary, setSummary] = useState<SecuritySummary>({
    highRiskCount: 0,
    pendingReviewCount: 0,
  });
  const [isActionLoading, setIsActionLoading] = useState<string | null>(null);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPagination((prev) => ({ ...prev, page: 1 }));
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    try {
      const result = await apiClient.get<FraudAlert[]>("/admin/fraud-alerts", {
        params: {
          page: pagination.page,
          limit: pagination.limit,
          search: debouncedSearch,
        },
      });

      if (result.success) {
        setAlerts(result.data || []);
        if (result.pagination) setPagination(result.pagination);
        if (result.summary)
          setSummary(result.summary as unknown as SecuritySummary);
      }
    } catch (error) {
      console.error("Failed to fetch alerts:", error);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, debouncedSearch]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  const handleResolve = async (alertId: string) => {
    setIsActionLoading(alertId);
    try {
      const result = await apiClient.patch("/admin/fraud-alerts", { alertId });
      if (result.success) {
        // Refresh data
        fetchAlerts();
      }
    } catch (error) {
      console.error("Failed to resolve alert:", error);
    } finally {
      setIsActionLoading(null);
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination((prev) => ({ ...prev, page: newPage }));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header / Stats Summary */}
      {/* Header / Stats Summary */}
      <div className="bg-white/80 backdrop-blur-md rounded-[2.5rem] p-10 shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-white/60 flex flex-col xl:flex-row justify-between items-center gap-10">
        <div className="flex items-center gap-8">
          <div className="w-20 h-20 bg-red-600 rounded-[2rem] flex items-center justify-center text-white shadow-2xl shadow-red-500/20 rotate-3 group-hover:rotate-0 transition-transform duration-500">
            <ShieldAlert className="w-10 h-10" />
          </div>
          <div>
            <h2 className="text-3xl font-black text-gray-900 tracking-tight uppercase">
              Security <span className="text-red-600">Guard</span>
            </h2>
            <p className="text-sm text-gray-500 font-medium mt-1 max-w-md">
              Monitoring high-frequency attendance anomalies and potential ecosystem breaches.
            </p>
          </div>
        </div>

        <div className="flex gap-6">
          <div className="bg-white/80 backdrop-blur-sm rounded-[2rem] p-6 border border-gray-100 shadow-sm flex flex-col items-center min-w-[140px] relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-1 opacity-5">
              <AlertTriangle className="w-12 h-12 text-red-600" />
            </div>
            <span className="text-4xl font-black text-red-600">
              {summary.highRiskCount}
            </span>
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mt-2">
              Critical
            </span>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-[2rem] p-6 border border-gray-100 shadow-sm flex flex-col items-center min-w-[140px] relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-1 opacity-5">
              <Clock className="w-12 h-12 text-amber-600" />
            </div>
            <span className="text-4xl font-black text-amber-600">
              {summary.pendingReviewCount}
            </span>
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mt-2">
              Queue
            </span>
          </div>
        </div>
      </div>

      {/* Controls */}
      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
        <div className="relative w-full md:w-[28rem] group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-red-500 transition-colors" />
          <input
            type="text"
            placeholder="Intercept specific identifiers or anomalies..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-16 pr-8 py-5 bg-white border border-gray-100 rounded-[1.5rem] focus:ring-[6px] focus:ring-red-500/5 focus:border-red-500/50 outline-none transition-all font-bold text-gray-900 shadow-sm"
          />
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-3 px-10 py-5 text-[10px] font-black uppercase tracking-widest text-gray-600 bg-white border border-gray-100 rounded-[1.5rem] hover:bg-gray-50 transition-all shadow-sm">
            <Filter className="w-4 h-4" />
            Intelligence Matrix
          </button>
        </div>
      </div>

      {/* Alerts List */}
      <div className="bg-white/80 backdrop-blur-md rounded-[2.5rem] border border-white/60 shadow-[0_20px_50px_rgba(0,0,0,0.03)] overflow-hidden min-h-[500px]">
        <div className="divide-y divide-gray-50">
          {loading ? (
            <div className="h-[500px] flex flex-col items-center justify-center gap-6">
              <Loader2 className="w-12 h-12 text-red-600 animate-spin" />
              <p className="text-gray-400 font-black text-[10px] uppercase tracking-[0.2em] animate-pulse">
                Forensic Analysis Phase
              </p>
            </div>
          ) : alerts.length > 0 ? (
            <AnimatePresence mode="popLayout">
              {alerts.map((alert) => (
                <motion.div
                  layout
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  key={alert.id}
                  className={`p-10 hover:bg-gray-50/50 transition-all group relative overflow-hidden ${alert.isResolved ? "opacity-50" : ""}`}
                >
                  <div className="flex flex-col lg:flex-row gap-6 items-start">
                    {/* Severity Pillar */}
                    <div
                      className={`w-1.5 self-stretch rounded-full ${
                        alert.severity === "CRITICAL"
                          ? "bg-red-600 shadow-[0_0_12px_rgba(220,38,38,0.4)]"
                          : alert.severity === "HIGH"
                            ? "bg-orange-500"
                            : alert.severity === "MEDIUM"
                              ? "bg-amber-400"
                              : "bg-blue-400"
                      }`}
                    />

                    <div className="flex-1 space-y-3">
                      <div className="flex flex-wrap items-center gap-3">
                        <h4 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors uppercase tracking-tight">
                          {alert.type.replace(/_/g, " ")}
                        </h4>
                        <span
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                            alert.isResolved
                              ? "bg-green-100 text-green-700"
                              : alert.severity === "CRITICAL"
                                ? "bg-red-100 text-red-700"
                                : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {alert.isResolved
                            ? "RESOLVED"
                            : `RISK: ${alert.severity}`}
                        </span>
                      </div>

                      <p className="text-gray-600 leading-relaxed font-medium">
                        {alert.description}
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="flex items-center gap-2 text-xs font-bold text-gray-500 bg-gray-50 px-3 py-2 rounded-lg">
                          <User className="w-3.5 h-3.5 text-blue-500" />
                          <span className="truncate">
                            {alert.studentName} ({alert.studentId})
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs font-bold text-gray-500 bg-gray-50 px-3 py-2 rounded-lg">
                          <MapPin className="w-3.5 h-3.5 text-orange-500" />
                          <span>
                            {alert.courseCode} ({alert.courseName})
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs font-bold text-gray-500 bg-gray-50 px-3 py-2 rounded-lg">
                          <Clock className="w-3.5 h-3.5 text-purple-500" />
                          <span>
                            {new Date(alert.createdAt).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-row lg:flex-col items-center gap-2 w-full lg:w-40">
                      {!alert.isResolved && (
                        <>
                          <button
                            onClick={() => handleResolve(alert.id)}
                            disabled={isActionLoading === alert.id}
                            className="flex-1 w-full px-4 py-2.5 text-sm font-black text-green-700 bg-green-50 border border-green-100 rounded-xl hover:bg-green-100 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                          >
                            {isActionLoading === alert.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <CheckCircle className="w-4 h-4" />
                            )}
                            DISMISS
                          </button>
                          <button className="flex-1 w-full px-4 py-2.5 text-sm font-black text-blue-700 bg-blue-50 border border-blue-100 rounded-xl hover:bg-blue-100 transition-all flex items-center justify-center gap-2 group/btn">
                            INVESTIGATE
                            <ExternalLink className="w-4 h-4 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
                          </button>
                        </>
                      )}
                      {alert.isResolved && (
                        <div className="flex items-center gap-2 text-green-600 font-black text-xs bg-green-50 px-4 py-2.5 rounded-xl w-full justify-center border border-green-100">
                          <ShieldCheck className="w-4 h-4" />
                          CASE CLOSED
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          ) : (
            <div className="flex flex-col items-center justify-center h-96 gap-4 text-center p-8">
              <div className="p-4 bg-green-50 rounded-full text-green-500">
                <ShieldCheck className="w-12 h-12" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">All Secure</h3>
                <p className="text-gray-500 mt-1">
                  No security threats detected in the system.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Pagination Controls */}
        {pagination.totalPages > 1 && (
          <div className="p-6 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
            <span className="text-sm font-bold text-gray-500">
              Showing <span className="text-gray-900">{alerts.length}</span> of{" "}
              <span className="text-gray-900">{pagination.total}</span> alerts
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className={`p-2 rounded-xl border transition-all ${pagination.page === 1 ? "bg-gray-100 border-gray-200 text-gray-400" : "bg-white border-gray-200 text-gray-700 hover:border-blue-300 hover:text-blue-600 shadow-sm"}`}
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              {[...Array(pagination.totalPages)].map((_, i) => (
                <button
                  key={i + 1}
                  onClick={() => handlePageChange(i + 1)}
                  className={`w-10 h-10 rounded-xl font-bold transition-all border ${
                    pagination.page === i + 1
                      ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-200"
                      : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {i + 1}
                </button>
              ))}

              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
                className={`p-2 rounded-xl border transition-all ${pagination.page === pagination.totalPages ? "bg-gray-100 border-gray-200 text-gray-400" : "bg-white border-gray-200 text-gray-700 hover:border-blue-300 hover:text-blue-600 shadow-sm"}`}
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
