import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- Auditing Course Lead Professors ---');

    const courses = await prisma.course.findMany({
        where: { isActive: true },
        include: {
            professor: {
                select: { id: true, name: true }
            },
            schedules: {
                where: { isActive: true },
                include: {
                    professor: {
                        select: { id: true, name: true }
                    }
                }
            }
        }
    });

    const issues = [];

    for (const course of courses) {
        const leadName = course.professor?.name || '';
        const isLeadTA = leadName.includes('م.') || leadName.includes('Eng.'); // Common TA prefixes

        if (isLeadTA) {
            // Look for a Doctor in schedules
            const doctorInSchedule = course.schedules.find(s =>
                s.professor?.name.includes('د.') ||
                s.professor?.name.includes('Dr.')
            );

            if (doctorInSchedule) {
                issues.push({
                    courseId: course.id,
                    courseName: course.courseName,
                    currentLead: leadName,
                    foundDoctor: doctorInSchedule.professor?.name,
                    doctorId: doctorInSchedule.professorId
                });
            }
        }
    }

    if (issues.length === 0) {
        console.log('No inconsistent lead professors found.');
    } else {
        console.log(`Found ${issues.length} potential issues:`);
        console.table(issues);
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
