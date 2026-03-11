"use server";

import { cookies } from "next/headers";
import { JWTUtils } from "../utils/jwt";
import { NotificationService } from "../services/notification.service";
import { revalidatePath } from "next/cache";
import {
  NotificationType,
  NotificationCategory,
} from "@/types/notification.types";

/**
 * Helper to get the local database User ID from local JWT session
 */
async function getAuthenticatedUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("accessToken")?.value;

  if (!token) {
    throw new Error("Unauthorized");
  }

  try {
    const decoded = JWTUtils.verifyAccessToken(token);
    return {
      id: parseInt(decoded.userId),
      role: decoded.role,
    };
  } catch {
    throw new Error("Unauthorized: Session expired or invalid");
  }
}

export async function sendBulkNotificationAction(data: {
  studentIds: number[];
  title: string;
  message: string;
  type: NotificationType;
  category: NotificationCategory;
}) {
  try {
    const user = await getAuthenticatedUser();

    if (user.role !== "professor" && user.role !== "admin") {
      throw new Error(
        "Unauthorized: Only professors can send bulk notifications",
      );
    }

    const notificationService = new NotificationService();

    // Send notifications to all specified students using bulk method
    const results = await notificationService.createBulkNotifications({
      userIds: data.studentIds,
      title: data.title,
      message: data.message,
      type: data.type,
      category: data.category,
      metadata: {
        senderId: user.id,
        senderRole: user.role,
      },
      sendEmail: true, // Default to sending email for professor announcements
    });

    revalidatePath("/dashboard");
    return { success: true, count: results.length };
  } catch (error: unknown) {
    console.error("Failed to send bulk notifications:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to send notifications";
    return { success: false, error: errorMessage };
  }
}
