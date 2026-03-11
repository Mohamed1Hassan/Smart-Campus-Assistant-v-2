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
      <div className="bg-gradient-to-br from-red-50 to-orange-50/30 border border-red-100 rounded-2xl p-6 flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-red-100 rounded-xl text-red-600">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-red-900 flex items-center gap-2">
              Security & Fraud Investigation
            </h2>
            <p className="text-red-700/80 mt-1 text-sm max-w-md">
              Monitor suspicious attendance activities detected by the AI
              Assistant and resolved potential breaches.
            </p>
          </div>
        </div>
        <div className="flex gap-4">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-red-100 shadow-sm flex flex-col items-center min-w-[120px] relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-1 opacity-10">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            <span className="text-3xl font-black text-red-600">
              {summary.highRiskCount}
            </span>
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">
              High Risk
            </span>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-amber-100 shadow-sm flex flex-col items-center min-w-[120px] relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-1 opacity-10">
              <Clock className="w-8 h-8 text-amber-600" />
            </div>
            <span className="text-3xl font-black text-amber-600">
              {summary.pendingReviewCount}
            </span>
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">
              Pending Review
            </span>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96 group">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
          <input
            type="text"
            placeholder="Search by student, ID, or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all shadow-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all shadow-sm">
            <Filter className="w-4 h-4" />
            Advanced Filter
          </button>
        </div>
      </div>

      {/* Alerts List */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xl overflow-hidden min-h-[400px]">
        <div className="divide-y divide-gray-100">
          {loading ? (
            <div className="h-96 flex flex-col items-center justify-center gap-4">
              <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
              <p className="text-gray-500 font-medium animate-pulse">
                Analyzing security data...
              </p>
            </div>
          ) : alerts.length > 0 ? (
            <AnimatePresence mode="popLayout">
              {alerts.map((alert) => (
                <motion.div
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  key={alert.id}
                  className={`p-6 hover:bg-gray-50/50 transition-all group relative overflow-hidden ${alert.isResolved ? "opacity-60" : ""}`}
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
