import { NextRequest, NextResponse } from "next/server";
import { getNotificationService } from "@/services/notification.service";
import { JWTUtils } from "@/utils/jwt";
import { handleApiError } from "@/utils/apiResponse";

const notificationService = getNotificationService();

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

    const payload = JWTUtils.verifyAccessToken(token);

    // Check if user is professor or admin
    if (payload.role !== "professor" && payload.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 403 },
      );
    }

    const body = await req.json();
    const {
      userIds,
      title,
      message,
      type,
      category,
      metadata,
      sendEmail = false,
    } = body;

    if (
      !userIds ||
      !Array.isArray(userIds) ||
      !title ||
      !message ||
      !type ||
      !category
    ) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 },
      );
    }

    const result = await notificationService.createBulkNotifications({
      userIds: userIds.map((id: unknown) => parseInt(String(id))),
      title,
      message,
      type,
      category,
      metadata,
      sendEmail,
    });

    return NextResponse.json(
      {
        success: true,
        message: `${result.length} notifications created successfully`,
        data: result,
      },
      { status: 201 },
    );
  } catch (error: unknown) {
    return handleApiError(error, "API/notifications/bulk");
  }
}
