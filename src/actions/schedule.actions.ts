"use server";

import { cookies } from "next/headers";
import { JWTUtils } from "../utils/jwt";
import {
  ScheduleService,
  CreateScheduleData,
  UpdateScheduleData,
} from "../services/schedule.service";
import prisma from "@/lib/db";

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

export async function createScheduleAction(
  data: Omit<CreateScheduleData, "professorId">,
) {
  try {
    const localUserId = await getLocalUserId();

    const scheduleData: CreateScheduleData = {
      ...data,
      professorId: localUserId,
    };

    const newSchedule = await ScheduleService.createSchedule(scheduleData);
    return { success: true, data: JSON.parse(JSON.stringify(newSchedule)) };
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to create schedule";
    return { success: false, error: errorMessage };
  }
}

export async function updateScheduleAction(
  scheduleId: number,
  data: UpdateScheduleData,
) {
  try {
    const localUserId = await getLocalUserId();

    // Authorization: Check if the user trying to update owns the schedule item
    const existingSchedule = await ScheduleService.getScheduleById(scheduleId);
    if (!existingSchedule) {
      return { success: false, error: "Schedule not found" };
    }

    if (existingSchedule.professorId !== localUserId) {
      return { success: false, error: "Unauthorized to modify this schedule" };
    }

    const updatedSchedule = await ScheduleService.updateSchedule(
      scheduleId,
      data,
    );
    return { success: true, data: JSON.parse(JSON.stringify(updatedSchedule)) };
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to update schedule";
    return { success: false, error: errorMessage };
  }
}

export async function deleteScheduleAction(scheduleId: number) {
  try {
    const localUserId = await getLocalUserId();

    // Authorization: Check ownership
    const existingSchedule = await ScheduleService.getScheduleById(scheduleId);
    if (!existingSchedule) {
      return { success: false, error: "Schedule not found" };
    }

    if (existingSchedule.professorId !== localUserId) {
      return { success: false, error: "Unauthorized to delete this schedule" };
    }

    const deletedSchedule = await ScheduleService.deleteSchedule(scheduleId);
    return { success: true, data: JSON.parse(JSON.stringify(deletedSchedule)) };
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to delete schedule";
    return { success: false, error: errorMessage };
  }
}

export async function getScheduleByIdAction(scheduleId: number) {
  try {
    const schedule = await ScheduleService.getScheduleById(scheduleId);
    if (!schedule) {
      return { success: false, error: "Schedule not found" };
    }
    return { success: true, data: JSON.parse(JSON.stringify(schedule)) };
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to retrieve schedule";
    return { success: false, error: errorMessage };
  }
}

export async function getSchedulesByCourseIdAction(
  courseId: number,
  activeOnly: boolean = false,
) {
  try {
    const schedules = await ScheduleService.getAllSchedules(
      undefined,
      courseId,
      undefined,
      activeOnly,
    );
    return { success: true, data: JSON.parse(JSON.stringify(schedules)) };
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Failed to retrieve course schedules";
    return { success: false, error: errorMessage };
  }
}

export async function getSchedulesByProfessorIdAction(
  activeOnly: boolean = false,
) {
  try {
    const localUserId = await getLocalUserId();
    const schedules = await ScheduleService.getAllSchedules(
      localUserId,
      undefined,
      undefined,
      activeOnly,
    );
    return { success: true, data: JSON.parse(JSON.stringify(schedules)) };
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Failed to retrieve professor schedules";
    return { success: false, error: errorMessage };
  }
}

// Student schedule depends on their enrolled courses
export async function getStudentScheduleAction(activeOnly: boolean = true) {
  try {
    const localUserId = await getLocalUserId();

    // Find the student's courses
    const enrollments = await prisma.courseEnrollment.findMany({
      where: { studentId: localUserId },
      select: { courseId: true },
    });

    const courseIds = enrollments.map((e) => e.courseId);

    if (courseIds.length === 0) {
      return { success: true, data: [] };
    }

    // Find schedules for those courses
    const schedules = await prisma.schedule.findMany({
      where: {
        courseId: { in: courseIds },
        isActive: activeOnly ? true : undefined,
      },
      include: {
        course: {
          select: { courseName: true, courseCode: true },
        },
        professor: {
          select: { firstName: true, lastName: true },
        },
      },
      orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
    });

    return { success: true, data: JSON.parse(JSON.stringify(schedules)) };
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Failed to retrieve student schedule";
    return { success: false, error: errorMessage };
  }
}
