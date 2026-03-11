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

    const user = await UserService.getUserProfile(payload.userId);

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User profile not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Profile retrieved successfully",
      data: { user },
    });
  } catch (error: unknown) {
    return handleApiError(error, "API/users/profile");
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

    // Ensure the user is updating their own profile
    const updatedUser = await UserService.updateProfile({
      ...body,
      userId: payload.userId,
    });

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
      data: { user: updatedUser },
    });
  } catch (error: unknown) {
    return handleApiError(error, "API/users/profile");
  }
}
