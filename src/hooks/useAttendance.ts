/**
 * Attendance Hook
 * Manages attendance data, QR code scanning, and statistics
 */

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import { apiClient } from "../services/api";

// Attendance Types
export interface AttendanceRecord {
  id: string;
  studentId: string;
  courseId: string;
  sessionId: string;
  status: "present" | "absent" | "late" | "excused";
  timestamp: Date;
  location?: {
    latitude: number;
    longitude: number;
  };
  qrCode?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AttendanceSession {
  id: string;
  courseId: string;
  professorId: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  qrCode: string;
  isActive: boolean;
  location?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AttendanceStats {
  totalSessions: number;
  attendedSessions: number;
  attendancePercentage: number;
  lateCount: number;
  absentCount: number;
  excusedCount: number;
  recentAttendance: AttendanceRecord[];
}

export interface CourseAttendance {
  courseId: string;
  courseName: string;
  courseCode: string;
  professorName: string;
  totalSessions: number;
  attendedSessions: number;
  attendancePercentage: number;
  lastAttendance?: Date;
}

export interface QRCodeData {
  sessionId: string;
  courseId: string;
  timestamp: number;
  expiresAt: number;
}

// Hook state interface
interface UseAttendanceState {
  attendanceRecords: AttendanceRecord[];
  attendanceSessions: AttendanceSession[];
  stats: AttendanceStats | null;
  courseAttendance: CourseAttendance[];
  loading: boolean;
  error: string | null;
  scanning: boolean;
}

// Hook options
interface UseAttendanceOptions {
  autoFetch?: boolean;
  includeStats?: boolean;
  includeCourses?: boolean;
}

// Main hook
export function useAttendance(options: UseAttendanceOptions = {}) {
  const {
    autoFetch = true,
    includeStats = true,
    includeCourses = true,
  } = options;
  const { user, isAuthenticated } = useAuth();

  const [state, setState] = useState<UseAttendanceState>({
    attendanceRecords: [],
    attendanceSessions: [],
    stats: null,
    courseAttendance: [],
    loading: false,
    error: null,
    scanning: false,
  });

  // Fetch attendance records
  const fetchAttendanceRecords = useCallback(
    async (filters?: {
      courseId?: string;
      startDate?: Date;
      endDate?: Date;
      status?: string;
    }) => {
      if (!isAuthenticated) return;

      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const queryParams = new URLSearchParams();

        if (filters?.courseId) {
          queryParams.append("courseId", filters.courseId);
        }
        if (filters?.startDate) {
          queryParams.append("startDate", filters.startDate.toISOString());
        }
        if (filters?.endDate) {
          queryParams.append("endDate", filters.endDate.toISOString());
        }
        if (filters?.status) {
          queryParams.append("status", filters.status);
        }

        const url = `/api/attendance/records${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
        const response = await apiClient.get<AttendanceRecord[]>(url);

        if (response.success) {
          setState((prev) => ({
            ...prev,
            attendanceRecords: response.data || [],
            loading: false,
          }));
        } else {
          throw new Error(
            response.message || "Failed to fetch attendance records",
          );
        }
      } catch (error: unknown) {
        const err = error as Error;
        setState((prev) => ({
          ...prev,
          loading: false,
          error: err.message || "Failed to fetch attendance records",
        }));
      }
    },
    [isAuthenticated],
  );

  // Fetch attendance sessions (for professors)
  const fetchAttendanceSessions = useCallback(
    async (courseId?: string) => {
      if (!isAuthenticated || user?.role !== "professor") return;

      try {
        const queryParams = new URLSearchParams();
        if (courseId) {
          queryParams.append("courseId", courseId);
        }

        const url = `/api/attendance/sessions${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
        const response = await apiClient.get<AttendanceSession[]>(url);

        if (response.success) {
          // Since ApiResponse.data is AttendanceSession[], we use it directly
          const sessions = response.data || [];
          setState((prev) => ({
            ...prev,
            attendanceSessions: sessions,
          }));
        }
      } catch (error) {
        console.error("Failed to fetch attendance sessions:", error);
      }
    },
    [isAuthenticated, user?.role],
  );

  // Fetch attendance statistics
  const fetchStats = useCallback(async () => {
    if (!isAuthenticated || !includeStats) return;

    try {
      const response = await apiClient.get<AttendanceStats>(
        "/api/attendance/stats",
      );

      if (response.success) {
        setState((prev) => ({
          ...prev,
          stats: response.data || null,
        }));
      }
    } catch (error) {
      console.error("Failed to fetch attendance stats:", error);
    }
  }, [isAuthenticated, includeStats]);

  // Fetch course attendance summary
  const fetchCourseAttendance = useCallback(async () => {
    if (!isAuthenticated || !includeCourses) return;

    try {
      const response = await apiClient.get<CourseAttendance[]>(
        "/api/attendance/courses",
      );

      if (response.success) {
        setState((prev) => ({
          ...prev,
          courseAttendance: response.data || [],
        }));
      }
    } catch (error) {
      console.error("Failed to fetch course attendance:", error);
    }
  }, [isAuthenticated, includeCourses]);

  // Mark attendance via QR code
  const markAttendance = useCallback(
    async (
      qrCodeData: string,
      location?: {
        latitude: number;
        longitude: number;
      },
    ) => {
      if (!isAuthenticated) return;

      setState((prev) => ({ ...prev, scanning: true, error: null }));

      try {
        // Parse QR code data
        const qrData: QRCodeData = JSON.parse(qrCodeData);

        // Validate QR code
        if (Date.now() > qrData.expiresAt) {
          throw new Error("QR code has expired");
        }

        const response = await apiClient.post("/api/attendance/mark", {
          sessionId: qrData.sessionId,
          courseId: qrData.courseId,
          location,
          timestamp: new Date().toISOString(),
        });

        if (response.success) {
          // Refresh data
          await Promise.all([
            fetchAttendanceRecords(),
            fetchStats(),
            fetchCourseAttendance(),
          ]);

          setState((prev) => ({ ...prev, scanning: false }));
          return response.data;
        } else {
          throw new Error(response.message || "Failed to mark attendance");
        }
      } catch (error: unknown) {
        const err = error as Error;
        setState((prev) => ({
          ...prev,
          scanning: false,
          error: err.message || "Failed to mark attendance",
        }));
        throw error;
      }
    },
    [
      isAuthenticated,
      fetchAttendanceRecords,
      fetchStats,
      fetchCourseAttendance,
    ],
  );

  // Create attendance session (for professors)
  const createAttendanceSession = useCallback(
    async (sessionData: {
      courseId: string;
      title: string;
      description?: string;
      duration: number; // in minutes
      location?: string;
    }) => {
      if (!isAuthenticated || user?.role !== "professor") return;

      try {
        const response = await apiClient.post(
          "/api/attendance/sessions",
          sessionData,
        );

        if (response.success) {
          // Refresh sessions
          await fetchAttendanceSessions(sessionData.courseId);
          return response.data;
        } else {
          throw new Error(
            response.message || "Failed to create attendance session",
          );
        }
      } catch (error: unknown) {
        const err = error as Error;
        setState((prev) => ({
          ...prev,
          error: err.message || "Failed to create attendance session",
        }));
        throw error;
      }
    },
    [isAuthenticated, user?.role, fetchAttendanceSessions],
  );

  // End attendance session (for professors)
  const endAttendanceSession = useCallback(
    async (sessionId: string) => {
      if (!isAuthenticated || user?.role !== "professor") return;

      try {
        const response = await apiClient.patch(
          `/api/attendance/sessions/${sessionId}/end`,
        );

        if (response.success) {
          // Refresh sessions
          await fetchAttendanceSessions();
          return response.data;
        } else {
          throw new Error(
            response.message || "Failed to end attendance session",
          );
        }
      } catch (error: unknown) {
        const err = error as Error;
        setState((prev) => ({
          ...prev,
          error: err.message || "Failed to end attendance session",
        }));
        throw error;
      }
    },
    [isAuthenticated, user?.role, fetchAttendanceSessions],
  );

  // Get session attendance (for professors)
  const getSessionAttendance = useCallback(
    async (sessionId: string) => {
      if (!isAuthenticated || user?.role !== "professor") return;

      try {
        const response = await apiClient.get<AttendanceRecord[]>(
          `/api/attendance/sessions/${sessionId}/records`,
        );

        if (response.success) {
          return response.data;
        } else {
          throw new Error(
            response.message || "Failed to fetch session attendance",
          );
        }
      } catch (error: unknown) {
        const err = error as Error;
        console.error("Failed to fetch session attendance:", err);
        throw error;
      }
    },
    [isAuthenticated, user?.role],
  );

  // Update attendance record (for professors)
  const updateAttendanceRecord = useCallback(
    async (
      recordId: string,
      updates: {
        status?: "present" | "absent" | "late" | "excused";
        notes?: string;
      },
    ) => {
      if (!isAuthenticated || user?.role !== "professor") return;

      try {
        const response = await apiClient.patch(
          `/api/attendance/records/${recordId}`,
          updates,
        );

        if (response.success) {
          // Refresh data
          await Promise.all([fetchAttendanceRecords(), fetchStats()]);
          return response.data;
        } else {
          throw new Error(
            response.message || "Failed to update attendance record",
          );
        }
      } catch (error: unknown) {
        const err = error as Error;
        setState((prev) => ({
          ...prev,
          error: err.message || "Failed to update attendance record",
        }));
        throw error;
      }
    },
    [isAuthenticated, user?.role, fetchAttendanceRecords, fetchStats],
  );

  // Generate QR code for session (for professors)
  const generateQRCode = useCallback(
    async (sessionId: string) => {
      if (!isAuthenticated || user?.role !== "professor") return;

      try {
        const response = await apiClient.get(
          `/api/attendance/sessions/${sessionId}/qr`,
        );

        if (response.success) {
          return response.data;
        } else {
          throw new Error(response.message || "Failed to generate QR code");
        }
      } catch (error: unknown) {
        const err = error as Error;
        console.error("Failed to generate QR code:", err);
        throw error;
      }
    },
    [isAuthenticated, user?.role],
  );

  // Refresh all data
  const refresh = useCallback(async () => {
    const promises = [fetchAttendanceRecords()];

    if (includeStats) {
      promises.push(fetchStats());
    }

    if (includeCourses) {
      promises.push(fetchCourseAttendance());
    }

    if (user?.role === "professor") {
      promises.push(fetchAttendanceSessions());
    }

    await Promise.all(promises);
  }, [
    fetchAttendanceRecords,
    fetchStats,
    fetchCourseAttendance,
    fetchAttendanceSessions,
    includeStats,
    includeCourses,
    user?.role,
  ]);

  // Clear error
  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  // Initial data fetch
  useEffect(() => {
    if (isAuthenticated && autoFetch) {
      refresh();
    }
  }, [isAuthenticated, autoFetch, refresh]);

  return {
    // State
    attendanceRecords: state.attendanceRecords,
    attendanceSessions: state.attendanceSessions,
    stats: state.stats,
    courseAttendance: state.courseAttendance,
    loading: state.loading,
    error: state.error,
    scanning: state.scanning,

    // Actions
    fetchAttendanceRecords,
    fetchAttendanceSessions,
    fetchStats,
    fetchCourseAttendance,
    markAttendance,
    createAttendanceSession,
    endAttendanceSession,
    getSessionAttendance,
    updateAttendanceRecord,
    generateQRCode,
    refresh,
    clearError,
  };
}

export default useAttendance;
