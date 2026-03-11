import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const prisma = new PrismaClient();

// Normalized Professor Name Mapping
const MANUAL_PROF_MAP: Record<string, string> = {
    'شيماءروبيمنصورعبدالجواد': 'شيماءروبيمنصور',
    'ندىمحسنفايقمحمدعبدالرحيم': 'ندىمحسنفايقمحمدعبدالرازق',
    'ندامحسنفايقمحمدعبدالرحيم': 'ندىمحسنفايقمحمدعبدالرازق',
    'ايمانرمضاناحمدعبدالتواب': 'ايمانرمضاناحمدعبدالله',
    'حساممحمدسيدشعلان': 'حساممحمدسيد',
};

function normalizeName(name: string): string {
    return name
        .replace(/^(أ\.م\.د\.?|أ\.د\.?|د\.?|م\.م\.?|م\.?|ا\.?)\s+/i, '')
        .replace(/[أإآ]/g, 'ا')
        .replace(/ة/g, 'ه')
        .replace(/[ىی]/g, 'ي')
        .replace(/[ًٌٍَُِّْ]/g, '')
        .replace(/[.\s,،]/g, '')
        .toLowerCase()
        .trim();
}

async function main() {
    console.log("Starting optimized consistency fix...");

    const rawData = JSON.parse(fs.readFileSync('full_extracted_schedules.json', 'utf8'));
    const allProfs = await prisma.user.findMany({ where: { role: 'PROFESSOR' } });

    const profMap = new Map<string, number>();
    allProfs.forEach(p => {
        profMap.set(normalizeName(p.name), p.id);
        profMap.set(normalizeName(`${p.firstName} ${p.lastName}`), p.id);
    });

    console.log(`Loaded ${allProfs.length} professors.`);

    const allCourses = await prisma.course.findMany();
    console.log(`Loaded ${allCourses.length} courses into memory.`);

    const courseProfessorMap = new Map<number, number>(); // courseId -> profId

    console.log("Processing JSON data in memory...");
    for (const entry of rawData) {
        let normName = normalizeName(entry.professor);
        if (MANUAL_PROF_MAP[normName]) normName = MANUAL_PROF_MAP[normName];

        const profId = profMap.get(normName);
        if (!profId) continue;

        const level = (entry.level === 'الأولى' || entry.level === 'الأول' ? 1 :
            entry.level === 'الثانية' || entry.level === 'الثاني' ? 2 :
                entry.level === 'الثالثة' || entry.level === 'الثالث' ? 3 : 4);
        const major = entry.majorCode || entry.majorFolder;
        const semester = entry.semester === 'Spring 2024' ? 'SPRING' : 'FALL';

        const matches = allCourses.filter(c =>
            c.major === major &&
            c.semester === semester &&
            c.level === level
        );

        for (const course of matches) {
            // Priority: Lecture professor takes precedence, or first one found
            if (entry.type === 'LECTURE' || !courseProfessorMap.has(course.id)) {
                courseProfessorMap.set(course.id, profId);
            }
        }
    }

    console.log(`Determined assignments for ${courseProfessorMap.size} courses. Applying updates...`);

    let fixedCourses = 0;
    let fixedSchedules = 0;

    for (const [courseId, profId] of courseProfessorMap.entries()) {
        const course = allCourses.find(c => c.id === courseId);
        if (course && course.professorId !== profId) {
            try {
                await prisma.course.update({
                    where: { id: courseId },
                    data: { professorId: profId }
                });
                fixedCourses++;

                const result = await prisma.schedule.updateMany({
                    where: { courseId: courseId },
                    data: { professorId: profId }
                });
                fixedSchedules += result.count;

                if (fixedCourses % 10 === 0) console.log(`Progress: ${fixedCourses} courses fixed...`);
            } catch (e) {
                console.error(`Failed to update course ${courseId}:`, e);
            }
        }
    }

    console.log(`\nConsistency check complete.`);
    console.log(`Fixed Courses: ${fixedCourses}`);
    console.log(`Fixed Schedules: ${fixedSchedules}`);
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
