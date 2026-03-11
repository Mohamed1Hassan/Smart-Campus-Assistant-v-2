import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fullReset() {
    console.log('--- Wiping fake Study Plan Spring Courses ---');
    await prisma.course.deleteMany({ where: { semester: 'SPRING' } });

    console.log('--- Restoring Fall Courses ---');
    await prisma.course.updateMany({
        where: { semester: 'FALL' },
        data: { isActive: true, isArchived: false }
    });

    console.log('--- Restoring Student Enrollments to Fall ---');
    await prisma.courseEnrollment.updateMany({
        where: { course: { semester: 'FALL' }, status: 'COMPLETED' },
        data: { status: 'ACTIVE' }
    });

    console.log('Database restored. All 6 Fall courses are active again.');
    process.exit(0);
}

fullReset();
