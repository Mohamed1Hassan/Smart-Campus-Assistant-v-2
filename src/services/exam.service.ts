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
    quizId?: number;
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
        quizId: data.quizId,
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
        endTime: {
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
        quiz: {
          include: {
            questions: {
              include: {
                options: true,
              },
            },
            submissions: {
              where: { studentId },
              select: { id: true, score: true, submittedAt: true }
            }
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
      include: {
        quiz: {
          select: {
            title: true,
            _count: {
              select: { questions: true },
            },
          },
        },
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
    // Determine the database enum type (Prisma is strict with Enums)
    let dbAlertType: FraudAlertType = FraudAlertType.SUSPICIOUS_PATTERN;
    
    // Map specific frontend types to DB Enums if they aren't directly supported
    const typeUpper = data.type.toUpperCase();
    if (Object.values(FraudAlertType).includes(typeUpper as FraudAlertType)) {
      dbAlertType = typeUpper as FraudAlertType;
    }

    // 1. Save to database
    const alert = await prisma.fraudAlert.create({
      data: {
        studentId: data.studentId,
        alertType: dbAlertType,
        severity: AlertSeverity.HIGH,
        description: `Exam proctoring violation: ${data.type}`,
        metadata: {
          examId: data.examId,
          violationType: data.type, // Keep original string for display
          ...data.metadata,
        },
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
      },
    });

    // 2. Fetch student's score if they have already submitted the linked quiz
    let studentScore: number | undefined;
    try {
      const examData = await prisma.exam.findUnique({
        where: { id: data.examId },
        select: { quizId: true }
      });

      if (examData?.quizId) {
        const submission = await prisma.quizSubmission.findUnique({
          where: {
            quizId_studentId: {
              quizId: examData.quizId,
              studentId: data.studentId
            }
          },
          select: { score: true }
        });
        if (submission) studentScore = submission.score;
      }
    } catch (e) {
      console.error("[ExamService] Error fetching student score for alert:", e);
    }

    // 3. Notify the professor in real-time if they are online
    const exam = await prisma.exam.findUnique({
      where: { id: data.examId },
      select: { professorId: true },
    });

    if (exam && socketService) {
      // 1. Send personal notification to the professor
      socketService.sendNotificationToUser(exam.professorId, {
        id: String(alert.id),
        title: "Security Alert",
        message: `${alert.student.firstName} ${alert.student.lastName} triggered a ${data.type} violation.`,
        type: "ERROR",
        category: "EXAM",
        metadata: {
          alertId: alert.id,
          studentName: `${alert.student.firstName} ${alert.student.lastName}`,
          studentCode: alert.student.universityId,
          studentScore: studentScore,
          violationType: data.type,
          examId: data.examId,
        },
        createdAt: alert.createdAt,
      });

      // 2. Broadcast directly to the live proctoring channel for the dashboard
      socketService.broadcastToChannel(`exam-proctoring-${data.examId}`, 'exam_alert', {
        id: alert.id,
        category: "EXAM",
        metadata: {
          studentName: `${alert.student.firstName} ${alert.student.lastName}`,
          studentCode: alert.student.universityId,
          studentScore: studentScore,
          violationType: data.type,
          examId: data.examId,
        },
        createdAt: alert.createdAt,
      });
    }

    return alert;
  }
  /**
   * Delete an exam
   */
  static async deleteExam(examId: number): Promise<void> {
    await prisma.exam.delete({
      where: { id: examId },
    });
  }

  /**
   * Get fraud alerts for an exam (Placeholder)
   */
  static async getExamAlerts(examId: number) {
    const alerts = await prisma.fraudAlert.findMany({
      where: {
        metadata: {
          path: ['examId'],
          equals: examId
        }
      },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            universityId: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Fetch scores separately to avoid complex nested includes that might fail or be slow
    // and attach them to the alerts
    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      select: { quizId: true }
    });

    if (!exam?.quizId) return alerts;

    const submissions = await prisma.quizSubmission.findMany({
      where: {
        quizId: exam.quizId,
        studentId: { in: alerts.map(a => a.studentId) }
      },
      select: { studentId: true, score: true }
    });

    const scoreMap = new Map(submissions.map(s => [s.studentId, s.score]));

    return alerts.map(alert => ({
      ...alert,
      studentScore: scoreMap.get(alert.studentId)
    }));
  }
}
