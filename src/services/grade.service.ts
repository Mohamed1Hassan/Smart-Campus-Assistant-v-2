import prisma from "../lib/db";
import { Grade } from "@prisma/client";

export class GradeService {
  /**
   * Assign a grade to a student for a specific course/quiz
   */
  static async assignGrade(data: {
    studentId: number;
    courseId: number;
    quizId?: number;
    score: number;
    maxScore?: number;
    type: string;
    markedBy: number;
    notes?: string;
  }): Promise<Grade> {
    return prisma.grade.create({
      data: {
        studentId: data.studentId,
        courseId: data.courseId,
        quizId: data.quizId,
        score: data.score,
        maxScore: data.maxScore ?? 100,
        type: data.type,
        markedBy: data.markedBy,
        notes: data.notes,
      },
    });
  }

  /**
   * Get grades for a specific student in a course
   */
  static async getStudentGrades(
    studentId: number,
    courseId?: number,
  ): Promise<Grade[]> {
    return prisma.grade.findMany({
      where: {
        studentId,
        ...(courseId && { courseId }),
      },
      include: {
        course: {
          select: {
            courseName: true,
            courseCode: true,
          },
        },
        quiz: {
          select: {
            title: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  /**
   * Get all grades for a course (Professor view)
   */
  static async getCourseGrades(courseId: number): Promise<Grade[]> {
    return prisma.grade.findMany({
      where: { courseId },
      include: {
        student: {
          select: {
            firstName: true,
            lastName: true,
            universityId: true,
          },
        },
        quiz: {
          select: {
            title: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  /**
   * Calculate student average for a course
   */
  static async calculateCourseAverage(
    studentId: number,
    courseId: number,
  ): Promise<number> {
    const grades = await prisma.grade.findMany({
      where: { studentId, courseId },
    });

    if (grades.length === 0) return 0;

    const totalWeightedScore = grades.reduce(
      (acc, g) => acc + g.score / g.maxScore,
      0,
    );
    return (totalWeightedScore / grades.length) * 100;
  }
}
