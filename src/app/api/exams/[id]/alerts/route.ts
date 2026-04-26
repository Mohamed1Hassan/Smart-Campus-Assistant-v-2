import { NextRequest, NextResponse } from "next/server";
import { ExamService } from "@/services/exam.service";
import { handleApiError } from "@/utils/apiResponse";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const examId = parseInt(id);
    if (isNaN(examId)) {
      return NextResponse.json(
        { success: false, message: "Invalid exam ID" },
        { status: 400 },
      );
    }

    const alerts = await ExamService.getExamAlerts(examId);

    return NextResponse.json({
      success: true,
      data: alerts,
    });
  } catch (error: unknown) {
    return handleApiError(error, "API/exams/[id]/alerts");
  }
}
