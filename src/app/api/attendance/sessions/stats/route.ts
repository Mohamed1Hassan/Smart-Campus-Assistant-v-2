import { NextRequest, NextResponse } from "next/server";
import AttendanceService from "@/services/attendance.server";
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

    const payload = JWTUtils.verifyAccessToken(token);
    const professorId =
      payload.role === "professor" ? parseInt(payload.userId) : undefined;

    const stats = await AttendanceService.getSessionStats(professorId);

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error: unknown) {
    return handleApiError(error, "API/Attendance/Sessions/Stats GET");
  }
}
