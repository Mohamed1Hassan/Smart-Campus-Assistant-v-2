import { NextRequest, NextResponse } from "next/server";
import CourseService from "@/services/course.service";
import { JWTUtils } from "@/utils/jwt";
import { createCourseSchema } from "@/lib/validations/course";
import { handleApiError } from "@/utils/apiResponse";
import { getCourseImage } from "@/utils/courseImages";
import { SemesterType } from "@prisma/client";

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

    let payload;
    try {
      payload = JWTUtils.verifyAccessToken(token);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Invalid token";
      return NextResponse.json(
        { success: false, message: errorMessage },
        { status: 401 },
      );
    }

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
    const validation = createCourseSchema.safeParse(body);
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

    const course = await CourseService.createCourse({
      ...validation.data,
      professorId: parseInt(payload.userId),
      semester: ((validation.data as { semester?: string }).semester ||
        "FALL") as SemesterType,
      academicYear:
        (validation.data as { academicYear?: string }).academicYear ||
        "2024/2025",
    });

    return NextResponse.json(
      {
        success: true,
        message: "Course created successfully",
        data: course,
      },
      { status: 201 },
    );
  } catch (error: unknown) {
    return handleApiError(error, "API/courses");
  }
}

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.substring(7)
      : null;

    let userId: number | undefined;
    let userRole: string | undefined;

    if (token) {
      try {
        const payload = JWTUtils.verifyAccessToken(token);
        userId = parseInt(payload.userId);
        userRole = payload.role.toLowerCase();
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : "Invalid token";
        console.error(
          "Token verification failed in GET /api/courses:",
          errorMessage,
        );
        return NextResponse.json(
          { success: false, message: errorMessage },
          { status: 401 },
        );
      }
    }

    const { searchParams } = new URL(req.url);
    let professorId = searchParams.get("professorId")
      ? parseInt(searchParams.get("professorId")!)
      : undefined;
    const isActive =
      searchParams.get("isActive") === "true"
        ? true
        : searchParams.get("isActive") === "false"
          ? false
          : undefined;
    const summary = searchParams.get("summary") === "true";

    // Enforce isolation for Professors: they only see their own courses
    if (userRole === "professor" && userId) {
      professorId = userId;
    }

    const courses = await CourseService.getAllCourses(
      professorId,
      isActive,
      summary,
    );

    // Map to include coverImage if not a summary
    const data = summary
      ? courses
      : courses.map((course) => ({
          ...course,
          coverImage: getCourseImage(course.courseName, course.id),
        }));

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error: unknown) {
    return handleApiError(error, "API/courses");
  }
}
