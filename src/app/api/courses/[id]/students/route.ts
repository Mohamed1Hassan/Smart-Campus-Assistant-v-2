import { NextRequest, NextResponse } from "next/server";
import CourseSrv from "@/services/course.service";
import { JWTUtils } from "@/utils/jwt";
import { enrollStudentSchema } from "@/lib/validations/course";
import { handleApiError } from "@/utils/apiResponse";
import { EnrollmentStatus } from "@prisma/client";

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

    const { searchParams } = new URL(req.url);
    const status =
      (searchParams.get("status") as EnrollmentStatus) || undefined;

    const enrollments = await CourseSrv.getEnrolledStudents(courseId, status);

    return NextResponse.json({
      success: true,
      data: enrollments,
    });
  } catch (error: unknown) {
    return handleApiError(error, "API/courses/[id]/students");
  }
}

export async function POST(
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
    const body = await req.json();
    const validation = enrollStudentSchema.safeParse(body);

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

    const { studentId } = validation.data;

    // Students can only enroll themselves
    if (payload.role === "student" && parseInt(payload.userId) !== studentId) {
      return NextResponse.json(
        { success: false, message: "Access denied" },
        { status: 403 },
      );
    }

    const enrollment = await CourseSrv.enrollStudent({ studentId, courseId });

    return NextResponse.json(
      {
        success: true,
        message: "Student enrolled successfully",
        data: enrollment,
      },
      { status: 201 },
    );
  } catch (error: unknown) {
    return handleApiError(error, "API/courses/[id]/students");
  }
}
