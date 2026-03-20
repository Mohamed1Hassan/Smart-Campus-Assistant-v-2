import { NextRequest, NextResponse } from "next/server";
import AttendanceService from "@/services/attendance.server";
import prisma from "@/lib/db";
import { JWTUtils } from "@/utils/jwt";
import { createSessionSchema } from "@/lib/validations/attendance";
import { handleApiError } from "@/utils/apiResponse";

export async function POST(req: NextRequest) {
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

    const payload = JWTUtils.verifyAccessToken(token);
    if (payload.role !== "professor" && payload.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Insufficient permissions" },
        { status: 403 },
      );
    }

    const body = await req.json();
    const validation = createSessionSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Validation failed",
          errors: validation.error.format(),
        },
        { status: 400 },
      );
    }

    const session = await AttendanceService.createSession({
      ...validation.data,
      professorId: payload.userId,
      startTime: new Date(validation.data.startTime),
      endTime: new Date(validation.data.endTime),
    });

    return NextResponse.json(
      {
        success: true,
        message: "Session created successfully",
        data: session,
      },
      { status: 201 },
    );
  } catch (error: unknown) {
    return handleApiError(error, "API/Attendance/Sessions POST");
  }
}

export const dynamic = "force-dynamic";

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

    const payload = JWTUtils.verifyAccessToken(token);
    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get("courseId")
      ? parseInt(searchParams.get("courseId")!)
      : undefined;

    const filters: Record<string, unknown> = {
      status: searchParams.get("status") || undefined,
      startDate: searchParams.get("startDate")
        ? new Date(searchParams.get("startDate")!)
        : undefined,
      endDate: searchParams.get("endDate")
        ? new Date(searchParams.get("endDate")!)
        : undefined,
    };

    if (
      payload.role.toLowerCase() === "professor" ||
      payload.role.toLowerCase() === "admin"
    ) {
      if (payload.role.toLowerCase() === "professor") {
        filters.professorId = payload.userId;
      }
      if (courseId) filters.courseId = courseId;
      if (searchParams.get("professorId"))
        filters.professorId = searchParams.get("professorId");
    } else if (payload.role.toLowerCase() === "student") {
      const studentId = parseInt(payload.userId);

      // Get all active course enrollments for this student
      const enrollments = await prisma.courseEnrollment.findMany({
        where: {
          studentId: studentId,
          status: "ACTIVE",
        },
        select: { courseId: true },
      });

      const relevantCourseIds = enrollments.map((e) => e.courseId);

      if (relevantCourseIds.length === 0) {
        return NextResponse.json({ success: true, data: [] });
      }

      if (courseId) {
        if (!relevantCourseIds.includes(courseId)) {
          return NextResponse.json({
            success: false,
            message: "You are not enrolled in this course",
            data: [],
          });
        }
        filters.courseId = courseId;
      } else {
        filters.courseId = { in: relevantCourseIds };
      }
    }

    const sessions = await AttendanceService.getSessions(filters);

    return NextResponse.json({
      success: true,
      data: sessions,
    });
  } catch (error: unknown) {
    return handleApiError(error, "API/Attendance/Sessions GET");
  }
}
