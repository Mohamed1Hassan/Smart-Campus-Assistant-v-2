import { NextRequest, NextResponse } from "next/server";
import { MaterialServerService } from "@/services/material.server.service";
import { JWTUtils } from "@/utils/jwt";
import { handleApiError } from "@/utils/apiResponse";
import CourseService from "@/services/course.service";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

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

    const formData = await req.formData();
    const courseId = formData.get("courseId") as string;
    const title = formData.get("title") as string;
    const description = (formData.get("description") as string) || undefined;
    const file = formData.get("file") as File;

    if (!courseId || !title || !file) {
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

    // Handle File saving
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const filename = `${Date.now()}-${file.name.replace(/\s+/g, "_")}`;
    const relativePath = `/uploads/materials/${filename}`;
    const uploadDir = join(process.cwd(), "public", "uploads", "materials");

    await mkdir(uploadDir, { recursive: true });
    const filePath = join(uploadDir, filename);
    await writeFile(filePath, buffer);

    const material = await MaterialServerService.createMaterial({
      courseId: parseInt(courseId),
      title,
      description,
      type: "FILE",
      url: relativePath,
      fileSize: file.size,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Material uploaded successfully",
        data: material,
      },
      { status: 201 },
    );
  } catch (error: unknown) {
    return handleApiError(error, "API/materials/upload");
  }
}
