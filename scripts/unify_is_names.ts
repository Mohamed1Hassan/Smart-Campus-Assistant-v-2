import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const NAME_MAPPING: Record<string, string> = {
    'نظم المعلومات المحاسبية': 'Accounting Information Systems',
    'مراجعة النظم الالكترونية': 'Electronic Systems Auditing',
    'النظم الخبيرة': 'Expert Systems',
    'المحاسبة فى الوحدات الحكومية غير': 'Accounting in Non-Profit Government Units',
    'المحاسبة في الوحدات الحكومية غير': 'Accounting in Non-Profit Government Units',
    'أمن المعلومات': 'Information Security'
};

async function unifyNames() {
    console.log('--- Unifying IS Course Names to English ---');

    const courses = await prisma.course.findMany({
        where: {
            OR: [
                { major: 'IS' },
                { courseName: { contains: 'نظم' } },
                { courseName: { contains: 'معلومات' } }
            ]
        }
    });

    let updatedCount = 0;
    for (const course of courses) {
        const arabicName = course.courseName || '';
        const englishName = NAME_MAPPING[arabicName.trim()];

        if (englishName) {
            await prisma.course.update({
                where: { id: course.id },
                data: { courseName: englishName }
            });
            console.log(`✅ Updated [${course.courseCode}]: "${arabicName}" -> "${englishName}"`);
            updatedCount++;
        } else if (/[\u0600-\u06FF]/.test(arabicName)) {
            console.warn(`⚠️  No mapping found for: "${arabicName}" ([${course.courseCode}])`);
        }
    }

    console.log(`\nUnification complete! Total updated: ${updatedCount}`);
}

unifyNames()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
