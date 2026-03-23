import { NextRequest, NextResponse } from "next/server";
import AuthService from "@/services/auth.service";
import { loginSchema } from "@/lib/validations/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log("[API/Auth/Login] Request body:", {
      universityId: body.universityId,
      hasPassword: !!body.password,
    });

    // Validate request body with Zod
    const validation = loginSchema.safeParse(body);
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

    const { universityId, password } = validation.data;

    const result = await AuthService.login({
      universityId,
      password,
    });

    const response = NextResponse.json({
      success: true,
      message: "Login successful",
      data: {
        user: result.user,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        expiresIn: result.expiresIn,
      },
    });

    // Set tokens as cookies
    response.cookies.set("accessToken", result.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 3600, // 1 hour
      path: "/",
    });

    response.cookies.set("refreshToken", result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
      path: "/",
    });

    return response;
  } catch (error: unknown) {
    console.error("[API/Auth/Login] Error detail:", error);
    
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    // Check for specific known errors that should be 401/400
    const isAuthError = 
      errorMessage.includes("Invalid university ID or password") || 
      errorMessage.includes("digits") || 
      errorMessage.includes("at least 6 characters") ||
      errorMessage.includes("required");

    if (isAuthError) {
      return NextResponse.json(
        { 
          success: false, 
          message: errorMessage,
          code: errorMessage.includes("Invalid") ? "INVALID_CREDENTIALS" : "VALIDATION_ERROR"
        },
        { status: 401 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
        error: process.env.NODE_ENV === "development" ? errorMessage : undefined,
      },
      { status: 500 },
    );
  }
}
