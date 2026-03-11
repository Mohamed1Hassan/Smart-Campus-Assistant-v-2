import { NextRequest, NextResponse } from "next/server";
import AuthService from "@/services/auth.service";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const cookieToken = req.cookies.get("refreshToken")?.value;
    const refreshToken = cookieToken || body.refreshToken;

    if (refreshToken) {
      await AuthService.logout(refreshToken);
    }

    const response = NextResponse.json({
      success: true,
      message: "Logout successful",
    });

    // Clear refresh token cookie
    response.cookies.delete("refreshToken");

    return response;
  } catch (error: unknown) {
    console.error("[API/Auth/Logout] Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}
