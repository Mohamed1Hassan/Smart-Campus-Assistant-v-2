import { NextRequest, NextResponse } from "next/server";
import { CourseService } from "@/services/course.service";
import { JWTUtils } from "@/utils/jwt";
import { SemesterType } from "@prisma/client";
import { handleApiError } from "@/utils/apiResponse";

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate & Authorize
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
    if (payload.role.toLowerCase() !== "admin") {
      return NextResponse.json(
        { success: false, message: "Insufficient permissions" },
        { status: 403 },
      );
    }

    // Parse the body
    const body = await req.json();
    const { oldSemester, oldYear, newSemester, newYear } = body;

    // Validate inputs
    if (!oldSemester || !oldYear || !newSemester || !newYear) {
      return NextResponse.json(
        { error: "Missing required fields for rollover." },
        { status: 400 },
      );
    }

    // Validate enum values
    const validSemesters = ["FALL", "SPRING", "SUMMER"];
    if (
      !validSemesters.includes(oldSemester) ||
      !validSemesters.includes(newSemester)
    ) {
      return NextResponse.json(
        { error: "Invalid semester type provided." },
        { status: 400 },
      );
    }

    // 2. Execute Rollover
    const coursesCount = await CourseService.rolloverCoursesToNewSemester(
      oldSemester as SemesterType,
      oldYear,
      newSemester as SemesterType,
      newYear,
    );

    // 3. Update the global ActiveSemester (If we had a Settings table, we'd update it here)
    // For this implementation, we rely on filtering by active/archived courses.

    return NextResponse.json({
      success: true,
      message: `Successfully rolled over ${coursesCount} courses to ${newSemester} ${newYear}.`,
    });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
