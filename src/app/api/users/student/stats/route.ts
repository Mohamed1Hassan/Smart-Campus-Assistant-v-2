import { NextRequest, NextResponse } from "next/server";
import { UserService } from "@/services/user.service";
import { JWTUtils } from "@/utils/jwt";
import { handleApiError } from "@/utils/apiResponse";

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

    // Role-based access control: Only students can access student stats
    if (payload.role.toLowerCase() !== "student") {
      return NextResponse.json(
        { success: false, message: "Access denied. Student role required." },
        { status: 403 },
      );
    }

    const stats = await UserService.getStudentStats(payload.userId);

    return NextResponse.json({
      success: true,
      message: "Student statistics retrieved successfully",
      data: stats,
    });
  } catch (error: unknown) {
    return handleApiError(error, "API/users/student/stats");
  }
}
