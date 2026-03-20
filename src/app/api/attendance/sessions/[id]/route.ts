import { NextRequest, NextResponse } from "next/server";
import AttendanceService from "@/services/attendance.server";
import { handleApiError } from "@/utils/apiResponse";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const session = await AttendanceService.getSessionById(id);
    if (!session) {
      return NextResponse.json(
        { success: false, message: "Session not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: session,
    });
  } catch (error: unknown) {
    return handleApiError(error, "API/Attendance/Sessions/ID GET");
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const body = await req.json();
    const session = await AttendanceService.updateSession(id, body);
    return NextResponse.json({
      success: true,
      data: session,
      message: "Session updated",
    });
  } catch (error: unknown) {
    return handleApiError(error, "API/Attendance/Sessions/ID PATCH");
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    await AttendanceService.deleteSession(id);
    return NextResponse.json({ success: true, message: "Session deleted" });
  } catch (error: unknown) {
    return handleApiError(error, "API/Attendance/Sessions/ID DELETE");
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const { action } = await req.json();

    if (action === "start") {
      const session = await AttendanceService.startSession(id);
      return NextResponse.json({
        success: true,
        data: session,
        message: "Session started",
      });
    } else if (action === "stop") {
      const session = await AttendanceService.stopSession(id);
      return NextResponse.json({
        success: true,
        data: session,
        message: "Session stopped",
      });
    } else if (action === "rotate") {
      const session = await AttendanceService.generateQRCode(id);
      return NextResponse.json({
        success: true,
        data: session,
        message: "QR code rotated",
      });
    }

    return NextResponse.json(
      { success: false, message: "Invalid action" },
      { status: 400 },
    );
  } catch (error: unknown) {
    return handleApiError(error, "API/Attendance/Sessions/ID POST");
  }
}
