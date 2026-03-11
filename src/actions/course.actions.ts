"use server";

import { cookies } from "next/headers";
import { JWTUtils } from "../utils/jwt";
import {
  CourseService,
  CreateCourseData,
  UpdateCourseData,
  EnrollStudentData,
} from "../services/course.service";
// import prisma from '@/lib/db'; // Removed unused import

/**
 * Helper to get the local database User ID from local JWT session
 */
async function getLocalUserId(): Promise<number> {
  const cookieStore = await cookies();
  const token = cookieStore.get("accessToken")?.value;

  if (!token) {
    throw new Error("Unauthorized");
  }

  try {
    const decoded = JWTUtils.verifyAccessToken(token);
    return parseInt(decoded.userId);
  } catch {
    throw new Error("Unauthorized: Session expired or invalid");
  }
}

export async function createCourseAction(
  data: Omit<CreateCourseData, "professorId">,
) {
  try {
    const localUserId = await getLocalUserId();

    // Add the verified professor ID from their session token
    const courseData: CreateCourseData = {
      ...data,
      professorId: localUserId,
    };

    const newCourse = await CourseService.createCourse(courseData);

    // Convert Dates to ISO strings before passing to Client Components to avoid serialization errors
    return { success: true, data: JSON.parse(JSON.stringify(newCourse)) };
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to create course";
    console.error("Failed to create course:", error);
    return { success: false, error: errorMessage };
  }
}

export async function getAllCoursesAction(
  professorOnly: boolean = false,
  isActive?: boolean,
  summary: boolean = false,
) {
  try {
    let localUserId: number | undefined;

    if (professorOnly) {
      localUserId = await getLocalUserId();
    }

    const courses = await CourseService.getAllCourses(
      localUserId,
      isActive,
      summary,
    );
    return { success: true, data: JSON.parse(JSON.stringify(courses)) };
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to retrieve courses";
    return { success: false, error: errorMessage };
  }
}

export async function getCourseByIdAction(courseId: number) {
  try {
    // Optional: could add logic here to ensure the user is allowed to view this course
    const course = await CourseService.getCourseById(courseId);

    if (!course) {
      return { success: false, error: "Course not found" };
    }

    return { success: true, data: JSON.parse(JSON.stringify(course)) };
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to retrieve course";
    return { success: false, error: errorMessage };
  }
}

export async function updateCourseAction(
  courseId: number,
  data: UpdateCourseData,
) {
  try {
    const localUserId = await getLocalUserId();

    // Authorization: Check if the user trying to update owns the course (or is admin)
    const existingCourse = await CourseService.getCourseById(courseId);
    if (!existingCourse) {
      return { success: false, error: "Course not found" };
    }

    // TODO: if you eventually add Admin roles, check that here too
    if (existingCourse.professorId !== localUserId) {
      return { success: false, error: "Unauthorized to modify this course" };
    }

    const updatedCourse = await CourseService.updateCourse(courseId, data);
    return { success: true, data: JSON.parse(JSON.stringify(updatedCourse)) };
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to update course";
    return { success: false, error: errorMessage };
  }
}

export async function deleteCourseAction(courseId: number) {
  try {
    const localUserId = await getLocalUserId();

    // Authorization: Check ownership
    const existingCourse = await CourseService.getCourseById(courseId);
    if (!existingCourse) {
      return { success: false, error: "Course not found" };
    }

    if (existingCourse.professorId !== localUserId) {
      return { success: false, error: "Unauthorized to delete this course" };
    }

    const deletedCourse = await CourseService.deleteCourse(courseId);
    return { success: true, data: JSON.parse(JSON.stringify(deletedCourse)) };
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to delete course";
    return { success: false, error: errorMessage };
  }
}

export async function enrollStudentAction(
  courseId: number,
  studentLocalId?: number,
) {
  try {
    // If studentLocalId isn't provided (e.g. self-enrollment), get it from their active session
    const localUserId = studentLocalId || (await getLocalUserId());

    const enrollmentData: EnrollStudentData = {
      courseId,
      studentId: localUserId,
    };

    const enrollment = await CourseService.enrollStudent(enrollmentData);
    return { success: true, data: JSON.parse(JSON.stringify(enrollment)) };
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to enroll student";
    return { success: false, error: errorMessage };
  }
}

export async function getStudentCoursesAction() {
  try {
    const localUserId = await getLocalUserId();
    const courses = await CourseService.getStudentCourses(localUserId);
    return { success: true, data: JSON.parse(JSON.stringify(courses)) };
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to get student courses";
    return { success: false, error: errorMessage };
  }
}

export async function getCourseStatsAction(courseId: number) {
  try {
    const localUserId = await getLocalUserId();

    // Basic verification - assume professors looking at their own courses stat
    const existingCourse = await CourseService.getCourseById(courseId);
    if (!existingCourse) return { success: false, error: "Course not found" };

    if (existingCourse.professorId !== localUserId) {
      return { success: false, error: "Unauthorized to view these stats" };
    }

    const stats = await CourseService.getCourseStats(courseId);
    return { success: true, data: JSON.parse(JSON.stringify(stats)) };
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Failed to retrieve course stats";
    return { success: false, error: errorMessage };
  }
}
