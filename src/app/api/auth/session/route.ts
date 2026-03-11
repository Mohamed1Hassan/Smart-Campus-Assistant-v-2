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
      return NextResponse.json({
        success: true,
        message: "No active session",
        data: { authenticated: false, user: null },
      });
    }

    try {
      const payload = JWTUtils.verifyAccessToken(token);
      const user = await AuthService.getUserById(payload.userId);
      console.log(
        `[ApiResponse/session] Retrieved user from DB for ID ${payload.userId}:`,
        user ? { id: user.id, name: user.name } : "NOT FOUND",
      );

      if (!user) {
        return NextResponse.json({
          success: true,
          message: "Session invalid: User not found",
          data: { authenticated: false, user: null },
        });
      }

      return NextResponse.json({
        success: true,
        message: "Session information retrieved",
        data: {
          authenticated: true,
          user,
          timestamp: new Date().toISOString(),
        },
      });
    } catch {
      return NextResponse.json({
        success: true,
        message: "Session expired or invalid",
        data: { authenticated: false, user: null },
      });
    }
  } catch (error: unknown) {
    return handleApiError(error, "API/auth/session");
  }
}
