import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
const prisma = new PrismaClient();

async function main() {
    console.log("=== DB Verification: Level 2 BA Spring ===");
    const courses = await prisma.course.findMany({
        where: {
            major: 'BA',
            level: 2,
            semester: 'SPRING'
        },
        include: {
            professor: true,
            schedules: {
                include: {
                    professor: true
                }
            }
        }
    });

    courses.forEach(c => {
        console.log(`\nCourse: "${c.courseName}" (Code: ${c.courseCode})`);
        console.log(`Main Professor: ${c.professor.name} (ID: ${c.professorId})`);
        console.log("Schedules:");
        c.schedules.forEach(s => {
            console.log(` - Day ${s.dayOfWeek} | ${s.startTime}-${s.endTime} | Prof: ${s.professor.name}`);
        });
    });
}

main().finally(() => prisma.$disconnect());
