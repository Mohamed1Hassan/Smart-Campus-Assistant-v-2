import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const fixes = [
        { courseId: 722, doctorId: 35 }, // E-Commerce -> د/ جمال حمدان (Assumed ID from name match if possible, or I'll just look it up)
        { courseId: 728, doctorId: 54 }, // Operations Research -> أ.م.د حسن صلاح محمد الدسوقى
        { courseId: 726, doctorId: 64 }, // Data Structures -> أ.م.د إيمان منير على
        { courseId: 795, doctorId: 44 }, // Innovative Thinking -> د. وليد محمد ميلاد
        { courseId: 792, doctorId: 52 }, // Sociology -> د. عمرو محمد ابراهيم محمد
    ];

    // Wait, I need to verify the IDs of these doctors first to be 100% sure.
    // I will fetch them by name or look at the audit log again.
    // Actually, I can just use a script that finds the doctor by name from the schedule.

    console.log('--- Fixing remaining 5 courses ---');

    const coursesToFix = [722, 728, 726, 795, 792];

    for (const id of coursesToFix) {
        const course = await prisma.course.findUnique({
            where: { id },
            include: { schedules: { include: { professor: true } } }
        });

        if (!course) continue;

        const doctor = course.schedules.find(s =>
            s.professor?.name.includes('د.') ||
            s.professor?.name.includes('أ.د') ||
            s.professor?.name.includes('د/')
        )?.professor;

        if (doctor) {
            await prisma.course.update({
                where: { id },
                data: { professorId: doctor.id }
            });
            console.log(`Updated course ${id} (${course.courseName}): Set lead to ${doctor.name}`);
        }
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
