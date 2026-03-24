import { NextRequest, NextResponse } from "next/server";
import { getScheduleService } from "@/services/schedule.service";
import { JWTUtils } from "@/utils/jwt";
import { scheduleSchema } from "@/lib/validations/schedule";
import { handleApiError } from "@/utils/apiResponse";

const scheduleService = getScheduleService();

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const professorId = searchParams.get("professorId")
      ? parseInt(searchParams.get("professorId")!)
      : undefined;
    const courseId = searchParams.get("courseId")
      ? parseInt(searchParams.get("courseId")!)
      : undefined;
    const dayOfWeek = searchParams.get("dayOfWeek")
      ? parseInt(searchParams.get("dayOfWeek")!)
      : undefined;
    const isActive =
      searchParams.get("isActive") === "true"
        ? true
        : searchParams.get("isActive") === "false"
          ? false
          : undefined;
    const major = searchParams.get("major") || undefined;
    const level = searchParams.get("level")
      ? parseInt(searchParams.get("level")!)
      : undefined;

    const schedules = await scheduleService.getAllSchedules(
      professorId,
      courseId,
      dayOfWeek,
      isActive,
      major,
      level,
    );

    return NextResponse.json({
      success: true,
      data: schedules,
    });
  } catch (error: unknown) {
    return handleApiError(error, "API/schedule");
  }
}

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
    const role = payload.role?.toLowerCase() || "";
    if (role !== "professor" && role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Insufficient permissions" },
        { status: 403 },
      );
    }

    const body = await req.json();
    const validation = scheduleSchema.safeParse(body);
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

    const schedule = await scheduleService.createSchedule(validation.data);

    return NextResponse.json(
      {
        success: true,
        message: "Schedule created successfully",
        data: schedule,
      },
      { status: 201 },
    );
  } catch (error: unknown) {
    return handleApiError(error, "API/schedule");
  }
}
