import { PrismaClient } from "@prisma/client";
import * as dotenv from "dotenv";
dotenv.config();

const prisma = new PrismaClient();

async function sync() {
  console.log("Starting grade synchronization...");
  
  // 1. Get all submissions
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

  console.log(`Found ${submissions.length} submissions.`);

  let createdCount = 0;
  let skippedCount = 0;

  for (const sub of submissions) {
    // Check if grade already exists for this quiz/student
    const existingGrade = await prisma.grade.findFirst({
      where: {
        quizId: sub.quizId,
        studentId: sub.studentId
      }
    });

    if (existingGrade) {
      skippedCount++;
      continue;
    }

    const totalPossiblePoints = sub.quiz.questions.reduce((acc, q) => acc + q.points, 0);

    // Create the grade
    await prisma.grade.create({
      data: {
        studentId: sub.studentId,
        courseId: sub.quiz.courseId,
        quizId: sub.quizId,
        score: sub.score,
        maxScore: totalPossiblePoints || 100,
        type: "QUIZ",
        markedBy: sub.quiz.course.professorId,
        notes: `Auto-synced from previous submission for ${sub.quiz.title}`,
        createdAt: sub.submittedAt
      }
    });
    createdCount++;
  }

  console.log(`Sync complete! Created: ${createdCount}, Skipped (already exist): ${skippedCount}`);
}

sync()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
