import { apiClient, ApiResponse } from "./api";

// Types for Attendance Session
export interface SessionLocation {
  latitude: number;
  longitude: number;
  radius: number;
  name: string;
}

export interface SessionSecurity {
  isLocationRequired: boolean;
  isPhotoRequired: boolean;
  isDeviceCheckRequired: boolean;
  fraudDetectionEnabled: boolean;
  gracePeriod: number;
  maxAttempts: number;
  riskThreshold: number;
}

export interface Course {
  id: number;
  courseCode: string;
  courseName: string;
  description?: string;
  credits?: number;
  enrollments?: any[];
  _count?: {
    enrollments: number;
  };
}

export interface AttendanceSession {
  id: string;
  professorId: string;
  courseId: number;
  courseName?: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  status: "DRAFT" | "SCHEDULED" | "ACTIVE" | "PAUSED" | "ENDED" | "CANCELLED";
  qrCode?: string;
  createdAt: Date;
  updatedAt: Date;
  location?: SessionLocation;
  security?: SessionSecurity;
  securitySettings?: any;
  course?: Course;
  attendanceRecords?: any[];
  totalStudents?: number;
  presentStudents?: number;
  absentStudents?: number;
  lateStudents?: number;
  fraudAlerts?: number;
}

export interface CreateSessionData {
  professorId: string;
  courseId: number;
  courseName?: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  location?: SessionLocation;
  security?: unknown;
}

export interface UpdateSessionData {
  title?: string;
  description?: string;
  startTime?: Date;
  endTime?: Date;
  status?: string;
  location?: SessionLocation;
  security?: unknown;
}

export interface SessionStats {
  totalSessions: number;
  activeSessions: number;
  avgAttendance: number;
  totalStudents: number;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

class AttendanceService {
  /**
   * Create a new attendance session
   */
  async createSession(
    data: CreateSessionData,
  ): Promise<ApiResponse<AttendanceSession>> {
    return await apiClient.post<AttendanceSession>(
      "/attendance/sessions",
      data,
    );
  }

  /**
   * Get sessions with filters
   */
  async getSessions(
    filters: { courseId?: number; professorId?: string; status?: string } = {},
  ): Promise<ApiResponse<AttendanceSession[]>> {
    return await apiClient.get<AttendanceSession[]>("/attendance/sessions", {
      params: filters,
    });
  }

  /**
   * Get session by ID
   */
  async getSessionById(id: string): Promise<ApiResponse<AttendanceSession>> {
    return await apiClient.get<AttendanceSession>(`/attendance/sessions/${id}`);
  }

  /**
   * Start a session (set status to ACTIVE)
   */
  async startSession(id: string): Promise<ApiResponse<AttendanceSession>> {
    return await apiClient.post<AttendanceSession>(
      `/attendance/sessions/${id}/start`,
    );
  }

  /**
   * Stop a session (set status to ENDED)
   */
  async stopSession(id: string): Promise<ApiResponse<AttendanceSession>> {
    return await apiClient.post<AttendanceSession>(
      `/attendance/sessions/${id}/stop`,
    );
  }

  /**
   * Pause a session (set status to PAUSED)
   */
  async pauseSession(id: string): Promise<ApiResponse<AttendanceSession>> {
    return await apiClient.post<AttendanceSession>(
      `/attendance/sessions/${id}/pause`,
    );
  }

  /**
   * Generate QR code for a session
   */
  async generateQRCode(id: string): Promise<ApiResponse<AttendanceSession>> {
    return await apiClient.post<AttendanceSession>(
      `/attendance/sessions/${id}`,
      { action: "rotate" },
    );
  }

  /**
   * Get session statistics
   */
  async getSessionStats(
    professorId?: string,
  ): Promise<ApiResponse<SessionStats>> {
    return await apiClient.get<SessionStats>("/attendance/sessions/stats", {
      params: { professorId },
    });
  }

  /**
   * Get attendance records for a session
   */
  async getSessionRecords(
    id: string,
    params?: PaginationParams,
  ): Promise<ApiResponse<unknown[]>> {
    return await apiClient.get<unknown[]>(
      `/attendance/sessions/${id}/records`,
      { params },
    );
  }

  /**
   * Update a session
   */
  async updateSession(
    id: string,
    updates: UpdateSessionData,
  ): Promise<ApiResponse<AttendanceSession>> {
    return await apiClient.patch<AttendanceSession>(
      `/attendance/sessions/${id}`,
      updates,
    );
  }

  /**
   * Delete a session
   */
  async deleteSession(id: string): Promise<ApiResponse<void>> {
    return await apiClient.delete<void>(`/attendance/sessions/${id}`);
  }
}

export const attendanceService = new AttendanceService();
export default attendanceService;
