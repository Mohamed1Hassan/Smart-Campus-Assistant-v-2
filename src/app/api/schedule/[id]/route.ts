import { NextRequest, NextResponse } from "next/server";
import { getScheduleService } from "@/services/schedule.service";
import { JWTUtils } from "@/utils/jwt";
import { updateScheduleSchema } from "@/lib/validations/schedule";
import { handleApiError } from "@/utils/apiResponse";

const scheduleService = getScheduleService();

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const scheduleId = parseInt(id);
    if (isNaN(scheduleId)) {
      return NextResponse.json(
        { success: false, message: "Invalid schedule ID" },
        { status: 400 },
      );
    }

    const schedule = await scheduleService.getScheduleById(scheduleId);
    if (!schedule) {
      return NextResponse.json(
        { success: false, message: "Schedule not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: schedule,
    });
  } catch (error: unknown) {
    return handleApiError(error, "API/schedule/[id]");
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const scheduleId = parseInt(id);
    if (isNaN(scheduleId)) {
      return NextResponse.json(
        { success: false, message: "Invalid schedule ID" },
        { status: 400 },
      );
    }

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
    const schedule = await scheduleService.getScheduleById(scheduleId);
    if (!schedule) {
      return NextResponse.json(
        { success: false, message: "Schedule not found" },
        { status: 404 },
      );
    }

    const role = payload.role?.toLowerCase() || "";
    if (
      role !== "admin" &&
      schedule.professorId !== parseInt(payload.userId)
    ) {
      return NextResponse.json(
        { success: false, message: "Access denied" },
        { status: 403 },
      );
    }

    const body = await req.json();
    const validation = updateScheduleSchema.safeParse(body);
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

    const updatedSchedule = await scheduleService.updateSchedule(
      scheduleId,
      validation.data,
    );

    return NextResponse.json({
      success: true,
      message: "Schedule updated successfully",
      data: updatedSchedule,
    });
  } catch (error: unknown) {
    return handleApiError(error, "API/schedule/[id]");
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const scheduleId = parseInt(id);
    if (isNaN(scheduleId)) {
      return NextResponse.json(
        { success: false, message: "Invalid schedule ID" },
        { status: 400 },
      );
    }

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
    const schedule = await scheduleService.getScheduleById(scheduleId);
    if (!schedule) {
      return NextResponse.json(
        { success: false, message: "Schedule not found" },
        { status: 404 },
      );
    }

    const role = payload.role?.toLowerCase() || "";
    if (
      role !== "admin" &&
      schedule.professorId !== parseInt(payload.userId)
    ) {
      return NextResponse.json(
        { success: false, message: "Access denied" },
        { status: 403 },
      );
    }

    await scheduleService.deleteSchedule(scheduleId);

    return NextResponse.json({
      success: true,
      message: "Schedule deleted successfully",
    });
  } catch (error: unknown) {
    return handleApiError(error, "API/schedule/[id]");
  }
}
