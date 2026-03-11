import prisma from "../lib/db";

export interface AttendanceStats {
  totalClasses: number;
  attendedClasses: number;
  missedClasses: number;
  lateArrivals: number;
  excusedAbsences: number;
  attendancePercentage: number;
  recentAttendance: AttendanceRecord[];
}

export interface AttendanceRecord {
  id: number;
  status: string;
  markedAt: Date;
  qrCode: {
    title: string;
    createdAt: Date;
  };
}

export interface CourseAttendanceStats {
  courseId: number;
  courseName: string;
  courseCode: string;
  totalSessions: number;
  attendancePercentage: number;
  lastAttendanceDate?: Date;
  attendanceHistory: AttendanceRecord[];
}

export interface StudentAttendanceOverview {
  studentId: number;
  studentName: string;
  totalCourses: number;
  overallAttendancePercentage: number;
  courseStats: CourseAttendanceStats[];
}

export class AttendanceStatsService {
  /**
   * Get attendance statistics for a student in a specific course
   */
  static async getStudentCourseAttendanceStats(
    studentId: number,
    courseId: number,
  ): Promise<AttendanceStats> {
    try {
      // Get all attendance records for the student in this course
      const attendanceRecords = await prisma.attendanceRecord.findMany({
        where: {
          studentId,
          courseId,
        },
        include: {
          qrCode: true,
        },
        orderBy: {
          markedAt: "desc",
        },
      });

      // Get total QR code sessions for this course
      const totalSessions = await prisma.qRCode.count({
        where: {
          courseId,
        },
      });

      // Calculate statistics
      const attendedClasses = attendanceRecords.filter(
        (record) => record.status === "PRESENT",
      ).length;
      const lateArrivals = attendanceRecords.filter(
        (record) => record.status === "LATE",
      ).length;
      const excusedAbsences = attendanceRecords.filter(
        (record) => record.status === "EXCUSED",
      ).length;
      const missedClasses =
        totalSessions - attendedClasses - lateArrivals - excusedAbsences;

      const attendancePercentage =
        totalSessions > 0
          ? Math.round(((attendedClasses + lateArrivals) / totalSessions) * 100)
          : 0;

      return {
        totalClasses: totalSessions,
        attendedClasses,
        missedClasses,
        lateArrivals,
        excusedAbsences,
        attendancePercentage,
        recentAttendance: attendanceRecords.slice(0, 10).map((record) => ({
          id: record.id,
          status: record.status,
          markedAt: record.markedAt,
          qrCode: record.qrCode
            ? {
                title: record.qrCode.title,
                createdAt: record.qrCode.createdAt,
              }
            : { title: "Unknown Session", createdAt: record.markedAt },
        })),
      };
    } catch (error) {
      console.error("Error getting student course attendance stats:", error);
      throw new Error("Failed to get attendance statistics");
    }
  }

  /**
   * Get attendance statistics for all courses of a student
   */
  static async getStudentAttendanceOverview(
    studentId: number,
  ): Promise<StudentAttendanceOverview> {
    try {
      // Get student info and enrollments in one query
      const student = await prisma.user.findUnique({
        where: { id: studentId },
        include: {
          enrollments: {
            where: {
              status: "ACTIVE",
            },
            include: {
              course: true,
            },
          },
        },
      });

      if (!student) {
        throw new Error("Student not found");
      }

      const enrollments = student.enrollments;
      const courseIds = enrollments.map((e) => e.courseId);

      if (courseIds.length === 0) {
        return {
          studentId,
          studentName: `${student.firstName} ${student.lastName}`,
          totalCourses: 0,
          overallAttendancePercentage: 0,
          courseStats: [],
        };
      }

      // Get all attendance records and QR counts in parallel to save time
      const [allAttendanceRecords, qrCodeCounts] = await Promise.all([
        prisma.attendanceRecord.findMany({
          where: {
            studentId,
            courseId: { in: courseIds },
          },
          include: {
            qrCode: {
              select: { title: true, createdAt: true },
            },
          },
          orderBy: {
            markedAt: "desc",
          },
        }),
        prisma.qRCode.groupBy({
          by: ["courseId"],
          where: {
            courseId: { in: courseIds },
          },
          _count: {
            id: true,
          },
        }),
      ]);

      const qrCountMap = new Map<number, number>(
        qrCodeCounts.map((q) => [q.courseId, q._count.id]),
      );

      const courseStats: CourseAttendanceStats[] = enrollments.map(
        (enrollment) => {
          const courseId = enrollment.courseId;
          const records = allAttendanceRecords.filter(
            (r) => r.courseId === courseId,
          );
          const totalSessions = qrCountMap.get(courseId) || 0;

          const attendedClasses = records.filter(
            (r) => r.status === "PRESENT" || r.status === "LATE",
          ).length;

          const attendancePercentage =
            totalSessions > 0
              ? Math.round((attendedClasses / totalSessions) * 100)
              : 0;

          return {
            courseId: enrollment.course.id,
            courseName: enrollment.course.courseName,
            courseCode: enrollment.course.courseCode,
            totalSessions,
            attendancePercentage,
            lastAttendanceDate: records[0]?.markedAt,
            attendanceHistory: records.slice(0, 10).map((record) => ({
              id: record.id,
              status: record.status,
              markedAt: record.markedAt,
              qrCode: record.qrCode
                ? {
                    title: record.qrCode.title,
                    createdAt: record.qrCode.createdAt,
                  }
                : { title: "Unknown Session", createdAt: record.markedAt },
            })),
          };
        },
      );

      // Calculate overall attendance percentage more accurately
      let totalSessionsSum = 0;
      let totalAttendedSum = 0;

      courseStats.forEach((course) => {
        totalSessionsSum += course.totalSessions;
        // Count actual attended sessions instead of calculating from percentage to avoid rounding errors
        const actualAttended = allAttendanceRecords.filter(
          (r) =>
            r.courseId === course.courseId &&
            (r.status === "PRESENT" || r.status === "LATE"),
        ).length;
        totalAttendedSum += actualAttended;
      });

      const overallAttendancePercentage =
        totalSessionsSum > 0
          ? Math.round((totalAttendedSum / totalSessionsSum) * 100)
          : 0;

      return {
        studentId,
        studentName: `${student.firstName} ${student.lastName}`,
        totalCourses: enrollments.length,
        overallAttendancePercentage,
        courseStats,
      };
    } catch (error) {
      console.error("Error getting student attendance overview:", error);
      throw error;
    }
  }

  /**
   * Get attendance statistics for a course (Professor view)
   */
  static async getCourseAttendanceStats(courseId: number): Promise<{
    courseId: number;
    courseName: string;
    courseCode: string;
    totalSessions: number;
    totalStudents: number;
    averageAttendancePercentage: number;
    attendanceBySession: Array<{
      sessionId: string;
      title: string;
      date: Date;
      totalStudents: number;
      attendedStudents: number;
      attendancePercentage: number;
    }>;
    studentStats: Array<{
      studentId: number;
      studentName: string;
      attendancePercentage: number;
      totalSessions: number;
      attendedSessions: number;
    }>;
  }> {
    try {
      // Get course info, enrollments, QR sessions, and records in fewer queries
      const [course, qrSessions, allCourseRecords] = await Promise.all([
        prisma.course.findUnique({
          where: { id: courseId },
          include: {
            enrollments: {
              where: {
                status: "ACTIVE",
              },
              include: {
                student: true,
              },
            },
          },
        }),
        prisma.qRCode.findMany({
          where: { courseId },
          include: {
            attendanceRecords: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        }),
        prisma.attendanceRecord.findMany({
          where: { courseId },
        }),
      ]);

      if (!course) {
        throw new Error("Course not found");
      }

      const totalStudents = course.enrollments.length;
      const totalSessions = qrSessions.length;

      // Calculate attendance by session
      const attendanceBySession = qrSessions.map((session) => {
        const attendedStudents = session.attendanceRecords.filter(
          (record) => record.status === "PRESENT" || record.status === "LATE",
        ).length;
        const attendancePercentage =
          totalStudents > 0
            ? Math.round((attendedStudents / totalStudents) * 100)
            : 0;

        return {
          sessionId: session.sessionId,
          title: session.title,
          date: session.createdAt,
          totalStudents,
          attendedStudents,
          attendancePercentage,
        };
      });

      // Calculate student statistics
      const studentStats = course.enrollments.map(
        (enrollment: {
          studentId: number;
          student: { firstName: string; lastName: string };
        }) => {
          const studentId = enrollment.studentId;
          const studentRecords = allCourseRecords.filter(
            (r) => r.studentId === studentId,
          );

          const attendedSessions = studentRecords.filter(
            (r) => r.status === "PRESENT" || r.status === "LATE",
          ).length;

          const attendancePercentage =
            totalSessions > 0
              ? Math.round((attendedSessions / totalSessions) * 100)
              : 0;

          return {
            studentId: enrollment.studentId,
            studentName: `${enrollment.student.firstName} ${enrollment.student.lastName}`,
            attendancePercentage,
            totalSessions,
            attendedSessions,
          };
        },
      );

      // Calculate average attendance percentage
      const averageAttendancePercentage =
        studentStats.length > 0
          ? Math.round(
              studentStats.reduce(
                (sum: number, student) => sum + student.attendancePercentage,
                0,
              ) / studentStats.length,
            )
          : 0;

      return {
        courseId: course.id,
        courseName: course.courseName,
        courseCode: course.courseCode,
        totalSessions,
        totalStudents,
        averageAttendancePercentage,
        attendanceBySession,
        studentStats,
      };
    } catch (error) {
      console.error("Error getting course attendance stats:", error);
      throw new Error("Failed to get course attendance statistics");
    }
  }

  /**
   * Get attendance trends for a student over time
   */
  static async getAttendanceTrends(
    studentId: number,
    courseId: number,
    days: number = 30,
  ): Promise<
    Array<{
      date: string;
      attendancePercentage: number;
      totalSessions: number;
      attendedSessions: number;
    }>
  > {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Get attendance records within the date range
      const attendanceRecords = await prisma.attendanceRecord.findMany({
        where: {
          studentId,
          courseId,
          markedAt: {
            gte: startDate,
          },
        },
        include: {
          qrCode: true,
        },
        orderBy: {
          markedAt: "asc",
        },
      });

      // Group by date and calculate daily statistics
      const dailyStats = new Map<
        string,
        {
          totalSessions: number;
          attendedSessions: number;
        }
      >();

      attendanceRecords.forEach((record) => {
        const date = record.markedAt.toISOString().split("T")[0];
        if (!dailyStats.has(date)) {
          dailyStats.set(date, { totalSessions: 0, attendedSessions: 0 });
        }

        const stats = dailyStats.get(date)!;
        stats.totalSessions++;
        if (record.status === "PRESENT" || record.status === "LATE") {
          stats.attendedSessions++;
        }
      });

      // Convert to array format
      return Array.from(dailyStats.entries()).map(([date, stats]) => ({
        date,
        attendancePercentage:
          stats.totalSessions > 0
            ? Math.round((stats.attendedSessions / stats.totalSessions) * 100)
            : 0,
        totalSessions: stats.totalSessions,
        attendedSessions: stats.attendedSessions,
      }));
    } catch (error) {
      console.error("Error getting attendance trends:", error);
      throw new Error("Failed to get attendance trends");
    }
  }
}

export const getAttendanceStatsService = () => AttendanceStatsService;
export default AttendanceStatsService;
