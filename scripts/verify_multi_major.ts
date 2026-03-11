import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
const prisma = new PrismaClient();

async function main() {
    console.log("=== Comprehensive Multi-Major Verification ===");

    const majors = [
        { code: 'BA', folder: 'ادارة اعمال', level: 1 },
        { code: 'CS', folder: 'علوم الحاسب', level: 1 },
        { code: 'IS', folder: 'نظم معلومات', level: 1 },
        { code: 'ACC-EN', folder: 'محاسبة إنجليزي', level: 1 }
    ];

    for (const m of majors) {
        console.log(`\n--- Major: ${m.folder} (${m.code}) | Level: ${m.level} ---`);
        const courses = await prisma.course.findMany({
            where: { major: m.code, level: m.level, semester: 'SPRING' },
            include: { professor: true, schedules: true },
            take: 5
        });

        courses.forEach(c => {
            console.log(`Course: "${c.courseName}" | Prof: ${c.professor.name}`);
            c.schedules.forEach(s => {
                console.log(`  - Schedule: Day ${s.dayOfWeek}, ${s.startTime}-${s.endTime}`);
            });
        });
    }
}

main().finally(() => prisma.$disconnect());
