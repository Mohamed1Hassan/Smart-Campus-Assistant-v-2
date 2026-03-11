import prisma from "../lib/db";
import {
  Exam,
  FraudAlert,
  FraudAlertType,
  AlertSeverity,
} from "@prisma/client";
import socketService from "./socket.service";

export class ExamService {
  /**
   * Schedule a new exam
   */
  static async scheduleExam(data: {
    courseId: number;
    professorId: number;
    title: string;
    description?: string;
    startTime: Date;
    endTime: Date;
    room?: string;
  }): Promise<Exam> {
    return prisma.exam.create({
      data: {
        courseId: data.courseId,
        professorId: data.professorId,
        title: data.title,
        description: data.description,
        startTime: data.startTime,
        endTime: data.endTime,
        room: data.room,
      },
    });
  }

  /**
   * Get upcoming exams for a student
   */
  static async getStudentUpcomingExams(studentId: number): Promise<Exam[]> {
    return prisma.exam.findMany({
      where: {
        course: {
          enrollments: {
            some: {
              studentId,
              status: "ACTIVE",
            },
          },
        },
        startTime: {
          gte: new Date(),
        },
        isActive: true,
      },
      include: {
        course: {
          select: {
            courseName: true,
            courseCode: true,
          },
        },
      },
      orderBy: {
        startTime: "asc",
      },
    });
  }

  /**
   * Get all exams for a course
   */
  static async getCourseExams(courseId: number): Promise<Exam[]> {
    return prisma.exam.findMany({
      where: { courseId },
      orderBy: {
        startTime: "asc",
      },
    });
  }

  /**
   * Update exam details
   */
  static async updateExam(examId: number, data: Partial<Exam>): Promise<Exam> {
    return prisma.exam.update({
      where: { id: examId },
      data,
    });
  }

  /**
   * Report a proctoring violation during an exam
   */
  static async reportViolation(data: {
    examId: number;
    studentId: number;
    type: string;
    metadata?: Record<string, unknown>;
  }): Promise<FraudAlert> {
    // 1. Save to database
    const alert = await prisma.fraudAlert.create({
      data: {
        studentId: data.studentId,
        alertType: data.type as FraudAlertType,
        severity: "HIGH" as AlertSeverity,
        description: `Exam proctoring violation: ${data.type}`,
        metadata: {
          examId: data.examId,
          ...data.metadata,
        },
      },
      include: {
        student: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // 2. Notify the professor in real-time if they are online
    const exam = await prisma.exam.findUnique({
      where: { id: data.examId },
      select: { professorId: true },
    });

    if (exam && socketService) {
      socketService.sendNotificationToUser(exam.professorId, {
        id: String(alert.id),
        title: "Security Alert",
        message: `${alert.student.firstName} ${alert.student.lastName} triggered a ${data.type} violation.`,
        type: "ERROR",
        category: "EXAM",
        metadata: {
          alertId: alert.id,
          studentName: `${alert.student.firstName} ${alert.student.lastName}`,
          violationType: data.type,
          examId: data.examId,
        },
        createdAt: alert.createdAt,
      });
    }

    return alert;
  }
}
