"use server";

import { cookies } from "next/headers";
import { JWTUtils } from "../utils/jwt";
import { GradeService } from "../services/grade.service";
import { revalidatePath } from "next/cache";
import { assignGradeSchema } from "../lib/validations/grade";

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

export async function assignGradeAction(data: {
  studentId: number;
  courseId: number;
  quizId?: number;
  score: number;
  maxScore?: number;
  type: string;
  notes?: string;
}) {
  try {
    const user = await getAuthenticatedUser();

    if (user.role !== "professor" && user.role !== "admin") {
      throw new Error("Unauthorized: Only professors can assign grades");
    }

    const validated = assignGradeSchema.safeParse(data);
    if (!validated.success) {
      return {
        success: false,
        error: "Validation failed",
        details: validated.error.issues.map((e) => ({
          field: e.path.join("."),
          message: e.message,
        })),
      };
    }

    const grade = await GradeService.assignGrade({
      ...validated.data,
      markedBy: user.id,
    });

    revalidatePath("/dashboard/grades");
    return { success: true, data: JSON.parse(JSON.stringify(grade)) };
  } catch (error: unknown) {
    console.error("Failed to assign grade:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to assign grade";
    return { success: false, error: errorMessage };
  }
}

export async function getStudentGradesAction(courseId?: number) {
  try {
    const user = await getAuthenticatedUser();
    const grades = await GradeService.getStudentGrades(user.id, courseId);
    return { success: true, data: JSON.parse(JSON.stringify(grades)) };
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to retrieve grades";
    return { success: false, error: errorMessage };
  }
}

export async function getCourseGradesAction(courseId: number) {
  try {
    const user = await getAuthenticatedUser();

    if (user.role !== "professor" && user.role !== "admin") {
      throw new Error("Unauthorized");
    }

    const grades = await GradeService.getCourseGrades(courseId);
    return { success: true, data: JSON.parse(JSON.stringify(grades)) };
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Failed to retrieve course grades";
    return { success: false, error: errorMessage };
  }
}
