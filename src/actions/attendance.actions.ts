"use server";

import { cookies } from "next/headers";
import { JWTUtils } from "../utils/jwt";
import prisma from "@/lib/db";
import { v4 as uuidv4 } from "uuid";
import AttendanceService from "../services/attendance.server";

/**
 * Helper to get the local database User ID from local JWT session
 */
async function getLocalUserId(): Promise<number> {
  const cookieStore = await cookies();
  const token = cookieStore.get("accessToken")?.value;

  if (!token) {
    throw new Error("Unauthorized");
  }

  try {
    const decoded = JWTUtils.verifyAccessToken(token);
    return parseInt(decoded.userId);
  } catch {
    throw new Error("Unauthorized: Session expired or invalid");
  }
}

const generateQRCode = (sessionId: string): string => {
  return `attendance-${sessionId}-${Date.now()}`;
};

// --- Server Actions ---

export interface CreateSessionData {
  courseId: number;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  location?: unknown;
  securitySettings?: unknown;
}

export async function createAttendanceSessionAction(data: CreateSessionData) {
  try {
    const localUserId = await getLocalUserId();

    // Verify course exists and user has access
    const course = await prisma.course.findFirst({
      where: {
        id: data.courseId,
        professorId: localUserId,
      },
    });

    if (!course) {
      return { success: false, error: "Course not found or access denied" };
    }

    const startTime = new Date(data.startTime);
    const endTime = new Date(data.endTime);

    if (startTime >= endTime)
      return { success: false, error: "Start time must be before end time" };

    // Create session
    const newSession = await prisma.attendanceSession.create({
      data: {
        courseId: data.courseId,
        professorId: localUserId,
        title: data.title,
        description: data.description || "",
        startTime,
        endTime,
        location: data.location
          ? JSON.parse(JSON.stringify(data.location))
          : undefined,
        securitySettings: data.securitySettings
          ? JSON.parse(JSON.stringify(data.securitySettings))
          : undefined,
        status: "SCHEDULED",
        qrCode: generateQRCode(uuidv4()), // We need an initial QR
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    return { success: true, data: JSON.parse(JSON.stringify(newSession)) };
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to create session";
    console.error("Create session error:", error);
    return { success: false, error: errorMessage };
  }
}

export async function getProfessorSessionsAction() {
  try {
    const localUserId = await getLocalUserId();

    const sessions = await prisma.attendanceSession.findMany({
      where: { professorId: localUserId },
      orderBy: { createdAt: "desc" },
      include: {
        course: {
          select: {
            courseName: true,
            courseCode: true,
          },
        },
        _count: {
          select: { attendanceRecords: true },
        },
      },
    });

    return { success: true, data: JSON.parse(JSON.stringify(sessions)) };
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to retrieve sessions";
    return { success: false, error: errorMessage };
  }
}

export async function getStudentSessionsAction() {
  try {
    const localUserId = await getLocalUserId();

    // Find all sessions for courses the student is enrolled in
    const sessions = await prisma.attendanceSession.findMany({
      where: {
        course: {
          enrollments: {
            some: {
              studentId: localUserId,
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      include: {
        course: {
          select: { courseName: true, courseCode: true },
        },
        attendanceRecords: {
          where: { studentId: localUserId },
        },
      },
    });

    return { success: true, data: JSON.parse(JSON.stringify(sessions)) };
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Failed to retrieve student sessions";
    return { success: false, error: errorMessage };
  }
}

export async function updateSessionStatusAction(
  sessionId: string,
  newStatus: "ACTIVE" | "COMPLETED" | "CANCELLED",
) {
  try {
    const localUserId = await getLocalUserId();

    const session = await prisma.attendanceSession.findUnique({
      where: { id: sessionId },
    });

    if (!session || session.professorId !== localUserId) {
      return { success: false, error: "Session not found or access denied" };
    }

    const updatedSession = await prisma.attendanceSession.update({
      where: { id: sessionId },
      data: {
        status: newStatus,
        updatedAt: new Date(),
      },
    });

    return { success: true, data: JSON.parse(JSON.stringify(updatedSession)) };
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Failed to update session status";
    return { success: false, error: errorMessage };
  }
}

// import { calculateFraudScore } from '../utils/security'; // Removed unused
// import { FaceService } from '../services/face.service'; // Removed unused

export async function scanQRCodeAction(data: {
  sessionId: string;
  qrCode: string;
  location?: { latitude: number; longitude: number; accuracy: number };
  deviceFingerprint?: string;
  photo?: string; // Base64 for face verification
}) {
  try {
    const localUserId = await getLocalUserId();

    // Delegate to unified service logic
    const record = await AttendanceService.scanQRCode({
      userId: localUserId,
      ...data,
    });

    return { success: true, data: JSON.parse(JSON.stringify(record)) };
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to scan QR code";
    console.error("Scan QR code error:", error);
    return { success: false, error: errorMessage };
  }
}
