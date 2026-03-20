import { Prisma } from "@prisma/client";
import prisma from "../lib/db";
import socketService from "./socket.service";
import { calculateFraudScore } from "../utils/security";
import { FaceService } from "./face.service";
import { v4 as uuidv4 } from "uuid";

// Types for Attendance Session
export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy?: number;
  address?: string;
  campus?: string;
  building?: string;
  room?: string;
  [key: string]: Prisma.JsonValue | undefined;
}

export interface SecuritySettings {
  requireLocation?: boolean;
  requireDeviceCheck?: boolean;
  requirePhoto?: boolean;
  proximityThreshold?: number; // in meters
  [key: string]: Prisma.JsonValue | undefined;
}

export interface AttendanceSession {
  id: string;
  professorId: string;
  courseId: number;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  status: "DRAFT" | "SCHEDULED" | "ACTIVE" | "PAUSED" | "ENDED" | "CANCELLED";
  qrCode?: string;
  createdAt: Date;
  updatedAt: Date;
  location?: LocationData;
  security?: SecuritySettings;
}

export interface CreateSessionData {
  professorId: string;
  courseId: number;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  location?: LocationData;
  security?: SecuritySettings;
}

export type UpdateSessionData = Partial<
  Omit<CreateSessionData, "courseId" | "professorId">
>;

export interface ScanQRCodeData {
  userId: number;
  sessionId: string;
  qrCode: string;
  location?: { latitude: number; longitude: number; accuracy: number };
  deviceFingerprint?: string;
  photo?: string; // Base64
}

class AttendanceService {
  /**
   * Create a new attendance session
   */
  async createSession(data: CreateSessionData) {
    try {
      const session = await prisma.attendanceSession.create({
        data: {
          professorId: parseInt(data.professorId),
          courseId: data.courseId,
          title: data.title,
          description: data.description,
          startTime: data.startTime,
          endTime: data.endTime,
          status: "SCHEDULED",
          qrCode: `attendance-${uuidv4()}-${Date.now()}`,
          location: data.location as unknown as Prisma.InputJsonValue,
          securitySettings: data.security as unknown as Prisma.InputJsonValue,
        },
      });

      // Update name to reflect actual ID if needed, or just use the UUID
      // Actually, the schema uses Int for User id but String (uuid) might be better for Session.
      // Let's check the schema again.

      // Emit real-time event (legacy)
      socketService.broadcastToSession(session.id, "session:created", {
        session,
      });

      // --- New: Notify all enrolled students ---
      // 1. Get course details including enrolled students
      const courseWithStudents = await prisma.course.findUnique({
        where: { id: data.courseId },
        include: {
          enrollments: {
            where: { status: "ACTIVE" },
            select: { studentId: true },
          },
        },
      });

      if (courseWithStudents) {
        const studentIds = courseWithStudents.enrollments.map(
          (e) => e.studentId,
        );

        if (studentIds.length > 0) {
          // Create persistent recursive notifications for each student
          // Note: Using Promise.all for database operations
          await Promise.all(
            studentIds.map((studentId) =>
              prisma.notification.create({
                data: {
                  userId: studentId,
                  title: "New Attendance Session",
                  message: `A new attendance session "${data.title}" has been created for ${courseWithStudents.courseName}.`,
                  type: "INFO",
                  category: "ATTENDANCE",
                  metadata: {
                    sessionId: session.id,
                    courseId: session.courseId,
                    courseName: courseWithStudents.courseName,
                  },
                },
              }),
            ),
          );

          // Also broadcast to each student's personal socket channel
          studentIds.forEach((studentId) => {
            socketService.sendNotificationToUser(studentId, {
              title: "New Attendance Session",
              message: `A new attendance session "${data.title}" has been started for ${courseWithStudents.courseName}.`,
              category: "ATTENDANCE",
              type: "INFO",
              metadata: {
                sessionId: session.id,
                courseId: session.courseId,
              },
            }, false); // Set saveToDb to false to avoid duplicates
          });
        }
      }

      return session;
    } catch (error) {
      console.error("[AttendanceService] Error creating session:", error);
      throw error;
    }
  }

  /**
   * Get sessions with filters including optional date range
   */
  async getSessions(filters: {
    courseId?: number;
    professorId?: string;
    status?: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    try {
      const where: Prisma.AttendanceSessionWhereInput = {
        status: filters.status || undefined,
      };

      if (filters.courseId) {
        where.courseId = filters.courseId;
      }

      if (filters.professorId) {
        where.professorId = parseInt(filters.professorId);
      }

      if (filters.startDate || filters.endDate) {
        const startTime: Prisma.DateTimeFilter = {};
        if (filters.startDate) startTime.gte = filters.startDate;
        if (filters.endDate) startTime.lte = filters.endDate;
        where.startTime = startTime;
      }

      const sessions = await prisma.attendanceSession.findMany({
        where,
        include: {
          course: {
            select: {
              courseCode: true,
              courseName: true,
            },
          },
        },
        orderBy: { startTime: "desc" },
      });

      // Flatten for frontend
      return sessions.map((s) => ({
        ...s,
        courseName: s.course.courseName,
        courseCode: s.course.courseCode,
        isActive: s.status === "ACTIVE",
      }));
    } catch (error) {
      const err = error as Error;
      console.error("[AttendanceService] Error getting sessions:", {
        message: err.message,
        stack: err.stack,
        filters,
      });
      throw error;
    }
  }

  /**
   * Get session by ID
   */
  async getSessionById(id: string) {
    try {
      return await prisma.attendanceSession.findUnique({
        where: { id },
        include: {
          course: {
            include: {
              _count: {
                select: { enrollments: true },
              },
            },
          },
          attendanceRecords: {
            include: {
              student: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  universityId: true,
                },
              },
            },
          },
        },
      });
    } catch (error) {
      console.error("[AttendanceService] Error getting session by ID:", error);
      throw error;
    }
  }

  /**
   * Start a session (set status to ACTIVE)
   */
  async startSession(id: string) {
    try {
      console.log(`[AttendanceService] Starting session: ${id}`);
      const session = await prisma.attendanceSession.update({
        where: { id },
        data: { status: "ACTIVE" },
      });
      console.log(
        `[AttendanceService] Session status updated to ACTIVE: ${id}`,
      );

      socketService.emitSessionStarted({
        sessionId: id,
        courseId: session.courseId,
        professorId: String(session.professorId),
        title: session.title || "Untitled Session",
        status: "ACTIVE",
        timestamp: new Date(),
      });
      console.log(`[AttendanceService] Session started event emitted: ${id}`);
      return session;
    } catch (error) {
      console.error("[AttendanceService] Error starting session:", error);
      throw error;
    }
  }

  /**
   * Stop a session (set status to ENDED)
   */
  async stopSession(id: string) {
    try {
      const session = await prisma.attendanceSession.update({
        where: { id },
        data: { status: "ENDED" },
      });

      socketService.broadcastToSession(id, "session:ended", {
        sessionId: id,
        session,
      });
      return session;
    } catch (error) {
      console.error("[AttendanceService] Error stopping session:", error);
      throw error;
    }
  }

  /**
   * Pause a session (set status to PAUSED)
   */
  async pauseSession(id: string) {
    try {
      const session = await prisma.attendanceSession.update({
        where: { id },
        data: { status: "PAUSED" },
      });

      socketService.broadcastToSession(id, "session:paused", {
        sessionId: id,
        session,
      });
      return session;
    } catch (error) {
      console.error("[AttendanceService] Error pausing session:", error);
      throw error;
    }
  }

  /**
   * Update a session
   */
  async updateSession(id: string, updates: UpdateSessionData) {
    try {
      const session = await prisma.attendanceSession.update({
        where: { id },
        data: updates,
      });
      return session;
    } catch (error) {
      console.error("[AttendanceService] Error updating session:", error);
      throw error;
    }
  }

  /**
   * Delete a session
   */
  async deleteSession(id: string) {
    try {
      await prisma.attendanceSession.delete({
        where: { id },
      });
      return true;
    } catch (error) {
      console.error("[AttendanceService] Error deleting session:", error);
      throw error;
    }
  }

  /**
   * Get session statistics for a professor
   */
  async getSessionStats(professorId?: number) {
    try {
      const where = professorId ? { professorId } : {};
      const sessions = await prisma.attendanceSession.findMany({
        where,
        include: {
          attendanceRecords: true,
        },
      });

      const totalSessions = sessions.length;
      const activeSessions = sessions.filter(
        (s) => s.status === "ACTIVE",
      ).length;

      let totalStudents = 0;
      let presentStudents = 0;

      sessions.forEach((s) => {
        // This is a simplification. Usually we want total students enrolled in the course
        // For now, let's use the records count or a placeholder
        totalStudents +=
          s.attendanceRecords.length > 0 ? s.attendanceRecords.length : 0;
        presentStudents += s.attendanceRecords.filter(
          (r) => r.status === "PRESENT",
        ).length;
      });

      const avgAttendance =
        totalStudents > 0
          ? Math.round((presentStudents / totalStudents) * 100)
          : 0;

      return {
        totalSessions,
        activeSessions,
        avgAttendance,
        totalStudents,
        presentStudents,
      };
    } catch (error) {
      console.error("[AttendanceService] Error getting session stats:", error);
      throw error;
    }
  }

  /**
   * Get attendance records for a session
   */
  async getSessionRecords(
    sessionId: string,
    params: { page?: number; limit?: number } = {},
  ) {
    try {
      const { page = 1, limit = 50 } = params;
      const skip = (page - 1) * limit;

      const [records, total] = await Promise.all([
        prisma.attendanceRecord.findMany({
          where: { sessionId },
          include: {
            student: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                universityId: true,
                email: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
          skip,
          take: limit,
        }),
        prisma.attendanceRecord.count({ where: { sessionId } }),
      ]);

      return {
        data: records,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      console.error(
        "[AttendanceService] Error getting session records:",
        error,
      );
      throw error;
    }
  }

  /**
   * Scan QR Code and mark attendance with security checks
   */
  async scanQRCode(data: ScanQRCodeData) {
    const { userId, sessionId, qrCode, location, deviceFingerprint, photo } =
      data;

    // 1. Fetch Session & User
    const [session, user] = await Promise.all([
      prisma.attendanceSession.findUnique({
        where: { id: sessionId },
        include: { course: true },
      }),
      prisma.user.findUnique({
        where: { id: userId },
        select: { major: true, level: true },
      }),
    ]);

    if (!session) throw new Error("Session not found");
    if (!user) throw new Error("User not found");
    if (session.status !== "ACTIVE") throw new Error("Session is not active");
    if (session.qrCode !== qrCode) throw new Error("Invalid QR code");

    // Check authorization: Major/Level match OR Active Enrollment
    const isEnrolled = await prisma.courseEnrollment.findFirst({
      where: {
        studentId: userId,
        courseId: session.courseId,
        status: "ACTIVE",
      },
    });

    const isMatch =
      session.course.major === user.major &&
      session.course.level === user.level;

    if (!isEnrolled && !isMatch) {
      throw new Error(
        "You are not authorized to mark attendance for this course",
      );
    }

    // 2. Check if already marked
    const existingRecord = await prisma.attendanceRecord.findFirst({
      where: { sessionId, studentId: userId },
    });
    if (existingRecord) throw new Error("Attendance already marked");

    const security =
      (session.securitySettings as unknown as SecuritySettings) || {};

    // 3. Device Verification
    if (security.requireDeviceCheck && deviceFingerprint) {
      const registeredDevice = await prisma.deviceFingerprint.findFirst({
        where: {
          studentId: userId,
          fingerprint: deviceFingerprint,
          isActive: true,
        },
      });
      if (!registeredDevice) {
        throw new Error("Device not registered for this student");
      }
    }

    // 4. Face Verification
    if (security.requirePhoto && photo) {
      const student = await prisma.user.findUnique({
        where: { id: userId },
        select: { faceDescriptor: true },
      });

      if (student?.faceDescriptor) {
        const faceResult = await FaceService.verifyFace(
          photo,
          student.faceDescriptor as unknown as number[],
        );
        if (!faceResult.isMatch) {
          throw new Error("Face verification failed");
        }
      } else {
        throw new Error("Face ID not registered. Please set up in profile.");
      }
    }

    // 5. Fraud Score Calculation
    const registeredFingerprints = (
      await prisma.deviceFingerprint.findMany({
        where: { studentId: userId, isActive: true },
        select: { fingerprint: true },
      })
    ).map((d) => d.fingerprint);

    const fraudScore = calculateFraudScore({
      location,
      sessionLocation: {
        ...(session.location as unknown as LocationData),
        radius: security.proximityThreshold || 50,
      },
      deviceFingerprint,
      registeredFingerprints,
      sessionStartTime: session.startTime,
      sessionEndTime: session.endTime,
    });

    // 6. Log Fraud Alert if necessary
    if (fraudScore > 70) {
      await prisma.fraudAlert.create({
        data: {
          studentId: userId,
          sessionId: session.id,
          alertType: "FRAUD_DETECTED",
          severity: "HIGH",
          description: `High fraud score (${fraudScore}) detected during scan.`,
          metadata: { fraudScore, location, deviceFingerprint },
        },
      });
    }

    // 7. Create attendance record
    const record = await prisma.attendanceRecord.create({
      data: {
        sessionId,
        studentId: userId,
        courseId: session.courseId,
        status: "PRESENT",
        markedAt: new Date(),
        location: location ? JSON.parse(JSON.stringify(location)) : undefined,
        deviceFingerprint: deviceFingerprint || "unknown",
        fraudScore,
      },
      include: {
        student: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // 8. Emit real-time update
    socketService.emitAttendanceMarked({
      sessionId,
      studentId: String(userId),
      studentName: `${record.student.firstName} ${record.student.lastName}`,
      timestamp: new Date(),
      status: "PRESENT",
      location: location as any,
      fraudScore,
    });

    return record;
  }
}

export const attendanceService = new AttendanceService();
export default attendanceService;
