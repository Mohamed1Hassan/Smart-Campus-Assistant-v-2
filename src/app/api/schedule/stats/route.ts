import { NextRequest, NextResponse } from "next/server";
import { getScheduleService } from "@/services/schedule.service";

const scheduleService = getScheduleService();

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const professorId = searchParams.get("professorId")
      ? parseInt(searchParams.get("professorId")!)
      : undefined;

    const stats = await scheduleService.getScheduleStats(professorId);

    return NextResponse.json({
      success: true,
      message: "Schedule statistics retrieved successfully",
      data: stats,
    });
  } catch (error: unknown) {
    console.error("[API/Schedule/Stats] GET Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}
