"use client";
import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Calendar,
  Users,
  CheckCircle,
  Clock,
  Play,
  Square,
  Eye,
  Edit,
  Trash2,
  MapPin,
  Search,
  RefreshCw,
  ArrowRight,
  MoreVertical,
} from "lucide-react";
import { useRouter } from "next/navigation";
import DashboardLayout from "../components/common/DashboardLayout";
import AttendanceTable from "../components/professor/AttendanceTable";
import ConfirmModal from "../components/ConfirmModal";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../components/common/ToastProvider";
import { useAttendanceSessions } from "../hooks/useAttendanceSessions";

// Session types
interface AttendanceSession {
  id: string;
  courseId: number;
  courseName: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  location: {
    latitude: number;
    longitude: number;
    radius: number;
    name: string;
  };
  security: {
    isLocationRequired: boolean;
    isPhotoRequired: boolean;
    isDeviceCheckRequired: boolean;
    fraudDetectionEnabled: boolean;
    gracePeriod: number;
    maxAttempts: number;
    riskThreshold: number;
  };
  status: "DRAFT" | "SCHEDULED" | "ACTIVE" | "PAUSED" | "ENDED" | "CANCELLED";
  totalStudents: number;
  presentStudents: number;
  absentStudents: number;
  lateStudents: number;
  fraudAlerts: number;
  qrCode?: string;
  createdAt: Date;
  updatedAt: Date;
}

export default function ProfessorAttendance() {
  const { user } = useAuth();
  const router = useRouter();
  const { success, error: showError } = useToast();

  const {
    sessions: apiSessions,
    loadSessions,
    isLoading: isLoadingSessions,
    startSession: startSessionAPI,
    stopSession: stopSessionAPI,
    deleteSession: deleteSessionAPI,
    stopError: stopSessionError,
  } = useAttendanceSessions();

  const [searchTerm, setSearchTerm] = useState("");

  const sessions = useMemo(() => {
    if (!apiSessions) return [];
    return apiSessions.map((session) => ({
      id: session.id,
      sessionId: session.id,
      courseId: session.courseId,
      courseName: session.courseName || `Course ${session.courseId}`,
      title: session.title,
      description: session.description,
      startTime: new Date(session.startTime),
      endTime: new Date(session.endTime),
      location: session.location || {
        latitude: 0,
        longitude: 0,
        radius: 50,
        name: "",
      },
      security: session.security || {
        isLocationRequired: true,
        isPhotoRequired: false,
        isDeviceCheckRequired: true,
        fraudDetectionEnabled: true,
        gracePeriod: 5,
        maxAttempts: 3,
        riskThreshold: 70,
      },
      status: session.status as AttendanceSession["status"],
      totalStudents: session.totalStudents || 0,
      presentStudents: session.presentStudents || 0,
      absentStudents: session.absentStudents || 0,
      lateStudents: session.lateStudents || 0,
      fraudAlerts: session.fraudAlerts || 0,
      qrCode: session.qrCode,
      createdAt: new Date(session.createdAt),
      updatedAt: new Date(session.updatedAt),
    }));
  }, [apiSessions]);
  const [activeTab, setActiveTab] = useState<"sessions" | "records">(
    "sessions",
  );

  const [sessionsStatusFilter, setSessionsStatusFilter] = useState<
    "all" | "ACTIVE" | "SCHEDULED" | "ENDED"
  >("all");
  const [showDeleteSessionModal, setShowDeleteSessionModal] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setOpenMenuId(null);
    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, []);

  const toggleMenu = (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    setOpenMenuId(openMenuId === sessionId ? null : sessionId);
  };

  // Stats
  const stats = useMemo(() => {
    const active = sessions.filter((s) => s.status === "ACTIVE").length;
    const scheduled = sessions.filter((s) => s.status === "SCHEDULED").length;
    const completed = sessions.filter((s) => s.status === "ENDED").length;
    const totalStudents = sessions.reduce((sum, s) => sum + s.totalStudents, 0);
    const presentStudents = sessions.reduce(
      (sum, s) => sum + s.presentStudents,
      0,
    );
    const attendanceRate =
      totalStudents > 0
        ? Math.round((presentStudents / totalStudents) * 100)
        : 0;

    return { active, scheduled, completed, attendanceRate };
  }, [sessions]);

  // Filter sessions
  const filteredSessions = useMemo(() => {
    return sessions.filter((session) => {
      if (
        sessionsStatusFilter !== "all" &&
        session.status !== sessionsStatusFilter
      )
        return false;
      if (
        searchTerm &&
        !session.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !session.courseName.toLowerCase().includes(searchTerm.toLowerCase())
      )
        return false;
      return true;
    });
  }, [sessions, sessionsStatusFilter, searchTerm]);

  // Handlers

  const handleStartSession = async (sessionId: string) => {
    const session = sessions.find((s) => s.id === sessionId);
    const apiSessionId = session?.id || sessionId;
    if (await startSessionAPI(apiSessionId)) {
      success("Session started");
      loadSessions();
    }
  };

  const handleStopSession = async (sessionId: string) => {
    const session = sessions.find((s) => s.id === sessionId);
    const apiSessionId = session?.id || sessionId;
    if (await stopSessionAPI(apiSessionId)) {
      success("Session ended");
      loadSessions();
    } else {
      showError(stopSessionError || "Failed to end session");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "text-green-600 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800";
      case "SCHEDULED":
        return "text-blue-600 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800";
      case "ENDED":
        return "text-gray-600 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700";
      case "PAUSED":
        return "text-orange-600 bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800";
      default:
        return "text-gray-600 bg-gray-50 dark:bg-gray-800";
    }
  };

  return (
    <DashboardLayout
      userName={user ? `${user.firstName} ${user.lastName}` : "Professor"}
      userType="professor"
    >
      <div className="max-w-7xl mx-auto space-y-8 pb-12">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 lg:gap-6">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-1 lg:mb-2">
              Attendance Management
            </h1>
            <p className="text-sm lg:text-base text-gray-600 dark:text-gray-400">
              Manage your class sessions and track student attendance in
              real-time.
            </p>
          </div>
          <div className="flex items-center gap-3 w-full lg:w-auto">
            <button
              onClick={() => loadSessions()}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              title="Refresh"
            >
              <RefreshCw
                className={`w-5 h-5 ${isLoadingSessions ? "animate-spin" : ""}`}
              />
            </button>
            <button
              onClick={() =>
                router.push("/dashboard/professor/attendance/create")
              }
              className="flex-1 lg:flex-none justify-center px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 font-medium flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Create Session
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
          {[
            {
              label: "Active Sessions",
              value: stats.active,
              icon: Play,
              color: "green",
            },
            {
              label: "Scheduled",
              value: stats.scheduled,
              icon: Calendar,
              color: "blue",
            },
            {
              label: "Completed",
              value: stats.completed,
              icon: CheckCircle,
              color: "gray",
            },
            {
              label: "Avg. Attendance",
              value: `${stats.attendanceRate}%`,
              icon: Users,
              color: "purple",
            },
          ].map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white dark:bg-cardDark p-4 md:p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 relative overflow-hidden group"
            >
              <div
                className={`absolute top-0 right-0 w-24 h-24 bg-${stat.color}-50 dark:bg-${stat.color}-900/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110`}
              />
              <div className="relative z-10">
                <div
                  className={`w-8 h-8 md:w-10 md:h-10 rounded-lg bg-${stat.color}-50 dark:bg-${stat.color}-900/20 flex items-center justify-center mb-3 md:mb-4 text-${stat.color}-600 dark:text-${stat.color}-400`}
                >
                  <stat.icon className="w-4 h-4 md:w-5 md:h-5" />
                </div>
                <h3 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-1">
                  {stat.value}
                </h3>
                <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">
                  {stat.label}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Tabs & Filters */}
        <div className="bg-white dark:bg-cardDark rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex p-1 bg-gray-100 dark:bg-gray-800 rounded-xl w-full md:w-auto">
              <button
                onClick={() => setActiveTab("sessions")}
                className={`flex-1 md:flex-none px-6 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === "sessions"
                    ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700"
                }`}
              >
                Sessions
              </button>
              <button
                onClick={() => setActiveTab("records")}
                className={`flex-1 md:flex-none px-6 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === "records"
                    ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700"
                }`}
              >
                Records
              </button>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
              <div className="relative w-full sm:flex-1 md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                />
              </div>
              {activeTab === "sessions" && (
                <select
                  value={sessionsStatusFilter}
                  onChange={(e) =>
                    setSessionsStatusFilter(
                      e.target.value as typeof sessionsStatusFilter,
                    )
                  }
                  className="w-full sm:w-auto px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="all">All Status</option>
                  <option value="ACTIVE">Active</option>
                  <option value="SCHEDULED">Scheduled</option>
                  <option value="ENDED">Ended</option>
                </select>
              )}
            </div>
          </div>
        </div>

        {/* Content Area */}
        <AnimatePresence mode="wait">
          {activeTab === "sessions" ? (
            <motion.div
              key="sessions"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {filteredSessions.map((session) => (
                <div
                  key={session.id}
                  className="bg-white dark:bg-cardDark rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-md transition-all group"
                >
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(session.status)}`}
                      >
                        {session.status}
                      </span>
                      <div className="flex gap-1">
                        {session.status === "ACTIVE" && (
                          <button
                            onClick={() => handleStopSession(session.id)}
                            className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 rounded-lg transition-colors"
                            title="End Session"
                          >
                            <Square className="w-4 h-4" />
                          </button>
                        )}
                        {session.status === "SCHEDULED" && (
                          <button
                            onClick={() => handleStartSession(session.id)}
                            className="p-2 hover:bg-green-50 dark:hover:bg-green-900/20 text-green-600 rounded-lg transition-colors"
                            title="Start Session"
                          >
                            <Play className="w-4 h-4" />
                          </button>
                        )}
                        <div className="relative">
                          <button
                            onClick={(e) => toggleMenu(e, session.id)}
                            className={`p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors ${openMenuId === session.id ? "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white" : "text-gray-500"}`}
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>

                          {openMenuId === session.id && (
                            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-cardDark rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 py-1 z-20 animate-in fade-in zoom-in-95 duration-100">
                              <button
                                onClick={() =>
                                  router.push(
                                    `/dashboard/professor/attendance/sessions/${session.id}`,
                                  )
                                }
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-2"
                              >
                                <Eye className="w-4 h-4" />
                                View Details
                              </button>
                              <button
                                onClick={() =>
                                  router.push(
                                    `/dashboard/professor/attendance/edit/${session.id}`,
                                  )
                                }
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-2"
                              >
                                <Edit className="w-4 h-4" />
                                Edit Session
                              </button>
                              <button
                                onClick={() => {
                                  setSessionToDelete(session.id);
                                  setShowDeleteSessionModal(true);
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                              >
                                <Trash2 className="w-4 h-4" />
                                Delete Session
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1 line-clamp-1">
                      {session.title}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 line-clamp-1">
                      {session.courseName}
                    </p>

                    <div className="space-y-3 mb-6">
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span>
                          {session.startTime.toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}{" "}
                          -
                          {session.endTime.toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span className="truncate">
                          {session.location?.name || "N/A"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                        <Users className="w-4 h-4 text-gray-400" />
                        <span>
                          {session.presentStudents} / {session.totalStudents}{" "}
                          Present
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
                      <div className="flex -space-x-2">
                        {[...Array(3)].map((_, i) => (
                          <div
                            key={i}
                            className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 border-2 border-white dark:border-gray-800 flex items-center justify-center text-xs font-medium text-gray-500"
                          >
                            {String.fromCharCode(65 + i)}
                          </div>
                        ))}
                        {session.presentStudents > 3 && (
                          <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 border-2 border-white dark:border-gray-800 flex items-center justify-center text-xs font-medium text-gray-500">
                            +{session.presentStudents - 3}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() =>
                          router.push(
                            `/dashboard/professor/attendance/sessions/${session.id}`,
                          )
                        }
                        className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1"
                      >
                        Details <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  {session.status === "ACTIVE" && (
                    <div className="h-1 bg-green-500 w-full animate-pulse" />
                  )}
                </div>
              ))}
              {filteredSessions.length === 0 && (
                <div className="col-span-full flex flex-col items-center justify-center py-12 text-gray-500">
                  <Calendar className="w-12 h-12 mb-4 opacity-20" />
                  <p className="text-lg font-medium">No sessions found</p>
                  <p className="text-sm">Create a new session to get started</p>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="records"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white dark:bg-cardDark rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden"
            >
              <AttendanceTable
                records={[]}
                onEdit={() => {}}
                onDelete={() => {}}
              />
            </motion.div>
          )}
        </AnimatePresence>

        <ConfirmModal
          isOpen={showDeleteSessionModal}
          onCancel={() => {
            setShowDeleteSessionModal(false);
            setSessionToDelete(null);
          }}
          onConfirm={async () => {
            if (sessionToDelete) {
              const session = sessions.find((s) => s.id === sessionToDelete);
              const apiSessionId = session?.id || sessionToDelete;
              if (await deleteSessionAPI(apiSessionId)) {
                success("Session deleted successfully");
                setShowDeleteSessionModal(false);
                setSessionToDelete(null);
                loadSessions();
              } else {
                showError("Failed to delete session");
              }
            }
          }}
          title="Delete Session"
          message="Are you sure you want to delete this session? This action cannot be undone."
          confirmText="Delete"
        />
      </div>
    </DashboardLayout>
  );
}
