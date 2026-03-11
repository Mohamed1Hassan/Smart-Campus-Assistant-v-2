import { NextRequest, NextResponse } from "next/server";
import { MaterialServerService } from "@/services/material.server.service";
import { JWTUtils } from "@/utils/jwt";
import { handleApiError } from "@/utils/apiResponse";
import { unlink } from "fs/promises";
import { join } from "path";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const materialId = parseInt(id);
    if (isNaN(materialId)) {
      return NextResponse.json(
        { success: false, message: "Invalid material ID" },
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

    // Fetch material to check ownership and get file path
    const material = await MaterialServerService.getMaterialById(materialId);
    if (!material) {
      return NextResponse.json(
        { success: false, message: "Material not found" },
        { status: 404 },
      );
    }

    // Auth Check: Is this professor the owner of the course?
    if (
      payload.role.toLowerCase() !== "admin" &&
      material.course.professorId !== parseInt(payload.userId)
    ) {
      return NextResponse.json(
        { success: false, message: "Access denied" },
        { status: 403 },
      );
    }

    // Delete physical file if it's a FILE
    if (material.type === "FILE" && material.url.startsWith("/uploads/")) {
      try {
        const filePath = join(process.cwd(), "public", material.url);
        await unlink(filePath);
      } catch (fileError) {
        console.warn(
          `Failed to delete physical file: ${material.url}`,
          fileError,
        );
        // Continue even if file deletion fails
      }
    }

    await MaterialServerService.deleteMaterial(materialId);

    return NextResponse.json({
      success: true,
      message: "Material deleted successfully",
    });
  } catch (error: unknown) {
    return handleApiError(error, "API/materials/[id]");
  }
}
