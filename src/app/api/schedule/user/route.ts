import { NextRequest, NextResponse } from "next/server";
import { getScheduleService } from "@/services/schedule.service";
import { JWTUtils } from "@/utils/jwt";
import { handleApiError } from "@/utils/apiResponse";

const scheduleService = getScheduleService();

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
    const userId = parseInt(payload.userId);
    const userRole = (payload.role as string).toUpperCase();

    const schedules = await scheduleService.getUserSchedule(
      userId,
      userRole as "STUDENT" | "PROFESSOR" | "ADMIN",
    );

    return NextResponse.json({
      success: true,
      data: schedules,
    });
  } catch (error: unknown) {
    return handleApiError(error, "API/schedule/user");
  }
}
