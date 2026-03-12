import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Starting Seeding...');

  // 1. Create Admin User
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@smartcampus.edu' },
    update: {
      universityId: '10101010',
    },
    create: {
      email: 'admin@smartcampus.edu',
      name: 'System Admin',
      universityId: '10101010',
      password: adminPassword,
      role: UserRole.ADMIN,
      firstName: 'System',
      lastName: 'Admin',
      isActive: true,
    }
  });
  console.log('✅ Admin user created/verified');

  // 2. Create Sample Student User
  const studentPassword = await bcrypt.hash('student123', 10);
  const student = await prisma.user.upsert({
    where: { email: 'student@smartcampus.edu' },
    update: {
      universityId: '20202020',
    },
    create: {
      email: 'student@smartcampus.edu',
      name: 'Sample Student',
      universityId: '20202020',
      password: studentPassword,
      role: UserRole.STUDENT,
      firstName: 'Sample',
      lastName: 'Student',
      major: 'IS',
      level: 1,
      isActive: true,
    }
  });
  console.log('✅ Student user created/verified');

  console.log('\n✨ Seeding of core users finished.');
  console.log('-----------------------------------');
  console.log('Admin Email: admin@smartcampus.edu');
  console.log('Admin Pass:  admin123');
  console.log('-----------------------------------');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
