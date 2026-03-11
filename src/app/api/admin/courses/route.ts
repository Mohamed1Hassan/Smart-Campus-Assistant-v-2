import { NextRequest, NextResponse } from "next/server";
import { CourseService } from "@/services/course.service";
import { JWTUtils } from "@/utils/jwt";
import { handleApiError } from "@/utils/apiResponse";

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.substring(7)
      : null;

    if (!token)
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 },
      );

    let payload;
    try {
      payload = JWTUtils.verifyAccessToken(token);
    } catch {
      return NextResponse.json(
        { success: false, message: "Invalid token" },
        { status: 401 },
      );
    }

    if (payload.role.toUpperCase() !== "ADMIN") {
      return NextResponse.json(
        { success: false, message: "Access denied" },
        { status: 403 },
      );
    }

    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action");

    // Special action to get professors for the dropdown
    if (action === "professors") {
      const professors = await CourseService.getProfessors();
      return NextResponse.json({ success: true, data: professors });
    }

    // Special action to get unique majors for the filter
    if (action === "majors") {
      const majors = await CourseService.getUniqueMajors();
      return NextResponse.json({ success: true, data: majors });
    }

    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const query = searchParams.get("query") || undefined;
    const major = searchParams.get("major") || undefined;
    const semester = searchParams.get("semester") || undefined;
    const levelParam = searchParams.get("level");
    const level =
      levelParam && !isNaN(parseInt(levelParam))
        ? parseInt(levelParam)
        : undefined;
    const isActive =
      searchParams.get("isActive") === "true"
        ? true
        : searchParams.get("isActive") === "false"
          ? false
          : undefined;
    const isArchived =
      searchParams.get("isArchived") === "true"
        ? true
        : searchParams.get("isArchived") === "false"
          ? false
          : undefined;
    const includeSchedules = searchParams.get("includeSchedules") === "true";

    const result = await CourseService.searchCourses({
      query,
      isActive,
      major,
      semester,
      level,
      page,
      limit,
      includeSchedules,
      isArchived,
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: unknown) {
    return handleApiError(error, "API/admin/courses");
  }
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.substring(7)
      : null;

    if (!token)
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 },
      );

    let payload;
    try {
      payload = JWTUtils.verifyAccessToken(token);
    } catch {
      return NextResponse.json(
        { success: false, message: "Invalid token" },
        { status: 401 },
      );
    }

    if (payload.role.toUpperCase() !== "ADMIN") {
      return NextResponse.json(
        { success: false, message: "Access denied" },
        { status: 403 },
      );
    }

    const courseData = await req.json();
    const newCourse = await CourseService.createCourse(courseData);

    return NextResponse.json({
      success: true,
      message: "Course created successfully",
      data: newCourse,
    });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to create course";
    return NextResponse.json(
      {
        success: false,
        message: errorMessage,
      },
      { status: 400 },
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.substring(7)
      : null;

    if (!token)
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 },
      );

    let payload;
    try {
      payload = JWTUtils.verifyAccessToken(token);
    } catch {
      return NextResponse.json(
        { success: false, message: "Invalid token" },
        { status: 401 },
      );
    }

    if (payload.role.toUpperCase() !== "ADMIN") {
      return NextResponse.json(
        { success: false, message: "Access denied" },
        { status: 403 },
      );
    }

    const { courseId, ...updateData } = await req.json();

    if (courseId === undefined) {
      throw new Error("Course ID is required");
    }

    const id = typeof courseId === "string" ? parseInt(courseId) : courseId;
    const updatedCourse = await CourseService.updateCourse(id, updateData);

    return NextResponse.json({
      success: true,
      message: "Course updated successfully",
      data: updatedCourse,
    });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to update course";
    return NextResponse.json(
      {
        success: false,
        message: errorMessage,
      },
      { status: 400 },
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.substring(7)
      : null;

    if (!token)
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 },
      );

    let payload;
    try {
      payload = JWTUtils.verifyAccessToken(token);
    } catch {
      return NextResponse.json(
        { success: false, message: "Invalid token" },
        { status: 401 },
      );
    }

    if (payload.role.toUpperCase() !== "ADMIN") {
      return NextResponse.json(
        { success: false, message: "Access denied" },
        { status: 403 },
      );
    }

    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get("courseId");

    if (!courseId) {
      throw new Error("Course ID is required");
    }

    // Using updateCourse with isArchived: true for soft delete or deleteCourse
    // Let's use CourseService.deleteCourse which currently sets isActive: false
    // I will update it to actually archive it properly.
    await CourseService.deleteCourse(parseInt(courseId));

    return NextResponse.json({
      success: true,
      message: "Course archived successfully",
    });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to delete course";
    return NextResponse.json(
      {
        success: false,
        message: errorMessage,
      },
      { status: 400 },
    );
  }
}
