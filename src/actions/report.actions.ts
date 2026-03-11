"use server";

import { cookies } from "next/headers";
import { JWTUtils } from "../utils/jwt";
import { ReportService } from "../services/report.service";
import prisma from "@/lib/db";

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

export async function generateAttendanceReportAction(sessionId: string) {
  try {
    const localUserId = await getLocalUserId();

    // Validate professor has access to the session
    const session = await prisma.attendanceSession.findUnique({
      where: { id: sessionId },
      include: {
        course: true,
        attendanceRecords: {
          include: {
            student: true,
          },
        },
      },
    });

    if (!session || session.professorId !== localUserId) {
      return { success: false, error: "Session not found or unauthorized" };
    }

    // Map records to expected service format
    const records = session.attendanceRecords.map((record) => ({
      studentName: `${record.student.firstName} ${record.student.lastName}`,
      universityId: record.student.universityId,
      email: record.student.email,
      status: record.status,
      markedAt: record.markedAt,
      fraudScore: record.fraudScore || 0,
      deviceInfo: record.deviceFingerprint || undefined,
    }));

    const reportData = {
      session: {
        title: session.title || "Untitled Session",
        courseName: session.course.courseName,
        courseCode: session.course.courseCode,
        date: session.startTime,
        professorName: `Professor ID: ${session.professorId}`,
      },
      records,
    };

    // Generate Excel File Buffer
    const buffer = await ReportService.generateAttendanceReport(reportData);

    // We cannot serialize a Buffer object directly back to a Next.js Server Action
    // without converting it to base64.
    const base64Buffer = buffer.toString("base64");

    return {
      success: true,
      base64Data: base64Buffer,
      filename: `Attendance-${session.course.courseCode}-${new Date().toISOString().split("T")[0]}.xlsx`,
    };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to generate report";
    return { success: false, error: message };
  }
}
