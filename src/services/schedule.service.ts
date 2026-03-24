import type { Schedule } from "@prisma/client";
import { Prisma } from "@prisma/client";
import prisma from "../lib/db";

export interface CreateScheduleData {
  courseId: number;
  professorId: number;
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  startTime: string; // Format: "HH:MM"
  endTime: string; // Format: "HH:MM"
  room?: string;
  type?: string;
  semester?: string;
}

export interface UpdateScheduleData {
  professorId?: number;
  dayOfWeek?: number;
  startTime?: string;
  endTime?: string;
  room?: string;
  type?: string;
  semester?: string;
  isActive?: boolean;
}

export interface ScheduleConflict {
  hasConflict: boolean;
  conflictingSchedules: Schedule[];
  message?: string;
}

export interface FormattedSchedule {
  id: number;
  courseId: number;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  room?: string | null;
  type?: string | null;
  semester: string;
  isActive: boolean;
  professorId: number;
  courseName?: string;
  courseCode?: string;
  professorFirstName?: string;
  professorLastName?: string;
  professorName?: string | null;
  sessionProfessor?: string;
  leadProfessor?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface TodaySchedule {
  id: string;
  courseName: string;
  courseCode: string;
  professorFirstName: string;
  professorLastName: string;
  professorName: string;
  sessionProfessor?: string;
  leadProfessor?: string | null;
  startTime: string;
  endTime: string;
  room: string;
  dayOfWeek: number;
}

export interface ScheduleStats {
  totalSchedules: number;
  schedulesByDay: Record<string, number>;
  uniqueRooms: number;
  uniqueCourses: number;
}

export type ScheduleWithRelations = Prisma.ScheduleGetPayload<{
  include: {
    course: {
      select: {
        id: true;
        courseCode: true;
        courseName: true;
        credits: true;
        isActive: true;
      };
    };
    professor: {
      select: {
        id: true;
        firstName: true;
        lastName: true;
        universityId: true;
      };
    };
  };
}>;

export class ScheduleService {
  /**
   * Create a new schedule entry
   */
  static async createSchedule(
    data: CreateScheduleData,
  ): Promise<ScheduleWithRelations> {
    // Validate course exists and is active
    const course = await prisma.course.findUnique({
      where: { id: data.courseId },
    });

    if (!course) {
      throw new Error("Course not found");
    }

    if (!course.isActive) {
      throw new Error("Course is not active");
    }

    // Validate professor exists and has correct role
    const professor = await prisma.user.findUnique({
      where: { id: data.professorId },
    });

    if (!professor) {
      throw new Error("Professor not found");
    }

    if (professor.role !== "PROFESSOR" && professor.role !== "ADMIN") {
      throw new Error("User is not authorized to create schedules");
    }

    // Validate day of week
    if (data.dayOfWeek < 0 || data.dayOfWeek > 6) {
      throw new Error(
        "Day of week must be between 0 (Sunday) and 6 (Saturday)",
      );
    }

    // Validate time format and logic
    if (
      !this.isValidTimeFormat(data.startTime) ||
      !this.isValidTimeFormat(data.endTime)
    ) {
      throw new Error("Time must be in HH:MM format");
    }

    if (data.startTime >= data.endTime) {
      throw new Error("Start time must be before end time");
    }

    // Check for schedule conflicts
    const conflict = await this.checkScheduleConflict(
      data.professorId,
      data.dayOfWeek,
      data.startTime,
      data.endTime,
      data.room,
    );

    if (conflict.hasConflict) {
      throw new Error(conflict.message || "Schedule conflict detected");
    }

    const schedule = await prisma.schedule.create({
      data: {
        courseId: data.courseId,
        professorId: data.professorId,
        dayOfWeek: data.dayOfWeek,
        startTime: data.startTime,
        endTime: data.endTime,
        room: data.room,
        type: data.type,
        semester: data.semester || "Fall 2024",
        isActive: true,
      },
      include: {
        course: {
          select: {
            id: true,
            courseCode: true,
            courseName: true,
            credits: true,
            isActive: true,
          },
        },
        professor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            universityId: true,
          },
        },
      },
    });

    return schedule;
  }

  /**
   * Get all schedules with optional filtering
   */
  static async getAllSchedules(
    professorId?: number,
    courseId?: number,
    dayOfWeek?: number,
    isActive?: boolean,
    major?: string,
    level?: number,
  ): Promise<ScheduleWithRelations[]> {
    const where: Prisma.ScheduleWhereInput = {};

    if (professorId) {
      where.professorId = professorId;
    }

    if (courseId) {
      where.courseId = courseId;
    }

    if (dayOfWeek !== undefined) {
      where.dayOfWeek = dayOfWeek;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    if (major || level) {
      where.course = {
        ...(major ? { major } : {}),
        ...(level ? { level } : {}),
      };
    }

    const schedules = await prisma.schedule.findMany({
      where,
      include: {
        course: {
          select: {
            id: true,
            courseCode: true,
            courseName: true,
            credits: true,
            isActive: true,
          },
        },
        professor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            universityId: true,
          },
        },
      },
      orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
    });

    return schedules;
  }

  /**
   * Get schedule by ID
   */
  static async getScheduleById(
    scheduleId: number,
  ): Promise<ScheduleWithRelations | null> {
    const schedule = await prisma.schedule.findUnique({
      where: { id: scheduleId },
      include: {
        course: {
          select: {
            id: true,
            courseCode: true,
            courseName: true,
            credits: true,
            isActive: true,
          },
        },
        professor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            universityId: true,
          },
        },
      },
    });

    return schedule;
  }

  /**
   * Get user's schedule (student or professor)
   */
  static async getUserSchedule(
    userId: number,
    userRole: string,
  ): Promise<FormattedSchedule[]> {
    if (userRole === "STUDENT") {
      // Get student's major and level
      const student = await prisma.user.findUnique({
        where: { id: userId },
        select: { major: true, level: true },
      });

      if (!student || !student.major || student.level === null) {
        console.log(
          `[ScheduleService] Student ${userId} has no major or level defined.`,
        );
        return [];
      }

      // Get schedules for ANY active course that matches the student's major and level for the active semester(s)
      // This ensures any new student sees their schedule immediately without manual enrollment
      const schedules = (await prisma.schedule.findMany({
        where: {
          isActive: true,
          course: {
            major: student.major,
            level: student.level,
            isActive: true,
            isArchived: false,
          },
        },
        include: {
          course: {
            select: {
              id: true,
              courseCode: true,
              courseName: true,
              credits: true,
              professor: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
          professor: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              universityId: true,
            },
          },
        },
      })) as unknown as (ScheduleWithRelations & {
        course: { professor: { firstName: string; lastName: string } };
      })[];

      const formattedSchedules: FormattedSchedule[] = schedules.map(
        (schedule) => {
          const leadProfName = (
            schedule.course as unknown as {
              professor?: { firstName?: string; lastName?: string };
            }
          )?.professor
            ? `${(schedule.course as unknown as { professor: { firstName: string; lastName: string } }).professor.firstName} ${(schedule.course as unknown as { professor: { firstName: string; lastName: string } }).professor.lastName}`
            : null;
          const sessionProfName =
            `${schedule.professor?.firstName || ""} ${schedule.professor?.lastName || ""}`.trim();

          return {
            id: schedule.id,
            courseId: schedule.courseId,
            dayOfWeek: schedule.dayOfWeek,
            startTime: schedule.startTime,
            endTime: schedule.endTime,
            room: schedule.room,
            semester: schedule.semester,
            isActive: schedule.isActive,
            professorId: schedule.professorId,
            courseName: schedule.course?.courseName,
            courseCode: schedule.course?.courseCode,
            professorFirstName: schedule.professor?.firstName,
            professorLastName: schedule.professor?.lastName,
            // Prioritize lead professor name if it's a Doctor, otherwise use session prof
            // Actually, let's just use leadProfName as the primary identity for the course
            professorName: leadProfName || sessionProfName,
            sessionProfessor: sessionProfName,
            leadProfessor: leadProfName,
            createdAt: schedule.createdAt,
            updatedAt: schedule.updatedAt,
          };
        },
      );

      // Sort by day and time
      return formattedSchedules.sort((a, b) => {
        if (a.dayOfWeek !== b.dayOfWeek) {
          return a.dayOfWeek - b.dayOfWeek;
        }
        return a.startTime.localeCompare(b.startTime);
      });
    } else if (userRole === "PROFESSOR" || userRole === "ADMIN") {
      // Get schedules for courses the professor teaches
      const schedules = await this.getAllSchedules(
        userId,
        undefined,
        undefined,
        true,
      );

      // Transform to match the expected format
      return schedules.map((schedule) => ({
        id: schedule.id,
        courseId: schedule.courseId,
        dayOfWeek: schedule.dayOfWeek,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        room: schedule.room,
        semester: schedule.semester,
        isActive: schedule.isActive,
        professorId: schedule.professorId,
        courseName: schedule.course?.courseName,
        courseCode: schedule.course?.courseCode,
        professorFirstName: schedule.professor?.firstName,
        professorLastName: schedule.professor?.lastName,
        professorName: schedule.professor
          ? `${schedule.professor.firstName} ${schedule.professor.lastName}`
          : undefined,
        createdAt: schedule.createdAt,
        updatedAt: schedule.updatedAt,
      }));
    }

    return [];
  }

  /**
   * Update schedule
   */
  static async updateSchedule(
    scheduleId: number,
    data: UpdateScheduleData,
  ): Promise<ScheduleWithRelations> {
    // Check if schedule exists
    const existingSchedule = await prisma.schedule.findUnique({
      where: { id: scheduleId },
    });

    if (!existingSchedule) {
      throw new Error("Schedule not found");
    }

    // Validate time format if provided
    if (data.startTime && !this.isValidTimeFormat(data.startTime)) {
      throw new Error("Start time must be in HH:MM format");
    }

    if (data.endTime && !this.isValidTimeFormat(data.endTime)) {
      throw new Error("End time must be in HH:MM format");
    }

    // Validate day of week if provided
    if (
      data.dayOfWeek !== undefined &&
      (data.dayOfWeek < 0 || data.dayOfWeek > 6)
    ) {
      throw new Error(
        "Day of week must be between 0 (Sunday) and 6 (Saturday)",
      );
    }

    // Use existing values if not provided
    const startTime = data.startTime || existingSchedule.startTime;
    const endTime = data.endTime || existingSchedule.endTime;
    const dayOfWeek =
      data.dayOfWeek !== undefined
        ? data.dayOfWeek
        : existingSchedule.dayOfWeek;
    const room = data.room !== undefined ? data.room : existingSchedule.room;
    const type = data.type !== undefined ? data.type : existingSchedule.type;
    const professorId =
      data.professorId !== undefined
        ? data.professorId
        : existingSchedule.professorId;

    // Validate time logic
    if (startTime >= endTime) {
      throw new Error("Start time must be before end time");
    }

    // Check for schedule conflicts (excluding current schedule)
    const conflict = await this.checkScheduleConflict(
      professorId,
      dayOfWeek,
      startTime,
      endTime,
      room ?? undefined,
      scheduleId,
    );

    if (conflict.hasConflict) {
      throw new Error(conflict.message || "Schedule conflict detected");
    }

    const updatedSchedule = await prisma.schedule.update({
      where: { id: scheduleId },
      data: {
        ...data,
        type: type,
      },
      include: {
        course: {
          select: {
            id: true,
            courseCode: true,
            courseName: true,
            credits: true,
            isActive: true,
          },
        },
        professor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            universityId: true,
          },
        },
      },
    });

    return updatedSchedule;
  }

  /**
   * Delete schedule (soft delete by setting isActive to false)
   */
  static async deleteSchedule(
    scheduleId: number,
  ): Promise<ScheduleWithRelations> {
    const schedule = await prisma.schedule.findUnique({
      where: { id: scheduleId },
    });

    if (!schedule) {
      throw new Error("Schedule not found");
    }

    // Soft delete by setting isActive to false
    const deletedSchedule = await prisma.schedule.update({
      where: { id: scheduleId },
      data: { isActive: false },
      include: {
        course: {
          select: {
            id: true,
            courseCode: true,
            courseName: true,
            credits: true,
            isActive: true,
          },
        },
        professor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            universityId: true,
          },
        },
      },
    });

    return deletedSchedule;
  }

  /**
   * Check for schedule conflicts
   */
  static async checkScheduleConflict(
    professorId: number,
    dayOfWeek: number,
    startTime: string,
    endTime: string,
    room?: string,
    excludeScheduleId?: number,
  ): Promise<ScheduleConflict> {
    const where: Prisma.ScheduleWhereInput = {
      professorId,
      dayOfWeek,
      isActive: true,
    };

    if (excludeScheduleId) {
      where.id = { not: excludeScheduleId };
    }

    const existingSchedules = await prisma.schedule.findMany({
      where,
      include: {
        course: {
          select: {
            courseCode: true,
            courseName: true,
          },
        },
      },
    });

    const conflictingSchedules: (Schedule & {
      course: { courseCode: string; courseName: string };
    })[] = [];

    for (const schedule of existingSchedules) {
      // Check time overlap
      if (
        this.isTimeOverlap(
          startTime,
          endTime,
          schedule.startTime,
          schedule.endTime,
        )
      ) {
        conflictingSchedules.push(schedule);
      }
    }

    // Check room conflicts if room is specified
    if (room) {
      const roomSchedules = await prisma.schedule.findMany({
        where: {
          room: room ?? undefined,
          dayOfWeek,
          isActive: true,
          ...(excludeScheduleId && { id: { not: excludeScheduleId } }),
        },
        include: {
          course: {
            select: {
              courseCode: true,
              courseName: true,
            },
          },
        },
      });

      for (const schedule of roomSchedules) {
        if (
          this.isTimeOverlap(
            startTime,
            endTime,
            schedule.startTime,
            schedule.endTime,
          )
        ) {
          if (!conflictingSchedules.find((s) => s.id === schedule.id)) {
            conflictingSchedules.push(schedule);
          }
        }
      }
    }

    if (conflictingSchedules.length > 0) {
      const conflictMessages = conflictingSchedules.map((schedule) => {
        if (room && schedule.room === room) {
          return `Room conflict with ${schedule.course.courseCode} (${schedule.startTime}-${schedule.endTime})`;
        } else {
          return `Time conflict with ${schedule.course.courseCode} (${schedule.startTime}-${schedule.endTime})`;
        }
      });

      return {
        hasConflict: true,
        conflictingSchedules,
        message: conflictMessages.join("; "),
      };
    }

    return {
      hasConflict: false,
      conflictingSchedules: [],
    };
  }

  /**
   * Get schedules for a specific day
   */
  static async getSchedulesByDay(
    dayOfWeek: number,
    professorId?: number,
  ): Promise<ScheduleWithRelations[]> {
    return await this.getAllSchedules(professorId, undefined, dayOfWeek, true);
  }

  /**
   * Get schedules for a specific room
   */
  static async getSchedulesByRoom(
    room: string,
    dayOfWeek?: number,
  ): Promise<ScheduleWithRelations[]> {
    const where: Prisma.ScheduleWhereInput = {
      room,
      isActive: true,
    };

    if (dayOfWeek !== undefined) {
      where.dayOfWeek = dayOfWeek;
    }

    const schedules = await prisma.schedule.findMany({
      where,
      include: {
        course: {
          select: {
            id: true,
            courseCode: true,
            courseName: true,
            credits: true,
            isActive: true,
          },
        },
        professor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            universityId: true,
          },
        },
      },
      orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
    });

    return schedules;
  }

  /**
   * Helper method to validate time format
   */
  private static isValidTimeFormat(time: string): boolean {
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(time);
  }

  /**
   * Helper method to check if two time ranges overlap
   */
  private static isTimeOverlap(
    start1: string,
    end1: string,
    start2: string,
    end2: string,
  ): boolean {
    const time1Start = this.timeToMinutes(start1);
    const time1End = this.timeToMinutes(end1);
    const time2Start = this.timeToMinutes(start2);
    const time2End = this.timeToMinutes(end2);

    return time1Start < time2End && time2Start < time1End;
  }

  /**
   * Helper method to convert time string to minutes
   */
  private static timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(":").map(Number);
    return hours * 60 + minutes;
  }

  /**
   * Get schedule statistics
   */
  static async getScheduleStats(professorId?: number): Promise<ScheduleStats> {
    const where: Prisma.ScheduleWhereInput = { isActive: true };

    if (professorId) {
      where.professorId = professorId;
    }

    const schedules = await prisma.schedule.findMany({
      where,
      include: {
        course: {
          select: {
            courseCode: true,
            courseName: true,
          },
        },
      },
    });

    const stats = {
      totalSchedules: schedules.length,
      schedulesByDay: {
        Sunday: schedules.filter((s) => s.dayOfWeek === 0).length,
        Monday: schedules.filter((s) => s.dayOfWeek === 1).length,
        Tuesday: schedules.filter((s) => s.dayOfWeek === 2).length,
        Wednesday: schedules.filter((s) => s.dayOfWeek === 3).length,
        Thursday: schedules.filter((s) => s.dayOfWeek === 4).length,
        Friday: schedules.filter((s) => s.dayOfWeek === 5).length,
        Saturday: schedules.filter((s) => s.dayOfWeek === 6).length,
      },
      uniqueRooms: [...new Set(schedules.map((s) => s.room).filter(Boolean))]
        .length,
      uniqueCourses: [...new Set(schedules.map((s) => s.courseId))].length,
    };

    return stats;
  }

  /**
   * Today's schedule for a user
   */
  static async getTodaySchedule(
    userId: number,
    userRole: string,
    dayOfWeek: number,
  ): Promise<TodaySchedule[]> {
    console.log(
      `[ScheduleService] Getting today's schedule for user ${userId}, role: ${userRole}, day: ${dayOfWeek}`,
    );

    if (userRole === "STUDENT") {
      // Get student's major and level
      const student = await prisma.user.findUnique({
        where: { id: userId },
        select: { major: true, level: true },
      });

      if (!student || !student.major || student.level === null) {
        console.log(
          `[ScheduleService] Student ${userId} has no major or level defined.`,
        );
        return [];
      }

      // Get today's schedules for ANY active course that matches the student's major and level
      const schedules = await prisma.schedule.findMany({
        where: {
          dayOfWeek: dayOfWeek,
          isActive: true,
          course: {
            major: student.major,
            level: student.level,
            isActive: true,
            isArchived: false,
          },
        },
        include: {
          course: {
            select: {
              id: true,
              courseCode: true,
              courseName: true,
              professor: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
          professor: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: {
          startTime: "asc",
        },
      });

      console.log(
        `[ScheduleService] Found ${schedules.length} schedules for today for major ${student.major} Level ${student.level}`,
      );

      // Transform to expected format
      return schedules.map((schedule) => {
        const leadProfName = schedule.course?.professor
          ? `${schedule.course.professor.firstName} ${schedule.course.professor.lastName}`
          : null;
        const sessionProfName =
          `${schedule.professor?.firstName || ""} ${schedule.professor?.lastName || ""}`.trim();

        return {
          id: String(schedule.id),
          courseName: schedule.course.courseName,
          courseCode: schedule.course.courseCode,
          professorFirstName: schedule.professor.firstName,
          professorLastName: schedule.professor.lastName,
          // Favor lead professor as the primary name
          professorName: leadProfName || sessionProfName,
          sessionProfessor: sessionProfName,
          leadProfessor: leadProfName,
          startTime: schedule.startTime,
          endTime: schedule.endTime,
          room: schedule.room || "TBA",
          dayOfWeek: schedule.dayOfWeek,
        };
      });
    } else if (userRole === "PROFESSOR" || userRole === "ADMIN") {
      // Get schedules for courses the professor teaches today
      const schedules = await prisma.schedule.findMany({
        where: {
          professorId: userId,
          dayOfWeek: dayOfWeek,
          isActive: true,
        },
        include: {
          course: {
            select: {
              id: true,
              courseCode: true,
              courseName: true,
            },
          },
          professor: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: {
          startTime: "asc",
        },
      });

      console.log(
        `[ScheduleService] Found ${schedules.length} teaching schedules for today`,
      );

      // Transform to expected format
      return schedules.map((schedule) => ({
        id: String(schedule.id),
        courseName: schedule.course.courseName,
        courseCode: schedule.course.courseCode,
        professorFirstName: schedule.professor.firstName,
        professorLastName: schedule.professor.lastName,
        professorName: `${schedule.professor.firstName} ${schedule.professor.lastName}`,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        room: schedule.room || "TBA",
        dayOfWeek: schedule.dayOfWeek,
      }));
    }

    console.log("[ScheduleService] No matching role found");
    return [];
  }
}

export const getScheduleService = () => ScheduleService;
export default ScheduleService;
