import { NextRequest, NextResponse } from "next/server";
import { getScheduleService } from "@/services/schedule.service";
import { JWTUtils } from "@/utils/jwt";
import { checkConflictSchema } from "@/lib/validations/schedule";
import { handleApiError } from "@/utils/apiResponse";

const scheduleService = getScheduleService();

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
    const validation = checkConflictSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Validation failed",
          errors: validation.error.issues.map((err) => ({
            field: err.path.join("."),
            message: err.message,
          })),
        },
        { status: 400 },
      );
    }

    const conflict = await scheduleService.checkScheduleConflict(
      validation.data.professorId,
      validation.data.dayOfWeek,
      validation.data.startTime,
      validation.data.endTime,
      validation.data.room,
      validation.data.excludeScheduleId,
    );

    return NextResponse.json({
      success: true,
      message: "Conflict check completed",
      data: conflict,
    });
  } catch (error: unknown) {
    return handleApiError(error, "API/schedule/check-conflict");
  }
}
