import { NextRequest, NextResponse } from "next/server";
import AuthService from "@/services/auth.service";
import { handleApiError } from "@/utils/apiResponse";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const cookieToken = req.cookies.get("refreshToken")?.value;
    const refreshToken = cookieToken || body.refreshToken;

    if (!refreshToken) {
      return NextResponse.json(
        { success: false, message: "Refresh token is required" },
        { status: 401 },
      );
    }

    const result = await AuthService.refreshToken({ refreshToken });

    const response = NextResponse.json({
      success: true,
      message: "Token refreshed successfully",
      data: {
        user: result.user,
        accessToken: result.accessToken,
        expiresIn: result.expiresIn,
      },
    });

    // Set new refresh token as HTTP-only cookie
    response.cookies.set("refreshToken", result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    });

    // Set new access token as HTTP-only cookie
    response.cookies.set("accessToken", result.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 3600, // 1 hour
      path: "/",
    });

    return response;
  } catch (error: unknown) {
    return handleApiError(error, "API/auth/refresh");
  }
}
