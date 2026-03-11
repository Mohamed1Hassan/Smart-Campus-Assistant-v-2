import { NextRequest, NextResponse } from "next/server";
import AuthService from "@/services/auth.service";
import { registerSchema } from "@/lib/validations/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validate request body with Zod
    const validation = registerSchema.safeParse(body);
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

    const { data } = validation;
    const registerData = {
      ...data,
      role: "student" as const, // Force student role for public registration
      name: data.name || `${data.firstName} ${data.lastName}`,
    };

    const result = await AuthService.register(registerData);

    const response = NextResponse.json(
      {
        success: true,
        message: "User registered successfully",
        data: result,
      },
      { status: 201 },
    );

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
    console.error("[API/Auth/Register] Error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Registration failed";
    return NextResponse.json(
      {
        success: false,
        message: errorMessage,
        error: process.env.NODE_ENV === "development" ? error : undefined,
      },
      { status: errorMessage.includes("already exists") ? 400 : 500 },
    );
  }
}
