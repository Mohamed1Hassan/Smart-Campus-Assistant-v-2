import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanup() {
    console.log('--- Room Names Cleanup ---');

    // Define problematic room names and their fixes
    const roomFixes: Record<string, string> = {
        'الخوارزمي 502 - 502': 'A502',
        '302 - A302أ.د. طه حسين': 'A302',
        'B206B206': 'B206',
        '503': 'A503' // Example mapping based on audit
    };

    for (const [bad, good] of Object.entries(roomFixes)) {
        const result = await prisma.schedule.updateMany({
            where: { room: bad },
            data: { room: good }
        });
        if (result.count > 0) {
            console.log(`✅ Updated ${result.count} records: "${bad}" -> "${good}"`);
        }
    }

    console.log('\n--- Building names cleanup ---');
    // Generic fix for "Building A104 - A104" -> "A104"
    const allSchedules = await prisma.schedule.findMany({
        where: {
            room: { contains: 'Building' }
        }
    });

    for (const schedule of allSchedules) {
        if (schedule.room) {
            const match = schedule.room.match(/([A-Z]\d{3})/);
            if (match) {
                const cleaned = match[1];
                await prisma.schedule.update({
                    where: { id: schedule.id },
                    data: { room: cleaned }
                });
                console.log(`✅ Cleaned schedule ${schedule.id}: "${schedule.room}" -> "${cleaned}"`);
            }
        }
    }

    console.log('\nCleanup complete!');
}

cleanup()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
