import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const fixes = [
        { courseId: 731, doctorId: 51 }, // Compiler Theory & Design -> د. شريف محمد صبحي
        { courseId: 725, doctorId: 51 }, // Computer Networks -> د. شريف محمد صبحي
        { courseId: 730, doctorId: 51 }, // Information Security -> د. شريف محمد صبحي
        { courseId: 767, doctorId: 58 }, // Business Math -> د. حنان حسين حسن فرج
    ];

    console.log('--- Applying Bulk Course Lead Professor Fixes ---');

    for (const fix of fixes) {
        try {
            const updated = await prisma.course.update({
                where: { id: fix.courseId },
                data: { professorId: fix.doctorId },
                include: {
                    professor: { select: { name: true } }
                }
            });
            console.log(`Updated course ${fix.courseId} (${updated.courseName}): New lead is ${updated.professor.name}`);
        } catch (error) {
            console.error(`Failed to update course ${fix.courseId}:`, error);
        }
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
