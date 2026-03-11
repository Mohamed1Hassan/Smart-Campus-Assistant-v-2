import { NextRequest, NextResponse } from "next/server";
import { QuizServerService } from "@/services/quiz.server.service";
import { handleApiError } from "@/utils/apiResponse";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const courseId = parseInt(id);
    if (isNaN(courseId)) {
      return NextResponse.json(
        { success: false, message: "Invalid course ID" },
        { status: 400 },
      );
    }

    const quizzes = await QuizServerService.getQuizzesByCourse(courseId);

    return NextResponse.json({
      success: true,
      data: quizzes,
    });
  } catch (error: unknown) {
    return handleApiError(error, "API/quizzes/course/[id]");
  }
}
