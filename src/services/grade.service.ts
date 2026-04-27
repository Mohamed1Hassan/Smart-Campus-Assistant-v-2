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
    const grades = await prisma.$queryRawUnsafe<Record<string, unknown>[]>(
      `SELECT g.*, 
              c."courseName" as "course_courseName", 
              c."courseCode" as "course_courseCode",
              q.title as "quiz_title"
       FROM grades g
       LEFT JOIN courses c ON g."courseId" = c.id
       LEFT JOIN quizzes q ON g."quizId" = q.id
       WHERE g."studentId" = $1
       ${courseId ? `AND g."courseId" = $2` : ""}
       ORDER BY g."createdAt" DESC`,
      ...[studentId, courseId].filter(v => v !== undefined)
    );

    return grades.map(r => ({
      ...r,
      course: {
        courseName: r.course_courseName as string,
        courseCode: r.course_courseCode as string
      },
      quiz: r.quiz_title ? { title: r.quiz_title as string } : undefined
    })) as unknown as Grade[];
  }

  /**
   * Get all grades for a course (Professor view)
   */
  static async getCourseGrades(courseId: number): Promise<Grade[]> {
    const grades = await prisma.$queryRawUnsafe<Record<string, unknown>[]>(
      `SELECT g.*, 
              s."firstName" as "student_firstName", 
              s."lastName" as "student_lastName", 
              s."universityId" as "student_universityId",
              q.title as "quiz_title"
       FROM grades g
       LEFT JOIN users s ON g."studentId" = s.id
       LEFT JOIN quizzes q ON g."quizId" = q.id
       WHERE g."courseId" = $1
       ORDER BY g."createdAt" DESC`,
      courseId
    );

    return grades.map(r => ({
      ...r,
      student: {
        firstName: r.student_firstName as string,
        lastName: r.student_lastName as string,
        universityId: r.student_universityId as string
      },
      quiz: r.quiz_title ? { title: r.quiz_title as string } : undefined
    })) as unknown as Grade[];
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
  /**
   * Update the integrity status of a grade
   */
  static async updateIntegrityStatus(gradeId: number, status: string): Promise<Grade> {
    // Using raw SQL bypasses the Prisma Client's generated types which might be out of sync
    await prisma.$executeRawUnsafe(
      `UPDATE grades SET "integrityStatus" = $1 WHERE id = $2`,
      status,
      gradeId
    );
    return prisma.grade.findUnique({ where: { id: gradeId } }) as Promise<Grade>;
  }
}
