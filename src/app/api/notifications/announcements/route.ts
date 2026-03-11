import { NextRequest, NextResponse } from "next/server";
import { getNotificationService } from "@/services/notification.service";
import { JWTUtils } from "@/utils/jwt";
import { handleApiError } from "@/utils/apiResponse";
import { NotificationCategory } from "@/types/notification.types";

const notificationService = getNotificationService();

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

    const payload = JWTUtils.verifyAccessToken(token);
    const userId = parseInt(payload.userId);

    if (isNaN(userId)) {
      return NextResponse.json(
        { success: false, message: "Invalid user ID" },
        { status: 400 },
      );
    }

    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get("limit") || "10");
    const offset = parseInt(url.searchParams.get("offset") || "0");

    const announcements = await notificationService.getUserNotifications(
      userId,
      {
        category: NotificationCategory.ANNOUNCEMENT,
        limit,
        offset,
      },
    );

    return NextResponse.json({
      success: true,
      data: announcements,
      pagination: {
        limit,
        offset,
        total: announcements.length,
      },
    });
  } catch (error: unknown) {
    return handleApiError(error, "API/notifications/announcements");
  }
}
