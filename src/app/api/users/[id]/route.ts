import { NextRequest, NextResponse } from "next/server";
import { UserService } from "@/services/user.service";
import { JWTUtils } from "@/utils/jwt";
import { handleApiError } from "@/utils/apiResponse";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
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

    try {
      JWTUtils.verifyAccessToken(token);
    } catch {
      return NextResponse.json(
        { success: false, message: "Invalid or expired token" },
        { status: 401 },
      );
    }

    const resolvedParams = await params;
    const studentId = resolvedParams.id;

    // Optionally, check if the requester is a professor or admin
    // For now, anyone authenticated can view the basic public profile

    try {
      const studentProfile = await UserService.getUserProfile(studentId);

      // If the user isn't found
      if (!studentProfile) {
        return NextResponse.json(
          { success: false, message: "Student not found" },
          { status: 404 },
        );
      }

      // Get academic stats
      const studentStats = await UserService.getStudentStats(studentProfile.id);

      // Construct safe public profile object (no sensitive info like face ID)
      const publicProfile = {
        id: studentProfile.id,
        universityId: studentProfile.universityId,
        name: studentProfile.name,
        email: studentProfile.email,
        avatarUrl: studentProfile.avatarUrl,
        major: studentProfile.major,
        department: studentProfile.department,
        year: studentProfile.year,
        overallAttendance: studentStats.attendancePercentage || 0,
        gpa: studentStats.gpa || 0,
        completedCourses: studentStats.completedCourses || 0,
        totalCredits: studentStats.totalCredits || 0,
      };

      return NextResponse.json({
        success: true,
        message: "Profile retrieved successfully",
        data: publicProfile,
      });
    } catch {
      return NextResponse.json(
        { success: false, message: "Student not found or internal error" },
        { status: 404 },
      );
    }
  } catch (error: unknown) {
    return handleApiError(error, `API/users`);
  }
}
