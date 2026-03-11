import { NextRequest, NextResponse } from "next/server";
import { QuizServerService } from "@/services/quiz.server.service";
import { JWTUtils } from "@/utils/jwt";
import { handleApiError } from "@/utils/apiResponse";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const quizId = parseInt(id);
    if (isNaN(quizId)) {
      return NextResponse.json(
        { success: false, message: "Invalid quiz ID" },
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
    if (
      payload.role.toLowerCase() !== "professor" &&
      payload.role.toLowerCase() !== "admin"
    ) {
      return NextResponse.json(
        { success: false, message: "Insufficient permissions" },
        { status: 403 },
      );
    }

    const results = await QuizServerService.getQuizResults(quizId);

    return NextResponse.json({
      success: true,
      data: results,
    });
  } catch (error: unknown) {
    return handleApiError(error, "API/quizzes/[id]/results");
  }
}
