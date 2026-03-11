import prisma from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { JWTUtils } from "@/utils/jwt";
import { handleApiError } from "@/utils/apiResponse";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
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
    } catch {
      return NextResponse.json(
        { success: false, message: "Invalid or expired token" },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(req.url);
    const studentIdParam = searchParams.get("studentId");

    if (!studentIdParam) {
      return NextResponse.json(
        { success: false, message: "Missing studentId parameter" },
        { status: 400 },
      );
    }

    const studentId = parseInt(studentIdParam);

    // Security check: Students can only view their own records unless they are ADMIN or PROFESSOR
    if (
      payload.role.toUpperCase() === "STUDENT" &&
      String(payload.userId) !== String(studentId)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Access denied. You can only view your own records.",
        },
        { status: 403 },
      );
    }

    const records = await prisma.attendanceRecord.findMany({
      where: { studentId },
      include: {
        course: {
          select: {
            courseCode: true,
            courseName: true,
          },
        },
        qrCode: {
          select: {
            title: true,
            createdAt: true,
          },
        },
      },
      orderBy: { markedAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      data: records,
    });
  } catch (error: unknown) {
    return handleApiError(error, "API/attendance/records");
  }
}
