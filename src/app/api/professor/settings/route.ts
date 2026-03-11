import { NextRequest, NextResponse } from "next/server";
import { UserService } from "@/services/user.service";
import { JWTUtils } from "@/utils/jwt";
import { handleApiError } from "@/utils/apiResponse";

export async function GET(req: NextRequest) {
  try {
    console.log("[API/Professor/Settings] GET Request received");
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.substring(7)
      : null;

    if (!token) {
      console.warn("[API/Professor/Settings] No token provided");
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 },
      );
    }

    let payload;
    try {
      payload = JWTUtils.verifyAccessToken(token);
      console.log(
        "[API/Professor/Settings] Token verified for userId:",
        payload.userId,
        "role:",
        payload.role,
      );
    } catch {
      console.error("[API/Professor/Settings] Token verification failed");
      return NextResponse.json(
        { success: false, message: "Invalid or expired token" },
        { status: 401 },
      );
    }

    if (payload.role !== "professor" && payload.role !== "admin") {
      console.warn(
        "[API/Professor/Settings] Access denied for role:",
        payload.role,
      );
      return NextResponse.json(
        { success: false, message: "Access denied. Professor role required." },
        { status: 403 },
      );
    }

    console.log(
      "[API/Professor/Settings] Fetching settings for professorId:",
      payload.userId,
    );
    const settings = await UserService.getProfessorSettings(payload.userId);
    console.log("[API/Professor/Settings] Settings fetched successfully");

    return NextResponse.json({
      success: true,
      message: "Settings retrieved successfully",
      data: settings,
    });
  } catch (error: unknown) {
    return handleApiError(error, "API/professor/settings");
  }
}

export async function PUT(req: NextRequest) {
  try {
    console.log("[API/Professor/Settings] PUT Request received");
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

    if (payload.role !== "professor" && payload.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Access denied. Professor role required." },
        { status: 403 },
      );
    }

    const body = await req.json();
    console.log(
      "[API/Professor/Settings] Updating settings with:",
      JSON.stringify(body),
    );
    const updatedSettings = await UserService.updateProfessorSettings(
      payload.userId,
      body,
    );
    console.log("[API/Professor/Settings] Settings updated successfully");

    return NextResponse.json({
      success: true,
      message: "Settings updated successfully",
      data: updatedSettings,
    });
  } catch (error: unknown) {
    return handleApiError(error, "API/professor/settings");
  }
}
