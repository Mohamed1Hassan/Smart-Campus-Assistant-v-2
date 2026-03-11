import { NextRequest, NextResponse } from "next/server";
import AttendanceService from "@/services/attendance.server";
import { handleApiError } from "@/utils/apiResponse";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const session = await AttendanceService.pauseSession(id);
    return NextResponse.json({ success: true, data: session });
  } catch (error: unknown) {
    return handleApiError(error, "API/Attendance/Sessions/Pause");
  }
}
