"use server";

import { cookies } from "next/headers";
import { JWTUtils } from "../utils/jwt";
import prisma from "@/lib/db";
import { UserService, UpdateProfileRequest } from "../services/user.service";

/**
 * Helper to get the local database User ID from local JWT session
 */
async function getLocalUserId(): Promise<string> {
  const cookieStore = await cookies();
  const token = cookieStore.get("accessToken")?.value;

  if (!token) {
    console.error(
      "[user.actions] Unauthorized: No access token found in cookies",
    );
    throw new Error("Unauthorized");
  }

  try {
    const decoded = JWTUtils.verifyAccessToken(token);
    return decoded.userId;
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("[user.actions] Unauthorized: Token verification failed", {
      error: errorMessage,
      tokenSnippet: token ? token.substring(0, 10) + "..." : "null",
    });
    throw new Error("Unauthorized: Session expired or invalid");
  }
}

export async function getUserProfileAction() {
  try {
    const localUserId = await getLocalUserId();
    const profile = await UserService.getUserProfile(localUserId);

    // Parse/stringify to ensure Date objects don't crash Server Actions -> Client Component serialization
    return { success: true, data: JSON.parse(JSON.stringify(profile)) };
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Failed to retrieve user profile";
    return { success: false, error: errorMessage };
  }
}

export async function getStudentStatsAction() {
  try {
    const localUserId = await getLocalUserId();
    const stats = await UserService.getStudentStats(localUserId);
    return { success: true, data: JSON.parse(JSON.stringify(stats)) };
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Failed to retrieve student statistics";
    return { success: false, error: errorMessage };
  }
}

// Omitted `updateUserProfileAction` for now because they involve `uploadMiddleware` via Express
// which requires a native Next.js Route Handler or different formData file upload approach.
// Basic profile updates without file uploads could be handled here.

export async function updateBasicUserProfileAction(
  data: Omit<UpdateProfileRequest, "userId">,
) {
  try {
    const localUserId = await getLocalUserId();

    // Construct request
    const updateRequest: UpdateProfileRequest = {
      userId: localUserId,
      ...data,
    };

    const profile = await UserService.updateProfile({
      ...updateRequest,
      userId: localUserId,
    });
    return { success: true, data: JSON.parse(JSON.stringify(profile)) };
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Failed to update basic user profile";
    return { success: false, error: errorMessage };
  }
}

export async function registerFaceAction(faceDescriptor: number[]) {
  try {
    const localUserId = await getLocalUserId();

    const updatedUser = await prisma.user.update({
      where: { id: parseInt(localUserId) },
      data: {
        faceDescriptor: faceDescriptor, // Json type in Prisma
        updatedAt: new Date(),
      },
    });

    return { success: true, data: { id: updatedUser.id } };
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to register FaceID";
    return { success: false, error: errorMessage };
  }
}
