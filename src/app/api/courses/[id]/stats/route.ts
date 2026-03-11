import { NextRequest, NextResponse } from "next/server";
import CourseService from "@/services/course.service";
import { JWTUtils } from "@/utils/jwt";
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
    const course = await CourseService.getCourseById(courseId);

    if (!course) {
      return NextResponse.json(
        { success: false, message: "Course not found" },
        { status: 404 },
      );
    }

    if (
      payload.role !== "admin" &&
      course.professorId !== parseInt(payload.userId)
    ) {
      return NextResponse.json(
        { success: false, message: "Access denied" },
        { status: 403 },
      );
    }

    const stats = await CourseService.getCourseStats(courseId);

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error: unknown) {
    return handleApiError(error, "API/courses/[id]/stats");
  }
}
