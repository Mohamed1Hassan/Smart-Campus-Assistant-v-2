import { PrismaClient } from "@prisma/client";
import * as dotenv from "dotenv";
dotenv.config();
const prisma = new PrismaClient();

async function check() {
  const submissions = await prisma.quizSubmission.count();
  const grades = await prisma.grade.count();
  console.log(`Submissions: ${submissions}`);
  console.log(`Grades: ${grades}`);
  
  const sampleSubmission = await prisma.quizSubmission.findFirst({
    include: { quiz: true }
  });
  console.log('Sample Submission:', JSON.stringify(sampleSubmission, null, 2));
}

check().catch(console.error);
