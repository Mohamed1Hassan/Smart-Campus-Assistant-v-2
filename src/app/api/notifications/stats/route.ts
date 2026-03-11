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

    const stats = await notificationService.getNotificationStats(userId);

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error: unknown) {
    return handleApiError(error, "API/Notifications/Stats GET");
  }
}
