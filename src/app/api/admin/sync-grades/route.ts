import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET() {
  try {
    console.log("[SyncGrades] Starting synchronization...");
    
    // 1. Get all submissions that don't have a corresponding Grade record
    const submissions = await prisma.quizSubmission.findMany({
      include: {
        quiz: {
          include: {
            questions: true,
            course: true
          }
        }
      }
    });

    let createdCount = 0;
    
    for (const sub of submissions) {
      const existingGrade = await prisma.grade.findFirst({
        where: {
          quizId: sub.quizId,
          studentId: sub.studentId
        }
      });

      if (!existingGrade) {
        const totalPossiblePoints = sub.quiz.questions.reduce((acc, q) => acc + q.points, 0);
        
        await prisma.grade.create({
          data: {
            studentId: sub.studentId,
            courseId: sub.quiz.courseId,
            quizId: sub.quizId,
            score: sub.score,
            maxScore: totalPossiblePoints || 100,
            type: "QUIZ",
            markedBy: sub.quiz.course.professorId,
            notes: `Auto-synced from quiz submission`,
            createdAt: sub.submittedAt
          }
        });
        createdCount++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully synced ${createdCount} missing grades.`,
      syncedCount: createdCount
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[SyncGrades] Error:", error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
