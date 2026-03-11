import { NextRequest, NextResponse } from "next/server";
import { getNotificationService } from "@/services/notification.service";
import { JWTUtils } from "@/utils/jwt";
import { handleApiError } from "@/utils/apiResponse";

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

    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const type = searchParams.get("type");
    const isRead = searchParams.get("isRead");
    const limit = searchParams.get("limit");
    const offset = searchParams.get("offset");

    const filters: Record<string, unknown> = {};
    if (category) filters.category = category;
    if (type) filters.type = type;
    if (isRead !== null) filters.isRead = isRead === "true";
    if (limit) filters.limit = parseInt(limit);
    if (offset) filters.offset = parseInt(offset);

    const notifications = await notificationService.getUserNotifications(
      userId,
      filters,
    );

    return NextResponse.json({
      success: true,
      data: notifications,
    });
  } catch (error: unknown) {
    return handleApiError(error, "API/Notifications GET");
  }
}

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
    // Only professor and admin can create notifications generally
    if (payload.role !== "professor" && payload.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 403 },
      );
    }

    const body = await req.json();
    const notification = await notificationService.createNotification(body);

    return NextResponse.json({
      success: true,
      data: notification,
    });
  } catch (error: unknown) {
    return handleApiError(error, "API/Notifications POST");
  }
}
