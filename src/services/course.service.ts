import {
  CourseEnrollment,
  EnrollmentStatus,
  SemesterType,
  Prisma,
  Course,
} from "@prisma/client";
import prisma from "../lib/db";

export interface CreateCourseData {
  courseCode: string;
  courseName: string;
  description?: string;
  major?: string;
  level?: number;
  credits?: number;
  professorId: number;
  semester: SemesterType;
  academicYear: string;
}

export interface UpdateCourseData {
  courseCode?: string;
  courseName?: string;
  description?: string;
  major?: string;
  level?: number;
  credits?: number;
  professorId?: number;
  semester?: SemesterType;
  academicYear?: string;
  coverImage?: string;
  isActive?: boolean;
}

export interface CourseStats {
  totalEnrollments: number;
  activeEnrollments: number;
  droppedEnrollments: number;
  completedEnrollments: number;
  totalSchedules: number;
  course: {
    id: number;
    courseCode: string;
    courseName: string;
    credits: number;
    isActive: boolean;
  };
}

export interface EnrollStudentData {
  studentId: number;
  courseId: number;
}

export type CourseWithProfessor = Prisma.CourseGetPayload<{
  include: {
    professor: {
      select: {
        id: true;
        firstName: true;
        lastName: true;
        email: true;
        universityId: true;
      };
    };
  };
}>;

export type CourseWithFullDetails = Prisma.CourseGetPayload<{
  include: {
    professor: {
      select: {
        id: true;
        firstName: true;
        lastName: true;
        email: true;
        universityId: true;
      };
    };
    enrollments: {
      include: {
        student: {
          select: {
            id: true;
            firstName: true;
            lastName: true;
            universityId: true;
            email: true;
          };
        };
      };
    };
    schedules: {
      include: { professor: true };
    };
  };
}>;

export type CourseSummary = Course;

export type CourseListResult = Prisma.CourseGetPayload<{
  include: {
    professor: {
      select: {
        id: true;
        firstName: true;
        lastName: true;
        email: true;
        universityId: true;
      };
    };
    _count: {
      select: {
        enrollments: true;
      };
    };
    schedules: true;
  };
}>;

export class CourseService {
  /**
   * Create a new course
   */
  static async createCourse(
    data: CreateCourseData,
  ): Promise<CourseWithProfessor> {
    try {
      // Check if course code already exists for the same semester and year
      const existingCourse = await prisma.course.findUnique({
        where: {
          courseCode_semester_academicYear: {
            courseCode: data.courseCode,
            semester: data.semester,
            academicYear: data.academicYear,
          },
        },
      });

      if (existingCourse) {
        throw new Error("Course code already exists");
      }

      // Verify professor exists and has correct role
      const professor = await prisma.user.findUnique({
        where: { id: data.professorId },
      });

      if (!professor) {
        throw new Error("Professor not found");
      }

      if (professor.role !== "PROFESSOR" && professor.role !== "ADMIN") {
        throw new Error("User is not authorized to create courses");
      }

      const course = await prisma.course.create({
        data: {
          courseCode: data.courseCode,
          courseName: data.courseName,
          description: data.description,
          major: data.major,
          level: data.level,
          credits: data.credits || 3,
          professorId: data.professorId,
          semester: data.semester,
          academicYear: data.academicYear,
          isActive: true, // Explicitly set isActive to true for new courses
          isArchived: false,
        },
        include: {
          professor: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              universityId: true,
            },
          },
          enrollments: {
            where: { status: "ACTIVE" },
            include: {
              student: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  universityId: true,
                },
              },
            },
          },
          schedules: {
            where: { isActive: true },
          },
        },
      });

      return course;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get all courses with optional filtering
   */
  /**
   * Get all courses with optional filtering
   */
  static async getAllCourses(
    professorId?: number,
    isActive?: boolean,
    summary: boolean = false,
  ): Promise<(CourseSummary | CourseListResult)[]> {
    try {
      const where: Prisma.CourseWhereInput = {};

      if (professorId) {
        where.OR = [
          { professorId: professorId },
          { schedules: { some: { professorId: professorId } } },
        ];
      }

      if (isActive !== undefined) {
        where.isActive = isActive;
      }

      // Default to non-archived courses unless specified
      if (where.isArchived === undefined) {
        where.isArchived = false;
      }

      // If summary is true, fetch minimal data
      if (summary) {
        const courses = await prisma.course.findMany({
          where,
          orderBy: { courseCode: "asc" },
        });
        return courses;
      }

      const courses = await prisma.course.findMany({
        where,
        include: {
          professor: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              universityId: true,
            },
          },
          _count: {
            select: {
              enrollments: { where: { status: "ACTIVE" } },
            },
          },
          schedules: {
            where: { isActive: true },
          },
        },
        orderBy: { courseCode: "asc" },
      });

      return courses;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get course by ID with full details
   */
  static async getCourseById(
    courseId: number,
  ): Promise<CourseWithFullDetails | null> {
    try {
      const course = await prisma.course.findUnique({
        where: { id: courseId },
        include: {
          professor: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              universityId: true,
            },
          },
          enrollments: {
            include: {
              student: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  universityId: true,
                  email: true,
                },
              },
            },
          },
          schedules: {
            where: { isActive: true },
            include: { professor: true },
            orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
          },
        },
      });

      return course;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update course information
   */
  static async updateCourse(
    courseId: number,
    data: UpdateCourseData,
  ): Promise<CourseWithProfessor> {
    try {
      // Check if course exists
      const existingCourse = await prisma.course.findUnique({
        where: { id: courseId },
      });

      if (!existingCourse) {
        throw new Error("Course not found");
      }

      // If updating course code, semester, or year, check for duplicates
      if (data.courseCode || data.semester || data.academicYear) {
        const checkCode = data.courseCode || existingCourse.courseCode;
        const checkSemester = data.semester || existingCourse.semester;
        const checkYear = data.academicYear || existingCourse.academicYear;

        const duplicateCourse = await prisma.course.findUnique({
          where: {
            courseCode_semester_academicYear: {
              courseCode: checkCode,
              semester: checkSemester,
              academicYear: checkYear,
            },
          },
        });

        if (duplicateCourse && duplicateCourse.id !== courseId) {
          throw new Error(
            "Course code already exists for this semester and year",
          );
        }
      }

      const updatedCourse = await prisma.course.update({
        where: { id: courseId },
        data,
        include: {
          professor: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              universityId: true,
            },
          },
        },
      });

      return updatedCourse;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete course (soft delete by setting isActive to false)
   */
  static async deleteCourse(courseId: number): Promise<CourseWithProfessor> {
    try {
      const course = await prisma.course.findUnique({
        where: { id: courseId },
      });

      if (!course) {
        throw new Error("Course not found");
      }

      // Soft delete by setting isActive to false
      const deletedCourse = await prisma.course.update({
        where: { id: courseId },
        data: { isActive: false },
        include: {
          professor: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              universityId: true,
            },
          },
        },
      });

      return deletedCourse;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Enroll student in a course
   */
  static async enrollStudent(
    data: EnrollStudentData,
  ): Promise<CourseEnrollment> {
    try {
      // Check if course exists and is active
      const course = await prisma.course.findUnique({
        where: { id: data.courseId },
      });

      if (!course) {
        throw new Error("Course not found");
      }

      if (!course.isActive) {
        throw new Error("Course is not active");
      }

      // Check if student exists
      const student = await prisma.user.findUnique({
        where: { id: data.studentId },
      });

      if (!student) {
        throw new Error("Student not found");
      }

      if (student.role !== "STUDENT") {
        throw new Error("User is not a student");
      }

      // Check if student is already enrolled
      const existingEnrollment = await prisma.courseEnrollment.findUnique({
        where: {
          studentId_courseId: {
            studentId: data.studentId,
            courseId: data.courseId,
          },
        },
      });

      if (existingEnrollment) {
        if (existingEnrollment.status === "ACTIVE") {
          throw new Error("Student is already enrolled in this course");
        } else {
          // Reactivate enrollment
          const reactivatedEnrollment = await prisma.courseEnrollment.update({
            where: { id: existingEnrollment.id },
            data: {
              status: "ACTIVE",
              enrolledAt: new Date(),
            },
            include: {
              student: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  universityId: true,
                },
              },
              course: {
                select: {
                  id: true,
                  courseCode: true,
                  courseName: true,
                },
              },
            },
          });

          return reactivatedEnrollment;
        }
      }

      // Create new enrollment
      const enrollment = await prisma.courseEnrollment.create({
        data: {
          studentId: data.studentId,
          courseId: data.courseId,
          status: "ACTIVE",
        },
        include: {
          student: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              universityId: true,
            },
          },
          course: {
            select: {
              id: true,
              courseCode: true,
              courseName: true,
            },
          },
        },
      });

      return enrollment;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get enrolled students for a course
   */
  static async getEnrolledStudents(
    courseId: number,
    status?: EnrollmentStatus,
  ): Promise<CourseEnrollment[]> {
    try {
      const where: Prisma.CourseEnrollmentWhereInput = { courseId };

      if (status) {
        where.status = status;
      }

      const enrollments = await prisma.courseEnrollment.findMany({
        where,
        include: {
          student: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              universityId: true,
              email: true,
            },
          },
        },
        orderBy: { enrolledAt: "desc" },
      });

      return enrollments;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get courses for a student
   */
  static async getStudentCourses(
    studentId: number,
  ): Promise<CourseEnrollment[]> {
    try {
      const enrollments = await prisma.courseEnrollment.findMany({
        where: {
          studentId,
          status: "ACTIVE",
        },
        include: {
          course: {
            include: {
              professor: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                  universityId: true,
                },
              },
              schedules: {
                where: { isActive: true },
                orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
              },
            },
          },
        },
        orderBy: { enrolledAt: "desc" },
      });

      return enrollments;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Drop student from course
   */
  static async dropStudent(
    studentId: number,
    courseId: number,
  ): Promise<CourseEnrollment> {
    try {
      const enrollment = await prisma.courseEnrollment.findUnique({
        where: {
          studentId_courseId: {
            studentId,
            courseId,
          },
        },
      });

      if (!enrollment) {
        throw new Error("Enrollment not found");
      }

      if (enrollment.status !== "ACTIVE") {
        throw new Error("Student is not currently enrolled in this course");
      }

      const updatedEnrollment = await prisma.courseEnrollment.update({
        where: { id: enrollment.id },
        data: { status: "DROPPED" },
        include: {
          student: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              universityId: true,
            },
          },
          course: {
            select: {
              id: true,
              courseCode: true,
              courseName: true,
            },
          },
        },
      });

      return updatedEnrollment;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get course statistics
   */
  static async getCourseStats(courseId: number): Promise<CourseStats> {
    try {
      const course = await prisma.course.findUnique({
        where: { id: courseId },
        include: {
          enrollments: true,
          schedules: {
            where: { isActive: true },
          },
        },
      });

      if (!course) {
        throw new Error("Course not found");
      }

      const stats: CourseStats = {
        totalEnrollments: course.enrollments.length,
        activeEnrollments: course.enrollments.filter(
          (e) => e.status === "ACTIVE",
        ).length,
        droppedEnrollments: course.enrollments.filter(
          (e) => e.status === "DROPPED",
        ).length,
        completedEnrollments: course.enrollments.filter(
          (e) => e.status === "COMPLETED",
        ).length,
        totalSchedules: course.schedules.length,
        course: {
          id: course.id,
          courseCode: course.courseCode,
          courseName: course.courseName,
          credits: course.credits,
          isActive: course.isActive,
        },
      };

      return stats;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Rollover courses to a new semester using pre-existing course data.
   * This logic assumes the database already contains the courses for the target semester (e.g. from a previous parsing/seeding).
   */
  static async rolloverCoursesToNewSemester(
    oldSemester: SemesterType,
    oldYear: string,
    newSemester: SemesterType,
    newYear: string,
  ): Promise<number> {
    try {
      console.log(
        `[CourseService] Starting Semester Rollover: ${oldSemester} ${oldYear} -> ${newSemester} ${newYear}`,
      );

      // 1. Snapshot active students and their levels/majors before archiving courses
      const oldEnrollments = await prisma.courseEnrollment.findMany({
        where: {
          status: "ACTIVE",
          course: {
            semester: oldSemester,
            academicYear: oldYear,
            isArchived: false,
          },
        },
        include: {
          student: { select: { id: true, major: true, level: true } },
        },
      });

      // Deduplicate students
      const activeStudentsMap = new Map<
        number,
        { id: number; major: string | null; level: number | null }
      >();
      for (const enr of oldEnrollments) {
        if (enr.student.major && enr.student.level) {
          activeStudentsMap.set(enr.studentId, enr.student);
        }
      }
      const activeStudents = Array.from(activeStudentsMap.values()) as {
        id: number;
        major: string;
        level: number;
      }[];
      console.log(
        `[CourseService] Found ${activeStudents.length} active students to rollover.`,
      );

      const resultCount = await prisma.$transaction(
        async (tx) => {
          // 2. Archive previous semester and mark enrollments as COMPLETED
          const archivedResult = await tx.course.updateMany({
            where: {
              semester: oldSemester,
              academicYear: oldYear,
              isArchived: false,
            },
            data: { isArchived: true, isActive: false },
          });
          console.log(
            `[CourseService] Archived ${archivedResult.count} ${oldSemester} courses.`,
          );

          await tx.courseEnrollment.updateMany({
            where: {
              status: "ACTIVE",
              course: { semester: oldSemester, academicYear: oldYear },
            },
            data: { status: "COMPLETED" },
          });

          // 3. Find EXISTING courses for the target semester
          const targetCourses = await tx.course.findMany({
            where: { semester: newSemester, academicYear: newYear },
            select: { id: true, major: true, level: true },
          });
          console.log(
            `[CourseService] Found ${targetCourses.length} existing ${newSemester} courses for rollover.`,
          );

          if (targetCourses.length === 0) {
            throw new Error(
              `No courses found for target semester ${newSemester} ${newYear}. Please ensure courses are imported before rollover.`,
            );
          }

          // 4. Ensure target courses are active
          await tx.course.updateMany({
            where: { semester: newSemester, academicYear: newYear },
            data: { isActive: true, isArchived: false },
          });

          // 5. Auto-Enroll students to the found courses based on major/level
          const enrollmentsToCreate: Prisma.CourseEnrollmentCreateManyInput[] =
            [];
          for (const student of activeStudents) {
            // Find courses matching student's major and level
            const studentTargets = targetCourses.filter(
              (c) => c.major === student.major && c.level === student.level,
            );
            for (const target of studentTargets) {
              enrollmentsToCreate.push({
                studentId: student.id,
                courseId: target.id,
                status: "ACTIVE",
                enrolledAt: new Date(),
              });
            }
          }

          if (enrollmentsToCreate.length > 0) {
            await tx.courseEnrollment.createMany({
              data: enrollmentsToCreate,
              skipDuplicates: true,
            });
            console.log(
              `[CourseService] Auto-enrolled students into ${enrollmentsToCreate.length} course slots.`,
            );
          }

          return targetCourses.length;
        },
        { timeout: 120000 },
      );

      console.log(
        `[CourseService] SUCCESS: Rolled over to ${newSemester} with ${resultCount} courses.`,
      );
      return resultCount;
    } catch (error: unknown) {
      console.error("[CourseService] ROLLOVER FAILURE:", error);
      throw error;
    }
  }

  /**
   * Search for courses with pagination and filters
   */
  static async searchCourses(params: {
    query?: string;
    isActive?: boolean;
    major?: string;
    semester?: string;
    level?: number;
    page: number;
    limit: number;
    includeSchedules?: boolean;
    isArchived?: boolean;
  }): Promise<{
    courses: CourseListResult[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    try {
      console.log("CourseService.searchCourses - Params:", params);
      const {
        query,
        isActive,
        major,
        semester,
        level,
        page,
        limit,
        includeSchedules,
        isArchived,
      } = params;
      const skip = (page - 1) * limit;

      const where: Prisma.CourseWhereInput = {};

      if (query) {
        where.OR = [
          { courseName: { contains: query, mode: "insensitive" } },
          { courseCode: { contains: query, mode: "insensitive" } },
        ];
      }

      if (major) {
        where.major = major;
      }

      if (semester) {
        where.semester = semester as SemesterType;
      }

      if (isActive !== undefined) {
        where.isActive = isActive;
      }

      if (level !== undefined) {
        where.level = level;
      }

      if (isArchived !== undefined) {
        where.isArchived = isArchived;
      } else if (where.isArchived === undefined) {
        // Default to non-archived courses for general search unless specified
        where.isArchived = false;
      }

      const [coursesResult, total] = await Promise.all([
        prisma.course.findMany({
          where,
          include: {
            professor: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                universityId: true,
              },
            },
            _count: {
              select: {
                enrollments: { where: { status: "ACTIVE" } },
              },
            },
            ...(includeSchedules
              ? {
                  schedules: {
                    where: { isActive: true },
                    include: { professor: true },
                  },
                }
              : {}),
          },
          orderBy: { courseCode: "asc" },
          skip,
          take: limit,
        }),
        prisma.course.count({ where }),
      ]);

      return {
        courses: coursesResult,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      console.error("Error searching courses:", error);
      throw error;
    }
  }

  /**
   * Get all unique majors/specializations from existing courses
   */
  static async getUniqueMajors(): Promise<string[]> {
    try {
      const result = await prisma.course.findMany({
        where: { major: { not: null } },
        distinct: ["major"],
        select: { major: true },
      });
      return result.map((r) => r.major as string).filter(Boolean);
    } catch (error) {
      console.error("Error fetching unique majors:", error);
      throw error;
    }
  }

  /**
   * Get all professors for course assignment
   */
  static async getProfessors(): Promise<
    {
      id: number;
      firstName: string;
      lastName: string;
      universityId: string;
      email: string;
      department: string | null;
    }[]
  > {
    try {
      return await prisma.user.findMany({
        where: { role: "PROFESSOR" },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          universityId: true,
          email: true,
          department: true,
        },
        orderBy: { firstName: "asc" },
      });
    } catch (error) {
      console.error("Error fetching professors:", error);
      throw error;
    }
  }
}

export const getCourseService = () => CourseService;
export default CourseService;
