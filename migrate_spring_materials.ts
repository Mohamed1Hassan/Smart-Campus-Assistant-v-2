import prisma from './src/lib/db';

async function migrateExistingSpringData() {
    console.log('--- Migrating missing data for Spring 2025-2026 ---');

    try {
        const fallCourses = await prisma.course.findMany({
            where: { semester: 'FALL', academicYear: '2025-2026' },
            include: { materials: true, schedules: true }
        });

        const springCourses = await prisma.course.findMany({
            where: { semester: 'SPRING', academicYear: '2025-2026' }
        });

        const springCourseMap = new Map(springCourses.map(c => [c.courseCode, c.id]));

        const materialsToCreate: {
            title: string;
            description: string | null;
            type: string;
            url: string;
            fileSize: number | null;
            courseId: number;
            createdAt: Date;
        }[] = [];

        for (const fallCourse of fallCourses) {
            const springCourseId = springCourseMap.get(fallCourse.courseCode);
            if (!springCourseId) continue;

            // Check if materials already exist
            const existingMaterialsCount = await prisma.courseMaterial.count({ where: { courseId: springCourseId } });
            if (existingMaterialsCount === 0) {
                for (const material of fallCourse.materials) {
                    materialsToCreate.push({
                        title: material.title,
                        description: material.description,
                        type: material.type,
                        url: material.url,
                        fileSize: material.fileSize,
                        courseId: springCourseId,
                        createdAt: new Date()
                    });
                }
            }

            // Note: The diagnostic script showed that schedules are already present (e.g. 11 for IS401),
            // but materials were 0. So we only need to migrate materials for these already-rolled-over courses.
        }

        if (materialsToCreate.length > 0) {
            console.log(`Creating ${materialsToCreate.length} missing materials...`);
            const created = await prisma.courseMaterial.createMany({ data: materialsToCreate });
            console.log(`Created ${created.count} materials.`);
        } else {
            console.log('No missing materials to migrate.');
        }

        console.log('--- Migration complete ---');
    } catch (e) {
        console.error('Error during migration:', e);
    }

    process.exit(0);
}

migrateExistingSpringData();
