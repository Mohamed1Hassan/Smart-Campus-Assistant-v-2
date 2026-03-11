import { NextRequest, NextResponse } from "next/server";
import { MaterialServerService } from "@/services/material.server.service";
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

    const materials = await MaterialServerService.getCourseMaterials(courseId);

    return NextResponse.json({
      success: true,
      data: materials,
    });
  } catch (error: unknown) {
    return handleApiError(error, "API/materials/course/[id]");
  }
}
