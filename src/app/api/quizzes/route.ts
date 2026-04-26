import { NextRequest, NextResponse } from "next/server";
import { QuizServerService } from "@/services/quiz.server.service";
import { JWTUtils } from "@/utils/jwt";
import { handleApiError } from "@/utils/apiResponse";
import CourseService from "@/services/course.service";

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
    if (
      payload.role.toLowerCase() !== "professor" &&
      payload.role.toLowerCase() !== "admin"
    ) {
      return NextResponse.json(
        { success: false, message: "Insufficient permissions" },
        { status: 403 },
      );
    }

    const body = await req.json();
    const { courseId } = body;

    if (!courseId) {
      return NextResponse.json(
        { success: false, message: "Missing courseId" },
        { status: 400 },
      );
    }

    // Verify professor owns or is assigned to the course
    const course = await CourseService.getCourseById(parseInt(courseId));
    
    const tokenUserId = parseInt(payload.userId);
    const isOwner = course?.professorId === tokenUserId;
    const isAssigned = course?.schedules?.some(s => s.professorId === tokenUserId);

    if (
      !course ||
      (payload.role.toLowerCase() !== "admin" && !isOwner && !isAssigned)
    ) {
      console.warn("[API/quizzes] Access Denied:", {
        courseId,
        courseProfessorId: course?.professorId,
        tokenUserId,
        isAssigned,
        role: payload.role
      });
      return NextResponse.json(
        { 
          success: false, 
          message: `Access Denied: You (ID ${tokenUserId}) are not authorized to create quizzes for this course.` 
        },
        { status: 403 },
      );
    }

    const quiz = await QuizServerService.createQuiz({
      ...body,
      professorId: parseInt(payload.userId),
      courseId: parseInt(courseId),
    });

    return NextResponse.json(
      {
        success: true,
        message: "Quiz created successfully",
        data: quiz,
      },
      { status: 201 },
    );
  } catch (error: unknown) {
    return handleApiError(error, "API/quizzes");
  }
}
