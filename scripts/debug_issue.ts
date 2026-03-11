import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const universityId = '20221245';
    const courseNamePart = 'Risk Management';

    console.log(`--- Diagnostics for Student ${universityId} and Course ${courseNamePart} ---`);

    // 1. Find Student
    const student = await prisma.user.findUnique({
        where: { universityId },
        select: { id: true, name: true, major: true, level: true }
    });

    if (!student) {
        console.error('Student not found');
        return;
    }
    console.log('Student:', student);

    // 2. Find Course
    const courses = await prisma.course.findMany({
        where: {
            courseName: { contains: courseNamePart, mode: 'insensitive' },
            major: student.major,
            level: student.level
        },
        include: {
            professor: {
                select: { id: true, name: true, firstName: true, lastName: true, role: true }
            },
            schedules: {
                include: {
                    professor: {
                        select: { id: true, name: true, firstName: true, lastName: true, role: true }
                    }
                }
            }
        }
    });

    if (courses.length === 0) {
        console.log('No matching courses found for student major/level');
        return;
    }

    courses.forEach(course => {
        console.log('\nCourse:', {
            id: course.id,
            code: course.courseCode,
            name: course.courseName,
            leadProfessor: course.professor
        });
        console.log('Schedules:');
        course.schedules.forEach(s => {
            console.log(`- Day ${s.dayOfWeek}: ${s.startTime}-${s.endTime} | Prof: ${s.professor?.name} (${s.professorId}) | Role: ${s.professor?.role}`);
        });
    });
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
