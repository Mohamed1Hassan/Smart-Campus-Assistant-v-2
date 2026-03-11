import { NextRequest, NextResponse } from "next/server";
import AttendanceStatsService from "@/services/attendanceStats.service";
import prisma from "@/lib/db";
import { JWTUtils } from "@/utils/jwt";
import { handleApiError } from "@/utils/apiResponse";

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.substring(7)
      : null;

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 },
      );
    }

    let payload;
    try {
      payload = JWTUtils.verifyAccessToken(token);
    } catch {
      return NextResponse.json(
        { success: false, message: "Invalid or expired token" },
        { status: 401 },
      );
    }

    if (payload.role.toLowerCase() !== "student") {
      return NextResponse.json(
        { success: false, message: "Access denied. Student role required." },
        { status: 403 },
      );
    }

    const studentId = parseInt(payload.userId);

    // Get enrollments to iterate and get detailed stats + professor name
    const enrollments = await prisma.courseEnrollment.findMany({
      where: {
        studentId,
        status: "ACTIVE",
      },
      include: {
        course: {
          include: {
            professor: true,
          },
        },
      },
    });

    const courseAttendanceData = await Promise.all(
      enrollments.map(async (enrollment) => {
        const stats =
          await AttendanceStatsService.getStudentCourseAttendanceStats(
            studentId,
            enrollment.courseId,
          );

        return {
          id: String(enrollment.course.id),
          courseCode: enrollment.course.courseCode,
          courseName: enrollment.course.courseName,
          attendancePercentage: stats.attendancePercentage,
          totalSessions: stats.totalClasses,
          attendedSessions: stats.attendedClasses,
          lateSessions: stats.lateArrivals,
          absentSessions: stats.missedClasses,
          instructor: `${enrollment.course.professor.firstName} ${enrollment.course.professor.lastName}`,
        };
      }),
    );

    return NextResponse.json({
      success: true,
      data: courseAttendanceData,
    });
  } catch (error: unknown) {
    return handleApiError(error, "API/attendance/courses");
  }
}
