import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('=== SMART CAMPUS SYSTEM AUDIT ===\n');

    // 1. Room Names Audit
    console.log('--- 1. Room Names Audit ---');
    const schedules = await prisma.schedule.findMany({
        select: { room: true },
        distinct: ['room']
    });
    const rooms = schedules.map(s => s.room).filter(Boolean);
    console.log('Unique rooms found:', rooms);

    const messyRooms = rooms.filter(r => r?.includes('-') && r?.toLowerCase().includes('building'));
    if (messyRooms.length > 0) {
        console.log('⚠️  Messy room names detected (e.g., Building A104 - A104):', messyRooms);
    } else {
        console.log('✅ Room names seem cleaned up.');
    }

    // 2. Course Levels & Duplicates Audit
    console.log('\n--- 2. Course Levels & Duplicate Codes ---');
    const courses = await prisma.course.findMany({
        select: { courseCode: true, level: true, courseName: true, major: true, semester: true }
    });

    interface CourseAudit {
        courseCode: string;
        level: number | null;
        courseName: string;
        major: string | null;
        semester: string;
    }

    const codeGroups = new Map<string, CourseAudit[]>();
    courses.forEach(c => {
        if (!codeGroups.has(c.courseCode)) codeGroups.set(c.courseCode, []);
        codeGroups.get(c.courseCode)!.push(c);
    });

    let multiLevelCount = 0;
    for (const [code, items] of codeGroups) {
        const levels = new Set(items.map(i => i.level));
        if (levels.size > 1) {
            console.log(`❌ Course ${code} has multiple levels:`, [...levels]);
            multiLevelCount++;
        }
    }
    if (multiLevelCount === 0) console.log('✅ No multiple levels per course code found.');

    // 3. IS Courses Consistency
    console.log('\n--- 3. IS Courses (Information Systems) Audit ---');
    const isCourses = courses.filter(c => c.major === 'IS' || c.courseName?.includes('نظم'));

    const arabicNames = isCourses.filter(c => /[\u0600-\u06FF]/.test(c.courseName || ''));
    if (arabicNames.length > 0) {
        console.log(`⚠️  Found ${arabicNames.length} IS courses with Arabic names:`);
        arabicNames.forEach(c => console.log(`   - [${c.courseCode}] ${c.courseName}`));
    } else {
        console.log('✅ All IS course names are unified to English.');
    }

    // 4. Orphan Schedules
    console.log('\n--- 4. Orphan Schedules Audit ---');
    const schedulesCount = await prisma.schedule.count();
    console.log(`Total schedules: ${schedulesCount}`);

    // Check for schedules where courseId doesn't exist in Course table
    const allScheduleCourseIds = await prisma.schedule.findMany({ select: { courseId: true }, distinct: ['courseId'] });
    const existingCourseIds = (await prisma.course.findMany({ select: { id: true } })).map(c => c.id);
    const orphanIds = allScheduleCourseIds.filter(s => !existingCourseIds.includes(s.courseId)).map(s => s.courseId);

    if (orphanIds.length > 0) {
        console.log(`⚠️  Found ${orphanIds.length} schedules pointing to non-existent courses (IDs: ${orphanIds.join(', ')}).`);
    } else {
        console.log('✅ No orphan schedules found.');
    }

    console.log('\n=== AUDIT COMPLETE ===');
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
