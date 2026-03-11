import prisma from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { AttendanceStatsService } from "@/services/attendanceStats.service";
import { JWTUtils } from "@/utils/jwt";
import { handleApiError } from "@/utils/apiResponse";

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

    let payload;
    try {
      payload = JWTUtils.verifyAccessToken(token);
    } catch {
      return NextResponse.json(
        { success: false, message: "Invalid or expired token" },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(req.url);
    const userIdParam = searchParams.get("userId");

    if (!userIdParam) {
      return NextResponse.json(
        { success: false, message: "Missing userId parameter" },
        { status: 400 },
      );
    }

    let studentDBId: number;

    // If the parameter looks like a University ID (long string)
    if (userIdParam.length > 5) {
      const user = await prisma.user.findUnique({
        where: { universityId: userIdParam },
      });
      if (!user) {
        return NextResponse.json(
          { success: false, message: "User not found" },
          { status: 404 },
        );
      }
      studentDBId = user.id;
    } else {
      studentDBId = parseInt(userIdParam);
    }

    // Security check: Students can only view their own stats
    if (
      payload.role.toUpperCase() === "STUDENT" &&
      String(payload.userId) !== String(studentDBId)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Access denied. You can only view your own statistics.",
        },
        { status: 403 },
      );
    }

    const stats =
      await AttendanceStatsService.getStudentAttendanceOverview(studentDBId);

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error: unknown) {
    return handleApiError(error, "API/attendance/stats");
  }
}
