import { NextRequest, NextResponse } from "next/server";
import AttendanceService from "@/services/attendance.server";
import { JWTUtils } from "@/utils/jwt";
import { scanQRCodeSchema } from "@/lib/validations/attendance";
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
    const userId = parseInt(payload.userId);

    const body = await req.json();
    const validation = scanQRCodeSchema.safeParse(body);
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

    // Delegate to unified service logic
    try {
      const record = await AttendanceService.scanQRCode({
        userId,
        ...validation.data,
      });

      return NextResponse.json({
        success: true,
        message: "Attendance marked successfully",
        data: record,
      });
    } catch (serviceError: unknown) {
      const message =
        serviceError instanceof Error
          ? serviceError.message
          : "Failed to mark attendance";
      return NextResponse.json(
        {
          success: false,
          message: message,
        },
        { status: 400 },
      );
    }
  } catch (error: unknown) {
    return handleApiError(error, "API/attendance/scan");
  }
}
