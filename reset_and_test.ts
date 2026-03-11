import { PrismaClient } from '@prisma/client';
import { CourseService } from './src/services/course.service';

const prisma = new PrismaClient();

async function resetAndTest() {
    console.log('--- 1. Resetting State ---');
    // Delete the 66 Spring courses from the last test
    await prisma.course.deleteMany({ where: { semester: 'SPRING' } });

    // Reactivate Fall courses
    await prisma.course.updateMany({
        where: { semester: 'FALL' },
        data: { isActive: true, isArchived: false }
    });

    // Reactivate Fall enrollments
    await prisma.courseEnrollment.updateMany({
        where: { course: { semester: 'FALL' }, status: 'COMPLETED' },
        data: { status: 'ACTIVE' }
    });

    console.log('Fall reset to Active. Running Rollover...');

    console.log('\n--- 2. Executing Rollover ---');
    const count = await CourseService.rolloverCoursesToNewSemester('FALL', '2025-2026', 'SPRING', '2025-2026');
    console.log(`Rolled over ${count} courses.`);

    console.log('\n--- 3. Verifying Student 75 ---');
    const s75Enrollments = await prisma.courseEnrollment.findMany({
        where: { studentId: 75, status: 'ACTIVE' },
        include: { course: { select: { courseName: true, semester: true } } }
    });

    console.log(`Active Enrollments for Student 75 (${s75Enrollments.length} total):`);
    s75Enrollments.forEach(enr => console.log(`  - [${enr.course.semester}] ${enr.course.courseName}`));

    process.exit(0);
}

resetAndTest();
