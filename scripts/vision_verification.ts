import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const prisma = new PrismaClient();

const SCHEDULES_DIR = 'schedules';

async function main() {
    console.log("=== Vision Verification Sampler ===");

    const majors = fs.readdirSync(SCHEDULES_DIR).filter(f => fs.statSync(path.join(SCHEDULES_DIR, f)).isDirectory());

    const report: any[] = [];

    for (const majorFolder of majors) {
        const majorPath = path.join(SCHEDULES_DIR, majorFolder);
        const images = fs.readdirSync(majorPath).filter(f => f.endsWith('.png') || f.endsWith('.jpg'));

        if (images.length === 0) continue;

        // Sample 1 image per major
        const sampleImage = images[0];
        const imageFullPath = path.resolve(majorPath, sampleImage);

        // Get DB data for this major
        // Map Arabic folder name to DB major code
        const majorMap: Record<string, string> = {
            'ادارة اعمال': 'BA',
            'ادارة بنوك': 'BM',
            'المحاسبة': 'ACC',
            'علوم الحاسب': 'CS',
            'محاسبة إنجليزي': 'ACC-EN',
            'نظم معلومات': 'IS'
        };

        const majorCode = majorMap[majorFolder] || majorFolder;

        const courseCount = await prisma.course.count({ where: { major: majorCode } });
        const scheduleCount = await prisma.schedule.count({
            where: { course: { major: majorCode } }
        });

        const sampleCourses = await prisma.course.findMany({
            where: { major: majorCode },
            include: { professor: true },
            take: 3
        });

        report.push({
            majorFolder,
            majorCode,
            sampleImage: imageFullPath,
            stats: { courseCount, scheduleCount },
            dbSamples: sampleCourses.map(c => ({
                name: c.courseName,
                prof: c.professor.name,
                level: c.level
            }))
        });
    }

    // Write report to a file for the agent to read and present
    fs.writeFileSync('vision_audit_report.json', JSON.stringify(report, null, 2));
    console.log("Verification report generated: vision_audit_report.json");

    console.log("\nSummary of DB state for verification:");
    report.forEach(r => {
        console.log(`\nMajor: ${r.majorFolder} (${r.majorCode})`);
        console.log(`- DB Stats: ${r.stats.courseCount} courses, ${r.stats.scheduleCount} schedules`);
        console.log(`- Sample Image: ${r.sampleImage}`);
        console.log("- DB Samples:");
        r.dbSamples.forEach((s: any) => console.log(`  * ${s.name} - ${s.prof} (Level ${s.level})`));
    });
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
