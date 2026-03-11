import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- Final Manual Fix for Operations Research & Data Structures ---');

    // Fix Operations Research (728)
    const orCourse = await prisma.course.findUnique({ where: { id: 728 }, include: { schedules: { include: { professor: true } } } });
    const orDoc = orCourse?.schedules.find(s => s.professor?.name.includes('حسن صلاح'))?.professor;
    if (orDoc) {
        await prisma.course.update({ where: { id: 728 }, data: { professorId: orDoc.id } });
        console.log(`Updated Operations Research: Lead is now ${orDoc.name}`);
    }

    // Fix Data Structures (726)
    const dsCourse = await prisma.course.findUnique({ where: { id: 726 }, include: { schedules: { include: { professor: true } } } });
    const dsDoc = dsCourse?.schedules.find(s => s.professor?.name.includes('إيمان منير'))?.professor;
    if (dsDoc) {
        await prisma.course.update({ where: { id: 726 }, data: { professorId: dsDoc.id } });
        console.log(`Updated Data Structures: Lead is now ${dsDoc.name}`);
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
