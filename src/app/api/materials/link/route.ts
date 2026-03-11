import { NextRequest, NextResponse } from "next/server";
import { MaterialServerService } from "@/services/material.server.service";
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
    const { courseId, title, url, description } = body;

    if (!courseId || !title || !url) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 },
      );
    }

    // Verify professor owns the course
    const course = await CourseService.getCourseById(parseInt(courseId));
    if (
      !course ||
      (payload.role.toLowerCase() !== "admin" &&
        course.professorId !== parseInt(payload.userId))
    ) {
      return NextResponse.json(
        { success: false, message: "Access denied to this course" },
        { status: 403 },
      );
    }

    const material = await MaterialServerService.createMaterial({
      courseId: parseInt(courseId),
      title,
      url,
      description,
      type: "LINK",
    });

    return NextResponse.json(
      {
        success: true,
        message: "Link added successfully",
        data: material,
      },
      { status: 201 },
    );
  } catch (error: unknown) {
    return handleApiError(error, "API/materials/link");
  }
}
