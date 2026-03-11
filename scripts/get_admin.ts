import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    try {
        let admin = await prisma.user.findFirst({
            where: { role: 'ADMIN' },
        });

        if (admin) {
            console.log('--- FOUND EXISTING ADMIN ---');
            console.log(`Email: ${admin.email}`);
            console.log('Password: (Whatever password this account was created with)');
        } else {
            console.log('--- NO ADMIN FOUND. CREATING ONE... ---');

            // Hash a default password
            const hashedPassword = await bcrypt.hash('admin1234', 10);

            admin = await prisma.user.create({
                data: {
                    firstName: 'System',
                    lastName: 'Admin',
                    name: 'System Admin',
                    email: 'admin@smartcampus.edu',
                    password: hashedPassword,
                    universityId: 'ADM-001',
                    role: 'ADMIN',
                },
            });

            console.log('--- NEW ADMIN CREATED ---');
            console.log(`Email: ${admin.email}`);
            console.log(`Password: admin1234`);
        }
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
