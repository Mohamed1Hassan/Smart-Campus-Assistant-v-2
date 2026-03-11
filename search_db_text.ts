import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function search() {
    const query = 'الترم';
    const query2 = 'Term';
    console.log(`Searching for "${query}" and "${query2}" in all tables...`);

    const models = Object.keys(prisma).filter(key => !key.startsWith('_') && !key.startsWith('$'));

    for (const model of models) {
        try {
            const records = await (prisma as unknown as Record<string, { findMany: () => Promise<Record<string, unknown>[]> }>)[model].findMany();
            if (records.length === 0) continue;

            for (const record of records) {
                const str = JSON.stringify(record);
                if (str.includes(query) || str.includes(query2)) {
                    console.log(`MATCH FOUND in [${model}]:`, JSON.stringify(record, null, 2));
                }
            }
        } catch {
            // Skip models that are not queryable or throw errors
        }
    }

    process.exit(0);
}

search();
