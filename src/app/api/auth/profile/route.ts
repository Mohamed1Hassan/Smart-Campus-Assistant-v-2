import { NextRequest, NextResponse } from "next/server";
import AuthService from "@/services/auth.service";
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

    const user = await AuthService.getUserById(payload.userId);

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "User profile retrieved successfully",
      data: { user },
    });
  } catch (error: unknown) {
    return handleApiError(error, "API/auth/profile");
  }
}

export async function PUT(req: NextRequest) {
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

    const body = await req.json();

    // In a real scenario, you'd use UserService.updateProfile here.
    // For now, we follow the original controller logic (stubbed).
    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
      data: {
        user: { id: payload.userId, ...body },
      },
    });
  } catch (error: unknown) {
    return handleApiError(error, "API/auth/profile");
  }
}
