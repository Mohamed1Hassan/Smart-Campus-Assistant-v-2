"use client";
import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Download,
  Filter,
  Calendar,
  Users,
  TrendingUp,
  AlertTriangle,
  BarChart3,
  PieChart,
  FileText,
  Search,
  ChevronDown,
  FileSpreadsheet,
  FileJson,
  MoreVertical,
} from "lucide-react";
import { useRouter } from "next/navigation";
import DashboardLayout from "../components/common/DashboardLayout";
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  AreaChart,
  Area,
} from "recharts";
import { useToast } from "../components/common/ToastProvider";
import { isDemo } from "@/utils/demoMode";
import { useAuth } from "../contexts/AuthContext";
import { useAttendanceSessions } from "../hooks/useAttendanceSessions";

export default function ProfessorAttendanceReports() {
  const { user } = useAuth();
  const router = useRouter();
  const { success } = useToast();

  const {
    sessions: attendanceSessions,
    loadSessions,
    isLoading: isLoadingSessions,
  } = useAttendanceSessions();

  // Suppress unused warning - loading state forwarded to spinner
  void isLoadingSessions;

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPeriod, setSelectedPeriod] = useState("month");
  const [selectedCourse, setSelectedCourse] = useState("all");
  const [showFilters, setShowFilters] = useState(false);

  // Load data
  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  // Process sessions into reports (derived state)
  const reports = useMemo(() => {
    if (!attendanceSessions) return [];

    return attendanceSessions
      .filter(
        (s) =>
          (s.status as string) === "ENDED" ||
          (s.status as string) === "COMPLETED" ||
          isDemo,
      )
      .map((s) => ({
        id: s.id,
        sessionId: s.id,
        sessionTitle: s.title,
        courseName: s.courseName || `Course ${s.courseId}`,
        date: new Date(s.endTime || s.createdAt),
        totalStudents: s.totalStudents || 0,
        presentStudents: s.presentStudents || 0,
        absentStudents: s.absentStudents || 0,
        lateStudents: s.lateStudents || 0,
        attendanceRate:
          (s.totalStudents || 0) > 0
            ? Math.round(
                ((s.presentStudents || 0) / (s.totalStudents || 1)) * 100,
              )
            : 0,
        fraudAlerts: s.fraudAlerts || 0,
        status: s.status,
      }))
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [attendanceSessions]);

  // Filtered reports
  const filteredReports = useMemo(() => {
    return reports.filter((r) => {
      const matchesSearch =
        r.sessionTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.courseName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCourse =
        selectedCourse === "all" || r.courseName === selectedCourse;

      let matchesPeriod = true;
      const now = new Date();
      const reportDate = new Date(r.date);
      if (selectedPeriod === "week") {
        matchesPeriod = reportDate >= new Date(now.setDate(now.getDate() - 7));
      } else if (selectedPeriod === "month") {
        matchesPeriod =
          reportDate >= new Date(now.setMonth(now.getMonth() - 1));
      }

      return matchesSearch && matchesCourse && matchesPeriod;
    });
  }, [reports, searchTerm, selectedCourse, selectedPeriod]);

  // Stats
  const stats = useMemo(() => {
    const total = filteredReports.length;
    const avgAttendance =
      total > 0
        ? Math.round(
            filteredReports.reduce((acc, r) => acc + r.attendanceRate, 0) /
              total,
          )
        : 0;
    const totalStudents = filteredReports.reduce(
      (acc, r) => acc + r.totalStudents,
      0,
    );
    const totalFraud = filteredReports.reduce(
      (acc, r) => acc + r.fraudAlerts,
      0,
    );

    return { total, avgAttendance, totalStudents, totalFraud };
  }, [filteredReports]);

  // Chart Data
  const trendData = useMemo(() => {
    return filteredReports
      .slice(0, 10)
      .reverse()
      .map((r) => ({
        name: r.date.toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
        }),
        rate: r.attendanceRate,
        students: r.presentStudents,
      }));
  }, [filteredReports]);

  const uniqueCourses = useMemo(() => {
    return Array.from(new Set(reports.map((r) => r.courseName)));
  }, [reports]);

  const handleExport = (format: string) => {
    success(`Exporting report as ${format}...`);
    // Implement actual export logic here
  };

  return (
    <DashboardLayout
      userName={user ? `${user.firstName} ${user.lastName}` : "Professor"}
      userType="professor"
    >
      <div className="max-w-7xl mx-auto space-y-8 pb-12">
        {/* Header */}
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/professor-attendance")}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-gray-600 dark:text-gray-300" />
            </button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Attendance Reports
              </h1>
              <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">
                Analytics and insights for your classes.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 w-full lg:w-auto">
            <div className="relative group w-full lg:w-auto">
              <button className="w-full lg:w-auto px-4 py-2 bg-white dark:bg-cardDark border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all font-medium flex items-center justify-center gap-2 shadow-sm">
                <Download className="w-4 h-4" />
                Export Report
                <ChevronDown className="w-4 h-4" />
              </button>
              <div className="absolute right-0 top-full mt-2 w-full lg:w-48 bg-white dark:bg-cardDark rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden hidden group-hover:block z-50">
                <button
                  onClick={() => handleExport("PDF")}
                  className="w-full px-4 py-3 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-2"
                >
                  <FileText className="w-4 h-4 text-red-500" /> PDF Document
                </button>
                <button
                  onClick={() => handleExport("Excel")}
                  className="w-full px-4 py-3 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-2"
                >
                  <FileSpreadsheet className="w-4 h-4 text-green-500" /> Excel
                  Spreadsheet
                </button>
                <button
                  onClick={() => handleExport("CSV")}
                  className="w-full px-4 py-3 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-2"
                >
                  <FileJson className="w-4 h-4 text-blue-500" /> CSV File
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              label: "Total Sessions",
              value: stats.total,
              icon: Calendar,
              color: "blue",
            },
            {
              label: "Avg. Attendance",
              value: `${stats.avgAttendance}%`,
              icon: TrendingUp,
              color: "green",
            },
            {
              label: "Total Students",
              value: stats.totalStudents,
              icon: Users,
              color: "purple",
            },
            {
              label: "Fraud Alerts",
              value: stats.totalFraud,
              icon: AlertTriangle,
              color: "red",
            },
          ].map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white dark:bg-cardDark p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 relative overflow-hidden group"
            >
              <div
                className={`absolute top-0 right-0 w-24 h-24 bg-${stat.color}-50 dark:bg-${stat.color}-900/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110`}
              />
              <div className="relative z-10">
                <div
                  className={`w-10 h-10 rounded-lg bg-${stat.color}-50 dark:bg-${stat.color}-900/20 flex items-center justify-center mb-4 text-${stat.color}-600 dark:text-${stat.color}-400`}
                >
                  <stat.icon className="w-5 h-5" />
                </div>
                <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                  {stat.value}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {stat.label}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="lg:col-span-2 bg-white dark:bg-cardDark p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Attendance Trend
              </h3>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="w-full sm:w-auto px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="week">Last 7 Days</option>
                <option value="month">Last 30 Days</option>
                <option value="semester">This Semester</option>
              </select>
            </div>
            <div className="w-full h-[300px]">
              {trendData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData}>
                    <defs>
                      <linearGradient
                        id="colorRate"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#8b5cf6"
                          stopOpacity={0.3}
                        />
                        <stop
                          offset="95%"
                          stopColor="#8b5cf6"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#E5E7EB"
                    />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#6B7280", fontSize: 12 }}
                      dy={10}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#6B7280", fontSize: 12 }}
                      domain={[0, 100]}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: "12px",
                        border: "none",
                        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="rate"
                      stroke="#8b5cf6"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorRate)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 dark:text-gray-500">
                  <BarChart3 className="w-12 h-12 mb-2 opacity-50" />
                  <p>No attendance data available</p>
                </div>
              )}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white dark:bg-cardDark p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700"
          >
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">
              Status Distribution
            </h3>
            <div className="w-full h-[300px] relative">
              {filteredReports.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={[
                          {
                            name: "Present",
                            value: filteredReports.reduce(
                              (a, b) => a + b.presentStudents,
                              0,
                            ),
                          },
                          {
                            name: "Absent",
                            value: filteredReports.reduce(
                              (a, b) => a + b.absentStudents,
                              0,
                            ),
                          },
                          {
                            name: "Late",
                            value: filteredReports.reduce(
                              (a, b) => a + b.lateStudents,
                              0,
                            ),
                          },
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        <Cell fill="#10b981" />
                        <Cell fill="#ef4444" />
                        <Cell fill="#f59e0b" />
                      </Pie>
                      <Tooltip />
                      <Legend verticalAlign="bottom" height={36} />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="text-center mt-[-40px]">
                      <p className="text-3xl font-bold text-gray-900 dark:text-white">
                        {stats.avgAttendance}%
                      </p>
                      <p className="text-xs text-gray-500">Average</p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 dark:text-gray-500">
                  <PieChart className="w-12 h-12 mb-2 opacity-50" />
                  <p>No data to display</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Reports List */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Detailed Reports
            </h3>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative flex-1 w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search reports..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-cardDark focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                />
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`p-2 rounded-xl border transition-colors flex-shrink-0 ${
                  showFilters
                    ? "bg-purple-50 border-purple-200 text-purple-600"
                    : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                <Filter className="w-4 h-4" />
              </button>
            </div>
          </div>

          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="bg-white dark:bg-cardDark p-4 rounded-xl border border-gray-200 dark:border-gray-700 mb-4 flex flex-wrap gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Course
                    </label>
                    <select
                      value={selectedCourse}
                      onChange={(e) => setSelectedCourse(e.target.value)}
                      className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm outline-none"
                    >
                      <option value="all">All Courses</option>
                      {uniqueCourses.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredReports.map((report) => (
              <motion.div
                key={report.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white dark:bg-cardDark rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all group cursor-pointer"
                onClick={() => {}}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="font-bold text-gray-900 dark:text-white line-clamp-1">
                      {report.sessionTitle}
                    </h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {report.courseName}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-1 rounded-lg text-xs font-medium ${
                      report.attendanceRate >= 80
                        ? "bg-green-50 text-green-700"
                        : report.attendanceRate >= 60
                          ? "bg-yellow-50 text-yellow-700"
                          : "bg-red-50 text-red-700"
                    }`}
                  >
                    {report.attendanceRate}%
                  </span>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 flex items-center gap-2">
                      <Calendar className="w-4 h-4" /> Date
                    </span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {report.date.toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 flex items-center gap-2">
                      <Users className="w-4 h-4" /> Present
                    </span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {report.presentStudents} / {report.totalStudents}
                    </span>
                  </div>
                  {report.fraudAlerts > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-red-500" />{" "}
                        Alerts
                      </span>
                      <span className="font-medium text-red-600">
                        {report.fraudAlerts} Detected
                      </span>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
                  <button className="text-sm font-medium text-purple-600 hover:text-purple-700 flex items-center gap-1">
                    View Details
                  </button>
                  <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-400 hover:text-gray-600 transition-colors">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}

            {filteredReports.length === 0 && (
              <div className="col-span-full py-12 text-center">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  No reports found
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Try adjusting your filters or search terms.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
