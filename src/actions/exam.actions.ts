"use server";

import { cookies } from "next/headers";
import { JWTUtils } from "../utils/jwt";
import { ExamService } from "../services/exam.service";
import { revalidatePath } from "next/cache";
import { scheduleExamSchema } from "../lib/validations/exam";

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

export async function scheduleExamAction(data: {
  courseId: number;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  room?: string;
}) {
  try {
    const user = await getAuthenticatedUser();

    if (user.role !== "professor" && user.role !== "admin") {
      throw new Error("Unauthorized: Only professors can schedule exams");
    }

    const validated = scheduleExamSchema.safeParse(data);
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

    const exam = await ExamService.scheduleExam({
      ...validated.data,
      startTime: new Date(validated.data.startTime),
      endTime: new Date(validated.data.endTime),
      professorId: user.id,
    });

    revalidatePath("/dashboard/exams");
    return { success: true, data: JSON.parse(JSON.stringify(exam)) };
  } catch (error: unknown) {
    console.error("Failed to schedule exam:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to schedule exam";
    return { success: false, error: errorMessage };
  }
}

export async function getUpcomingExamsAction() {
  try {
    const user = await getAuthenticatedUser();
    const exams = await ExamService.getStudentUpcomingExams(user.id);
    return { success: true, data: JSON.parse(JSON.stringify(exams)) };
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to retrieve exams";
    return { success: false, error: errorMessage };
  }
}

export async function getCourseExamsAction(courseId: number) {
  try {
    await getAuthenticatedUser();
    const exams = await ExamService.getCourseExams(courseId);
    return { success: true, data: JSON.parse(JSON.stringify(exams)) };
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Failed to retrieve course exams";
    return { success: false, error: errorMessage };
  }
}

export async function reportViolationAction(data: {
  examId: number;
  type: string;
  metadata?: Record<string, unknown>;
}) {
  try {
    const user = await getAuthenticatedUser();

    if (user.role !== "student") {
      throw new Error("Unauthorized: Only students can report exam violations");
    }

    const violation = await ExamService.reportViolation({
      examId: data.examId,
      studentId: user.id,
      type: data.type,
      metadata: data.metadata,
    });

    return { success: true, data: JSON.parse(JSON.stringify(violation)) };
  } catch (error: unknown) {
    console.error("Failed to report violation:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to report violation";
    return { success: false, error: errorMessage };
  }
}
