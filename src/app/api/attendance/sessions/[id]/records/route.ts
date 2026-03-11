import { NextRequest, NextResponse } from "next/server";
import AttendanceService from "@/services/attendance.server";
import { handleApiError } from "@/utils/apiResponse";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");

    const records = await AttendanceService.getSessionRecords(id, {
      page,
      limit,
    });

    return NextResponse.json({
      success: true,
      data: records,
    });
  } catch (error: unknown) {
    return handleApiError(error, "API/Attendance/Sessions/Records GET");
  }
}
