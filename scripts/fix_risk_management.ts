import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const courseId = 825; // Risk Management & Information Security
    const correctProfId = 51; // د. شريف محمد صبحي

    console.log(`Updating Course ${courseId} to lead professor ${correctProfId}...`);

    try {
        const updatedCourse = await prisma.course.update({
            where: { id: courseId },
            data: { professorId: correctProfId },
            include: {
                professor: {
                    select: { name: true }
                }
            }
        });

        console.log('Update successful:', {
            id: updatedCourse.id,
            name: updatedCourse.courseName,
            newLeadProfessor: updatedCourse.professor.name
        });
    } catch (error) {
        console.error('Failed to update course:', error);
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
