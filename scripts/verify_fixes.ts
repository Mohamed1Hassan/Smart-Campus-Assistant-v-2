import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
    console.log("--- Verification: Courses with Arabic Names ---");
    const arabicCourses = await prisma.course.findMany({
        where: {
            courseName: {
                contains: "[\u0600-\u06FF]"
            }
        }
    });
    console.log(`Found ${arabicCourses.length} courses with Arabic names.`);

    console.log("\n--- Verification: Sample English Courses ---");
    const sampleCourses = await prisma.course.findMany({
        select: { courseName: true, professor: { select: { name: true } } },
        take: 10
    });
    console.table(sampleCourses.map(c => ({
        Course: c.courseName,
        Professor: c.professor?.name || 'N/A'
    })));

    console.log("\n--- Verification: Professors with 0 courses ---");
    const professors = await prisma.user.findMany({
        where: { role: 'PROFESSOR' },
        include: { coursesCreated: true }
    });
    const emptyProfs = professors.filter(p => p.coursesCreated.length === 0);
    console.log(`Professors with 0 courses: ${emptyProfs.length} / ${professors.length}`);
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
