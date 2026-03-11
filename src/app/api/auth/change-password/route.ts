import { NextRequest, NextResponse } from "next/server";
import AuthService from "@/services/auth.service";
import { JWTUtils } from "@/utils/jwt";
import { changePasswordSchema } from "@/lib/validations/auth";
import { handleApiError } from "@/utils/apiResponse";

export async function POST(req: NextRequest) {
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

    // Validate request body with Zod
    const validation = changePasswordSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Validation failed",
          errors: validation.error.issues.map((err) => ({
            field: err.path.join("."),
            message: err.message,
          })),
        },
        { status: 400 },
      );
    }

    const { currentPassword, newPassword } = validation.data;

    await AuthService.changePassword({
      userId: payload.userId,
      currentPassword,
      newPassword,
    });

    return NextResponse.json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error: unknown) {
    return handleApiError(error, "API/auth/change-password");
  }
}
